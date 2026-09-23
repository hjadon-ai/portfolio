const { PlaidFinanceProvider } = require('./PlaidFinanceProvider');

function financeProvider(name) {
  if (name !== 'plaid') return null;
  return new PlaidFinanceProvider();
}

module.exports = { financeProvider };
