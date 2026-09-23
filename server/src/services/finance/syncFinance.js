const {
  FinanceAccount,
  FinanceConnection,
  FinanceHolding,
  FinanceTransaction
} = require('../../models/Finance');
const { decryptToken } = require('./tokenEncryption');
const { getRuntimeConfig } = require('../../config/runtime');

const numberOrNull = (value) => typeof value === 'number' && Number.isFinite(value) ? value : null;
const cents = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

function assetClass(type) {
  if (type === 'investment' || type === 'brokerage') return 'investment';
  if (type === 'credit' || type === 'loan') return 'debt';
  return 'cash';
}

function currency(record) {
  return record.iso_currency_code || record.unofficial_currency_code || 'USD';
}

function transactionDirection(transaction) {
  const primary = transaction.personal_finance_category?.primary || '';
  if (['TRANSFER_IN', 'TRANSFER_OUT', 'LOAN_PAYMENTS'].includes(primary)) return 'other';
  if (primary === 'INCOME') return 'income';
  return transaction.amount > 0 ? 'expense' : 'income';
}

function providerErrorCode(error) {
  return typeof error.code === 'string' && /^[A-Z0-9_]{1,80}$/.test(error.code)
    ? error.code
    : 'SYNC_FAILED';
}

function calculateTotals(accounts, reportingCurrency = 'USD') {
  const included = accounts.filter((account) => account.currency === reportingCurrency);
  const total = (kind) => cents(included.filter((account) => account.assetClass === kind)
    .reduce((sum, account) => sum + (account.currentBalance || 0), 0));
  const cash = total('cash');
  const investments = total('investment');
  const debt = total('debt');
  return {
    totals: { netWorth: cents(cash + investments - debt), cash, investments, debt },
    excludedCurrencyAccountCount: accounts.length - included.length
  };
}

