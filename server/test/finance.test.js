const assert = require('node:assert/strict');
const test = require('node:test');
const { assetClass, assertConnectionEnvironment, calculateSpending, calculateTotals, transactionDirection } = require('../src/services/finance/syncFinance');
const { encryptToken, decryptToken } = require('../src/services/finance/tokenEncryption');

test('finance access tokens are encrypted and authenticated', () => {
  const originalKey = process.env.FINANCE_TOKEN_ENCRYPTION_KEY;
  process.env.FINANCE_TOKEN_ENCRYPTION_KEY = '11'.repeat(32);
  try {
    const encrypted = encryptToken('access-sandbox-sensitive');
    assert.notEqual(encrypted.ciphertext, 'access-sandbox-sensitive');
    assert.equal(decryptToken(encrypted), 'access-sandbox-sensitive');
    assert.throws(() => decryptToken({ ...encrypted, authTag: Buffer.alloc(16).toString('base64') }));
  } finally {
    if (originalKey === undefined) delete process.env.FINANCE_TOKEN_ENCRYPTION_KEY;
    else process.env.FINANCE_TOKEN_ENCRYPTION_KEY = originalKey;
  }
});

test('Plaid account types map to the three approved summary classes', () => {
  assert.equal(assetClass('depository'), 'cash');
  assert.equal(assetClass('investment'), 'investment');
  assert.equal(assetClass('credit'), 'debt');
  assert.equal(assetClass('loan'), 'debt');
});

test('spending excludes normalized transfers, loan payments, and income', () => {
  assert.equal(transactionDirection({ amount: 25, personal_finance_category: { primary: 'FOOD_AND_DRINK' } }), 'expense');
  assert.equal(transactionDirection({ amount: -1000, personal_finance_category: { primary: 'INCOME' } }), 'income');
  assert.equal(transactionDirection({ amount: 100, personal_finance_category: { primary: 'TRANSFER_OUT' } }), 'other');
  assert.equal(transactionDirection({ amount: 300, personal_finance_category: { primary: 'LOAN_PAYMENTS' } }), 'other');
});

test('USD net worth adds assets, subtracts debt, and reports excluded currencies', () => {
  const result = calculateTotals([
    { assetClass: 'cash', currency: 'USD', currentBalance: 1000 },
    { assetClass: 'investment', currency: 'USD', currentBalance: 5000 },
    { assetClass: 'debt', currency: 'USD', currentBalance: 200 },
    { assetClass: 'cash', currency: 'CAD', currentBalance: 900 }
  ]);
  assert.deepEqual(result, {
    totals: { netWorth: 5800, cash: 1000, investments: 5000, debt: 200 },
    excludedCurrencyAccountCount: 1
  });
});

test('monthly spending totals and sorts normalized categories', () => {
  assert.deepEqual(calculateSpending([
    { category: 'FOOD_AND_DRINK', amount: 20.25 },
    { category: 'TRANSPORTATION', amount: 15 },
    { category: 'FOOD_AND_DRINK', amount: 10 }
  ]), {
    total: 45.25,
    categories: [
      { name: 'FOOD_AND_DRINK', amount: 30.25 },
      { name: 'TRANSPORTATION', amount: 15 }
    ]
  });
});

test('a provider-environment mismatch is rejected before token handling', () => {
  assert.throws(
    () => assertConnectionEnvironment({ providerEnvironment: 'sandbox', encryptedAccessToken: 'not-readable' }, 'production'),
    (error) => error.code === 'PROVIDER_ENVIRONMENT_MISMATCH'
  );
});
