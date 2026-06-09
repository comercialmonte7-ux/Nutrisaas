import express from 'express';
const app = express();

app.get('/api/test', (req, res) => {
  res.json({ status: "ok", message: "Vercel Express serverless function works!" });
});

app.post('/api/analyze-food', (req, res) => {
  res.json({
    food_name: "Mocked Vercel Test Food",
    estimated_weight_g: 100,
    ingredients: [],
    total_calories: 100,
    total_protein_g: 10,
    total_carbs_g: 10,
    total_fat_g: 10,
    hidden_ingredients_found: []
  });
});

export default app;
