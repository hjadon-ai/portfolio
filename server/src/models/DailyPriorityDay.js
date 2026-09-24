const mongoose = require('mongoose');
const { validDate, validTitle } = require('../services/priorities');
const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, validate: (value) => validTitle(value) && value === value.trim() },
  completed: { type: Boolean, required: true, default: false }
}, { strict: 'throw' });
const daySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  date: { type: String, required: true, immutable: true, validate: validDate },
  priorities: { type: [itemSchema], required: true, default: [], validate: {
    validator: (items) => items.length <= 3 && new Set(items.map((item) => String(item._id))).size === items.length,
    message: 'Use at most three distinct priorities.'
  } }
}, { timestamps: true, collection: 'dailyPriorityDays', strict: 'throw' });
daySchema.index({ userId: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('DailyPriorityDay', daySchema);
