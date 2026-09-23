const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDatabase } = require('./config/database');
const { getRuntimeConfig } = require('./config/runtime');
const { FinanceConnection } = require('./models/Finance');
const authRoutes = require('./routes/auth');

const app = express();
const port = Number(process.env.PORT || 3001);
const runtime = getRuntimeConfig();

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (request, response) => {
  response.status(200).json({
    status: 'ok',
    message: 'Astitva server is running',
    environment: runtime.environment,
    financeProvider: {
      name: runtime.financeProvider,
      environment: runtime.plaidEnvironment,
      configured: runtime.financeProviderConfigured
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/diet', require('./routes/diet'));
app.use('/api/finance', require('./routes/finance'));

app.use((error, request, response, next) => {
  console.error('Unhandled API error:', error.message);
  response.status(500).json({ error: 'The server could not complete this request.' });
});

async function startServer() {
  await connectDatabase();
  await FinanceConnection.updateMany(
    { providerEnvironment: { $exists: false } },
    { $set: { providerEnvironment: runtime.plaidEnvironment } }
  );
  await FinanceConnection.syncIndexes();

  app.listen(port, () => {
    console.log(`Astitva ${runtime.environment} server running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start Astitva server:', error.message);
  process.exit(1);
});
