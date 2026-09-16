const mongoose = require('mongoose');

const mongoUrl = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/astitva';

async function connectDatabase() {
  await mongoose.connect(mongoUrl);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

module.exports = { connectDatabase };
