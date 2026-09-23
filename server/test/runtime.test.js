const assert = require('node:assert/strict');
const test = require('node:test');
const { validateRuntimeEnvironment } = require('../src/config/runtime');

const base = {
  PLAID_CLIENT_ID: 'client-id',
  PLAID_SECRET: 'secret-value',
  FINANCE_TOKEN_ENCRYPTION_KEY: '11'.repeat(32)
};

test('Dev selects Sandbox, the dev database, and its own cookie', () => {
  const config = validateRuntimeEnvironment({
    ...base,
    ASTITVA_ENV: 'dev',
    PLAID_ENV: 'sandbox',
    MONGODB_URL: 'mongodb://127.0.0.1:27017/astitva'
  });
  assert.equal(config.plaidBaseUrl, 'https://sandbox.plaid.com');
  assert.equal(config.databaseName, 'astitva');
  assert.equal(config.sessionCookieName, 'astitva_dev_session');
});

test('Stage selects Production, the stage database, and its own cookie', () => {
  const config = validateRuntimeEnvironment({
    ...base,
    ASTITVA_ENV: 'stage',
    PLAID_ENV: 'production',
    MONGODB_URL: 'mongodb://localhost:27017/astitva_stage'
  });
  assert.equal(config.plaidBaseUrl, 'https://production.plaid.com');
  assert.equal(config.databaseName, 'astitva_stage');
  assert.equal(config.sessionCookieName, 'astitva_stage_session');
});

test('runtime validation rejects crossed profiles and remote MongoDB', () => {
  assert.throws(() => validateRuntimeEnvironment({
    ...base, ASTITVA_ENV: 'stage', PLAID_ENV: 'sandbox', MONGODB_URL: 'mongodb://127.0.0.1:27017/astitva_stage'
  }), /Plaid production/);
  assert.throws(() => validateRuntimeEnvironment({
    ...base, ASTITVA_ENV: 'stage', PLAID_ENV: 'production', MONGODB_URL: 'mongodb://127.0.0.1:27017/astitva'
  }), /astitva_stage/);
  assert.throws(() => validateRuntimeEnvironment({
    ...base, ASTITVA_ENV: 'dev', PLAID_ENV: 'sandbox', MONGODB_URL: 'mongodb://mongo.example.com:27017/astitva'
  }), /localhost/);
});

test('runtime validation rejects placeholder credentials and invalid keys', () => {
  assert.throws(() => validateRuntimeEnvironment({
    ...base, ASTITVA_ENV: 'stage', PLAID_ENV: 'production', MONGODB_URL: 'mongodb://127.0.0.1:27017/astitva_stage', PLAID_SECRET: 'your-production-secret'
  }), /PLAID_SECRET/);
  assert.throws(() => validateRuntimeEnvironment({
    ...base, ASTITVA_ENV: 'dev', PLAID_ENV: 'sandbox', MONGODB_URL: 'mongodb://127.0.0.1:27017/astitva', FINANCE_TOKEN_ENCRYPTION_KEY: 'short'
  }), /32 bytes/);
});