function calculateSpending(transactions) {
  const categories = new Map();
  for (const transaction of transactions) {
    categories.set(transaction.category, cents((categories.get(transaction.category) || 0) + transaction.amount));
  }
  return {
    total: cents(transactions.reduce((sum, transaction) => sum + transaction.amount, 0)),
    categories: [...categories.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
  };
}

async function removeAccountData(accountIds) {
  if (!accountIds.length) return;
  await Promise.all([
    FinanceTransaction.deleteMany({ accountId: { $in: accountIds } }),
    FinanceHolding.deleteMany({ accountId: { $in: accountIds } })
  ]);
  await FinanceAccount.deleteMany({ _id: { $in: accountIds } });
}

async function removeConnectionData(connection) {
  await Promise.all([
    FinanceTransaction.deleteMany({ connectionId: connection._id }),
    FinanceHolding.deleteMany({ connectionId: connection._id }),
    FinanceAccount.deleteMany({ connectionId: connection._id })
  ]);
  await FinanceConnection.deleteOne({ _id: connection._id, userId: connection.userId });
}

function assertConnectionEnvironment(connection, activeEnvironment = getRuntimeConfig().plaidEnvironment) {
  if (connection.providerEnvironment !== activeEnvironment) {
    const error = new Error('The stored Finance connection belongs to a different provider environment.');
    error.code = 'PROVIDER_ENVIRONMENT_MISMATCH';
    throw error;
  }
}

async function synchronizeConnection(connection, provider) {
  assertConnectionEnvironment(connection);
  connection.lastSyncStartedAt = new Date();
  await connection.save();

  try {
    const accessToken = decryptToken(connection.encryptedAccessToken);
    const snapshot = await provider.syncConnection(accessToken, connection.transactionCursor);
    const excluded = new Set(connection.excludedProviderAccountIds);
    const now = new Date();
    const accountByProviderId = new Map();

    for (const account of snapshot.accounts) {
      if (excluded.has(account.account_id)) continue;
      const saved = await FinanceAccount.findOneAndUpdate(
        { userId: connection.userId, providerAccountId: account.account_id },
        { $set: {
          connectionId: connection._id,
          name: account.name || 'Account',
          officialName: account.official_name || null,
          mask: account.mask || null,
          type: account.type || 'other',
          subtype: account.subtype || null,
          assetClass: assetClass(account.type),
          currency: currency(account),
          currentBalance: numberOrNull(account.balances?.current),
          availableBalance: numberOrNull(account.balances?.available),
          creditLimit: numberOrNull(account.balances?.limit),
          balanceAsOf: now
        }, $setOnInsert: { userId: connection.userId, providerAccountId: account.account_id } },
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      accountByProviderId.set(account.account_id, saved);
    }

    const activeProviderIds = [...accountByProviderId.keys()];
    const staleAccounts = await FinanceAccount.find({
      connectionId: connection._id,
      ...(activeProviderIds.length ? { providerAccountId: { $nin: activeProviderIds } } : {})
    }).select('_id');
    await removeAccountData(staleAccounts.map((account) => account._id));

    for (const transaction of [...snapshot.transactions.added, ...snapshot.transactions.modified]) {
      const account = accountByProviderId.get(transaction.account_id);
      if (!account) continue;
      await FinanceTransaction.findOneAndUpdate(
        { userId: connection.userId, providerTransactionId: transaction.transaction_id },
        { $set: {
          connectionId: connection._id,
          accountId: account._id,
          date: transaction.date,
          authorizedDate: transaction.authorized_date || null,
          name: transaction.name || 'Transaction',
          merchantName: transaction.merchant_name || null,
          amount: transaction.amount,
          currency: currency(transaction),
          direction: transactionDirection(transaction),
          category: transaction.personal_finance_category?.primary || 'OTHER',
          categoryDetail: transaction.personal_finance_category?.detailed || null,
          pending: Boolean(transaction.pending)
        }, $setOnInsert: {
          userId: connection.userId,
          providerTransactionId: transaction.transaction_id
        } },
        { upsert: true, runValidators: true }
      );
    }

    const removedIds = snapshot.transactions.removed.map((item) => item.transaction_id);
    if (removedIds.length) {
      await FinanceTransaction.deleteMany({
        userId: connection.userId,
        providerTransactionId: { $in: removedIds }
      });
    }

    await FinanceHolding.deleteMany({ connectionId: connection._id });
    const securityById = new Map(snapshot.securities.map((security) => [security.security_id, security]));
    const holdings = snapshot.holdings.flatMap((holding) => {
      const account = accountByProviderId.get(holding.account_id);
      if (!account) return [];
      const security = securityById.get(holding.security_id) || {};
      return [{
        userId: connection.userId,
        connectionId: connection._id,
        accountId: account._id,
        providerSecurityId: holding.security_id,
        name: security.name || security.ticker_symbol || 'Investment holding',
        tickerSymbol: security.ticker_symbol || null,
        securityType: security.type || null,
        quantity: numberOrNull(holding.quantity) || 0,
        price: numberOrNull(holding.institution_price ?? security.close_price),
        marketValue: numberOrNull(holding.institution_value) || 0,
        currency: currency(holding),
        priceAsOf: security.close_price_as_of ? new Date(`${security.close_price_as_of}T00:00:00.000Z`) : null
      }];
    });
    if (holdings.length) await FinanceHolding.insertMany(holdings);

    connection.transactionCursor = snapshot.transactions.cursor;
    connection.status = 'active';
    connection.lastSuccessfulSyncAt = now;
    connection.lastSyncErrorCode = null;
    await connection.save();
    return { connectionId: String(connection._id), status: 'complete', lastSuccessfulSyncAt: now };
  } catch (error) {
    const code = providerErrorCode(error);
    connection.status = code === 'ITEM_LOGIN_REQUIRED' ? 'login_required' : 'sync_error';
    connection.lastSyncErrorCode = code;
    await connection.save();
    throw error;
  }
}

module.exports = {
  assetClass,
  assertConnectionEnvironment,
  calculateSpending,
  calculateTotals,
  removeAccountData,
  removeConnectionData,
  synchronizeConnection,
  transactionDirection
};
