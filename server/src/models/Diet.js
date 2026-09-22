const mongoose = require('mongoose');

const fields = ['calories', 'proteinGrams', 'carbohydrateGrams', 'fatGrams', 'fiberGrams'];
const nutrition = Object.fromEntries(fields.map((key) => [key, { type: Number, required: true, min: 0 }]));
const mealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  consumedOn: { type: String, required: true },
  name: { type: String, required: true, maxlength: 120 },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], required: true },
  servingDescription: { type: String, default: '', maxlength: 80 },
  ...nutrition
}, { timestamps: true, collection: 'dietMeals' });
mealSchema.index({ userId: 1, consumedOn: 1 });
const targetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  ...nutrition
}, { timestamps: true, collection: 'dietNutritionTargets' });

module.exports = {
  Meal: mongoose.model('DietMeal', mealSchema),
  Targets: mongoose.model('DietTargets', targetSchema),
  fields
};
