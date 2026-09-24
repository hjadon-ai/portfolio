const mongoose = require('mongoose');
const { createApp } = require('./app');
const { connectDatabase } = require('./config/database');
const { getRuntimeConfig } = require('./config/runtime');
const { FinanceConnection } = require('./models/Finance');

async function createIndexes() {
  await Promise.all(Object.values(mongoose.models).map((model) => model.createIndexes()));
}

async function startServer() {
  const runtime = getRuntimeConfig();
  const port = Number(process.env.PORT || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }
  const host = runtime.isProduction ? '0.0.0.0' : '127.0.0.1';
  const app = createApp();

  await connectDatabase();
  if (runtime.financeEnabled) {
    await FinanceConnection.updateMany(
      { providerEnvironment: { $exists: false } },
      { $set: { providerEnvironment: runtime.plaidEnvironment } }
    );
  }
  await createIndexes();

  const server = app.listen(port, host, () => {
    console.log(`Astitva ${runtime.environment} server listening on ${host}:${port}`);
  });

  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down.`);
    server.close(async (error) => {
      try {
        await mongoose.disconnect();
      } finally {
        process.exit(error ? 1 : 0);
      }
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start Astitva server:', error.message);
    process.exit(1);
  });
}

module.exports = { startServer };
