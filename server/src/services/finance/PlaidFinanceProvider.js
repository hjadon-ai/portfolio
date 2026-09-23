const { getRuntimeConfig } = require('../../config/runtime');

class FinanceProviderError extends Error {
  constructor(code, message = 'The finance provider could not complete this request.') {
    super(message);
    this.name = 'FinanceProviderError';
    this.code = code || 'PROVIDER_ERROR';
  }
}

class PlaidFinanceProvider {
  constructor() {
    const runtime = getRuntimeConfig();
    this.baseUrl = runtime.plaidBaseUrl;
    this.environment = runtime.plaidEnvironment;
  }

  configured() {
    return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET && process.env.FINANCE_TOKEN_ENCRYPTION_KEY);
  }

  assertConfigured() {
    if (!this.configured()) {
      throw new FinanceProviderError('PROVIDER_NOT_CONFIGURED', `Plaid ${this.environment} is not configured on the local server.`);
    }
  }

  async request(path, body) {
    this.assertConfigured();
    let response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
          'Plaid-Version': '2020-09-14'
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000)
      });
    } catch (error) {
      throw new FinanceProviderError('PROVIDER_UNAVAILABLE');
    }

    let result;
    try {
      result = await response.json();
    } catch (error) {
      throw new FinanceProviderError('PROVIDER_INVALID_RESPONSE');
    }
    if (!response.ok) {
      throw new FinanceProviderError(result.error_code || 'PROVIDER_REJECTED_REQUEST');
    }
    return result;
  }

  async createConnectionSession(userId) {
    const result = await this.request('/link/token/create', {
      user: { client_user_id: String(userId) },
      client_name: 'Astitva',
      products: ['transactions'],
      additional_consented_products: ['investments'],
      country_codes: ['US'],
      language: 'en'
    });
    return { sessionToken: result.link_token, expiresAt: result.expiration };
  }

  async completeConnection(exchangeToken) {
    const exchange = await this.request('/item/public_token/exchange', { public_token: exchangeToken });
    const itemResult = await this.request('/item/get', { access_token: exchange.access_token });
    const institutionId = itemResult.item?.institution_id || 'unknown';
    let institutionName = 'Connected institution';

    if (institutionId !== 'unknown') {
      try {
        const institution = await this.request('/institutions/get_by_id', {
          institution_id: institutionId,
          country_codes: ['US']
        });
        institutionName = institution.institution?.name || institutionName;
      } catch (error) {
        if (!(error instanceof FinanceProviderError)) throw error;
      }
    }

    return {
      accessToken: exchange.access_token,
      providerItemId: exchange.item_id,
      institutionId,
      institutionName
    };
  }

  async syncConnection(accessToken, initialCursor) {
    const accountsResult = await this.request('/accounts/get', { access_token: accessToken });
    const accountTypes = new Set(accountsResult.accounts.map((account) => account.type));
    let cursor = initialCursor || null;
    const added = [];
    const modified = [];
    const removed = [];

    do {
      const page = await this.request('/transactions/sync', {
        access_token: accessToken,
        ...(cursor ? { cursor } : {}),
        count: 500
      });
      added.push(...page.added);
      modified.push(...page.modified);
      removed.push(...page.removed);
      cursor = page.next_cursor;
      if (!page.has_more) break;
    } while (true);

    let holdings = [];
    let securities = [];
    if (accountTypes.has('investment') || accountTypes.has('brokerage')) {
      try {
        const result = await this.request('/investments/holdings/get', { access_token: accessToken });
        holdings = result.holdings || [];
        securities = result.securities || [];
      } catch (error) {
        if (!['PRODUCT_NOT_READY', 'PRODUCT_NOT_SUPPORTED', 'NO_INVESTMENT_ACCOUNTS'].includes(error.code)) throw error;
      }
    }

    return {
      accounts: accountsResult.accounts,
      transactions: { added, modified, removed, cursor },
      holdings,
      securities
    };
  }

  async disconnect(accessToken) {
    await this.request('/item/remove', { access_token: accessToken });
  }
}

module.exports = { PlaidFinanceProvider, FinanceProviderError };
