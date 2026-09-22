const express = require('express');
const crypto = require('crypto');
const Session = require('../models/Session');
const { Meal, Targets, fields } = require('../models/Diet');
const router = express.Router();
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const validDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const numbers = (v) => Object.fromEntries(fields.map((key) => [key, v[key]]));
const publicMeal = (m) => ({ id: String(m._id), date: m.consumedOn, name: m.name,
  mealType: m.mealType, servingDescription: m.servingDescription, nutrition: numbers(m) });

function nutritionValid(v, targets = false, partial = false) {
  return object(v) && Object.keys(v).every((key) => fields.includes(key)) &&
    (partial ? Object.keys(v).length > 0 : fields.every((key) => key in v)) &&
    Object.entries(v).every(([key, value]) => {
      const scaled = value * (key === 'calories' ? 1 : 10);
      return typeof value === 'number' && Number.isFinite(value) &&
        (targets ? value > 0 : value >= 0) && Math.abs(scaled) <= Number.MAX_SAFE_INTEGER / 1000 &&
        Math.abs(scaled - Math.round(scaled)) < 1e-8;
    });
}

function mealInput(body, partial = false) {
  if (!object(body) || !Object.keys(body).length || Object.keys(body).some((k) =>
    !['date', 'name', 'mealType', 'servingDescription', 'nutrition'].includes(k))) return null;
  const result = {};
  for (const key of ['date', 'name', 'mealType', 'nutrition']) {
    if (!partial && !(key in body)) return null;
  }
  if ('date' in body) { if (!validDate(body.date)) return null; result.consumedOn = body.date; }
  if ('name' in body) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 120) return null;
    result.name = body.name.trim();
  }
  if ('mealType' in body) {
    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(body.mealType)) return null;
    result.mealType = body.mealType;
  }
  if ('servingDescription' in body) {
    if (typeof body.servingDescription !== 'string' || body.servingDescription.trim().length > 80) return null;
    result.servingDescription = body.servingDescription.trim();
  }
  if ('nutrition' in body) {
    if (!nutritionValid(body.nutrition, false, partial)) return null;
    Object.assign(result, body.nutrition);
  }
  return result;
}

router.use(async (req, res, next) => {
  const token = req.cookies.astitva_session;
  if (typeof token !== 'string') return res.status(401).json({ error: 'Authentication required.' });
  const session = await Session.findOne({ tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: { $gt: new Date() } }).populate('userId');
  if (!session?.userId) return res.status(401).json({ error: 'Authentication required.' });
  if (!session.userId.emailVerifiedAt) return res.status(403).json({ error: 'Email verification required.' });
  req.dietUserId = session.userId._id;
  next();
});

router.get('/days/:date', async (req, res) => {
  if (!validDate(req.params.date)) return res.status(400).json({ error: 'Use a valid YYYY-MM-DD date.' });
  const [meals, targets] = await Promise.all([
    Meal.find({ userId: req.dietUserId, consumedOn: req.params.date }).sort({ createdAt: 1 }).lean(),
    Targets.findOne({ userId: req.dietUserId }).lean()
  ]);
  const totals = Object.fromEntries(fields.map((key) => [key,
    meals.reduce((sum, meal) => sum + Math.round(meal[key] * 10), 0) / 10]));
  res.json({ date: req.params.date, totals, targets: targets ? numbers(targets) : null,
    overTarget: targets ? Object.fromEntries(fields.map((k) => [k, Math.max(0, Math.round((totals[k] - targets[k]) * 10) / 10)])) : null,
    meals: meals.map(publicMeal) });
});
router.post('/meals', async (req, res) => {
  const input = mealInput(req.body);
  if (!input) return res.status(400).json({ error: 'Invalid meal. Enter a date, name, meal type and all five non-negative nutrition values (whole calories; grams to one decimal).' });
  res.status(201).json({ meal: publicMeal(await Meal.create({ ...input, userId: req.dietUserId })) });
});
router.put('/targets', async (req, res) => {
  if (!nutritionValid(req.body, true)) return res.status(400).json({ error: 'Enter five positive targets (whole calories; grams to one decimal).' });
  const filter = { userId: req.dietUserId };
  let target;
  try {
    target = await Targets.findOneAndUpdate(filter, { $set: numbers(req.body) }, { upsert: true, new: true, runValidators: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    target = await Targets.findOneAndUpdate(filter, { $set: numbers(req.body) }, { new: true, runValidators: true });
  }
  res.json({ targets: numbers(target) });
});
router.patch('/meals/:id', async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(404).json({ error: 'Meal not found.' });
  const input = mealInput(req.body, true);
  if (!input) return res.status(400).json({ error: 'Invalid meal update.' });
  const meal = await Meal.findOneAndUpdate({ _id: req.params.id, userId: req.dietUserId },
    { $set: input }, { new: true, runValidators: true });
  if (!meal) return res.status(404).json({ error: 'Meal not found.' });
  res.json({ meal: publicMeal(meal) });
});
router.delete('/meals/:id', async (req, res) => {
  if (!/^[a-f0-9]{24}$/i.test(req.params.id)) return res.status(404).json({ error: 'Meal not found.' });
  const meal = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.dietUserId });
  if (!meal) return res.status(404).json({ error: 'Meal not found.' });
  res.status(204).end();
});
module.exports = router;
