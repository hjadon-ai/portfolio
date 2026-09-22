const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (request, response) => {
  response.status(200).json({
    status: 'ok',
    message: 'Astitva server is running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/diet', require('./routes/diet'));

app.use((error, request, response, next) => {
  console.error('Unhandled API error:', error.message);
  response.status(500).json({ error: 'The server could not complete this request.' });
});

async function startServer() {
  await connectDatabase();

  app.listen(port, () => {
    console.log(`Astitva server running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start Astitva server:', error.message);
  process.exit(1);
});
