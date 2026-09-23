const mongoose = require('mongoose');
const { getRuntimeConfig } = require('./runtime');

async function connectDatabase() {
  const config = getRuntimeConfig();
  await mongoose.connect(config.mongoUrl);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

module.exports = { connectDatabase };
