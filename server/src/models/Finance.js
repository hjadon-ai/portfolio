const mongoose = require('mongoose');

const owner = { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true };
const connection = { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceConnection', required: true };

const financeConnectionSchema = new mongoose.Schema({
  userId: owner,
  provider: { type: String, enum: ['plaid'], required: true },
  providerEnvironment: { type: String, enum: ['sandbox', 'production'], required: true },
  providerItemId: { type: String, required: true },
  encryptedAccessToken: {
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    ciphertext: { type: String, required: true }
  },
  institutionId: { type: String, required: true },
  institutionName: { type: String, required: true, maxlength: 160 },
  status: {
    type: String,
    enum: ['active', 'login_required', 'sync_error', 'disconnect_failed'],
    default: 'active'
  },
  excludedProviderAccountIds: { type: [String], default: [] },
  transactionCursor: { type: String, default: null },
  lastSyncStartedAt: { type: Date, default: null },
  lastSuccessfulSyncAt: { type: Date, default: null },
  lastSyncErrorCode: { type: String, default: null }
}, { timestamps: true, collection: 'financeConnections' });
financeConnectionSchema.index(
  { userId: 1, provider: 1, providerEnvironment: 1, providerItemId: 1 },
  { unique: true }
);
financeConnectionSchema.index({ userId: 1, status: 1 });

const financeAccountSchema = new mongoose.Schema({
  userId: owner,
  connectionId: connection,
  providerAccountId: { type: String, required: true },
  name: { type: String, required: true, maxlength: 160 },
  officialName: { type: String, default: null, maxlength: 240 },
  mask: { type: String, default: null, maxlength: 12 },
  type: { type: String, required: true },
  subtype: { type: String, default: null },
  assetClass: { type: String, enum: ['cash', 'investment', 'debt'], required: true },
  currency: { type: String, required: true, uppercase: true, default: 'USD' },
  currentBalance: { type: Number, default: null },
  availableBalance: { type: Number, default: null },
  creditLimit: { type: Number, default: null },
  balanceAsOf: { type: Date, required: true }
}, { timestamps: true, collection: 'financeAccounts' });
financeAccountSchema.index({ userId: 1, providerAccountId: 1 }, { unique: true });
financeAccountSchema.index({ userId: 1, assetClass: 1 });
financeAccountSchema.index({ connectionId: 1 });

const financeTransactionSchema = new mongoose.Schema({
  userId: owner,
  connectionId: connection,
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceAccount', required: true },
  providerTransactionId: { type: String, required: true },
  date: { type: String, required: true },
  authorizedDate: { type: String, default: null },
  name: { type: String, required: true, maxlength: 300 },
  merchantName: { type: String, default: null, maxlength: 300 },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, uppercase: true, default: 'USD' },
  direction: { type: String, enum: ['expense', 'income', 'other'], required: true },
  category: { type: String, default: 'OTHER' },
  categoryDetail: { type: String, default: null },
  pending: { type: Boolean, default: false }
}, { timestamps: true, collection: 'financeTransactions' });
financeTransactionSchema.index({ userId: 1, providerTransactionId: 1 }, { unique: true });
financeTransactionSchema.index({ userId: 1, date: -1 });
financeTransactionSchema.index({ accountId: 1, date: -1 });
financeTransactionSchema.index({ connectionId: 1 });

const financeHoldingSchema = new mongoose.Schema({
  userId: owner,
  connectionId: connection,
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinanceAccount', required: true },
  providerSecurityId: { type: String, required: true },
  name: { type: String, required: true, maxlength: 300 },
  tickerSymbol: { type: String, default: null, maxlength: 32 },
  securityType: { type: String, default: null },
  quantity: { type: Number, required: true },
  price: { type: Number, default: null },
  marketValue: { type: Number, required: true },
  currency: { type: String, required: true, uppercase: true, default: 'USD' },
  priceAsOf: { type: Date, default: null }
}, { timestamps: true, collection: 'financeHoldings' });
financeHoldingSchema.index({ accountId: 1, providerSecurityId: 1 }, { unique: true });
financeHoldingSchema.index({ userId: 1, accountId: 1 });
financeHoldingSchema.index({ connectionId: 1 });

module.exports = {
  FinanceConnection: mongoose.model('FinanceConnection', financeConnectionSchema),
  FinanceAccount: mongoose.model('FinanceAccount', financeAccountSchema),
  FinanceTransaction: mongoose.model('FinanceTransaction', financeTransactionSchema),
  FinanceHolding: mongoose.model('FinanceHolding', financeHoldingSchema)
};
