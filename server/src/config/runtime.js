const crypto = require('crypto');

const profiles = Object.freeze({
  dev: Object.freeze({
    plaidEnvironment: 'sandbox',
    plaidBaseUrl: 'https://sandbox.plaid.com',
    databaseName: 'astitva',
    sessionCookieName: 'astitva_dev_session'
  }),
  stage: Object.freeze({
    plaidEnvironment: 'production',
    plaidBaseUrl: 'https://production.plaid.com',
    databaseName: 'astitva_stage',
    sessionCookieName: 'astitva_stage_session'
  })
});

function required(name, environment) {
  const value = environment[name]?.trim();
  if (!value || /^(change|replace|your)[-_ ]/i.test(value)) {
    throw new Error(`${name} must be configured for this local environment.`);
  }
  return value;
}

function encryptionKeyValid(value) {
  if (/^[a-f0-9]{64}$/i.test(value)) return true;
  try {
    return Buffer.from(value, 'base64').length === 32;
  } catch (_) {
    return false;
  }
}

function localMongoDatabase(mongoUrl) {
  let parsed;
  try {
    parsed = new URL(mongoUrl);
  } catch (_) {
    throw new Error('MONGODB_URL must be a valid local MongoDB URL.');
  }
  const localHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);
  if (parsed.protocol !== 'mongodb:' || !localHosts.has(parsed.hostname) || (parsed.port && parsed.port !== '27017')) {
    throw new Error('MONGODB_URL must use MongoDB on localhost port 27017.');
  }
  return parsed.pathname.replace(/^\//, '').split('/')[0];
}

function validateRuntimeEnvironment(environment = process.env) {
  const name = environment.ASTITVA_ENV?.trim();
  const profile = profiles[name];
  if (!profile) throw new Error('ASTITVA_ENV must be dev or stage.');

  const mongoUrl = required('MONGODB_URL', environment);
  if (localMongoDatabase(mongoUrl) !== profile.databaseName) {
    throw new Error(`${name} must use the ${profile.databaseName} MongoDB database.`);
  }
  if (environment.PLAID_ENV?.trim() !== profile.plaidEnvironment) {
    throw new Error(`${name} must use Plaid ${profile.plaidEnvironment}.`);
  }
  required('PLAID_CLIENT_ID', environment);
  required('PLAID_SECRET', environment);
  const encryptionKey = required('FINANCE_TOKEN_ENCRYPTION_KEY', environment);
  if (!encryptionKeyValid(encryptionKey)) {
    throw new Error('FINANCE_TOKEN_ENCRYPTION_KEY must contain exactly 32 bytes encoded as hex or base64.');
  }

  return Object.freeze({
    environment: name,
    plaidEnvironment: profile.plaidEnvironment,
    plaidBaseUrl: profile.plaidBaseUrl,
    databaseName: profile.databaseName,
    mongoUrl,
    sessionCookieName: profile.sessionCookieName,
    financeProvider: 'plaid',
    financeProviderConfigured: true,
    instanceId: crypto.createHash('sha256').update(`${name}:${mongoUrl}`).digest('hex').slice(0, 12)
  });
}

let runtimeConfig;
function getRuntimeConfig() {
  runtimeConfig ||= validateRuntimeEnvironment();
  return runtimeConfig;
}

function resetRuntimeConfigForTests() {
  runtimeConfig = undefined;
}

module.exports = { getRuntimeConfig, profiles, resetRuntimeConfigForTests, validateRuntimeEnvironment };
