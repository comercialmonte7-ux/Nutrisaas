/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RecipeIngredient {
  name: string;
  qty: number; // in grams or ml (metrics)
  unit: string; // 'g' or 'ml'
  category: 'Vegetales y Frutas' | 'Carnes y Proteínas' | 'Lácteos' | 'Despensa' | 'Otros';
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  preparation_time_mins: number;
  ingredients: RecipeIngredient[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export const CHILEAN_RECIPES: Recipe[] = [
  {
    id: "recipe-1",
    name: "Porotos con Riendas Tradicionales",
    description: "Plato invernal chileno de porotos (frijoles) con fideos (riendas), calabaza y un toque de ajo y ají de color.",
    servings: 2,
    preparation_time_mins: 45,
    calories: 410,
    protein_g: 18,
    carbs_g: 65,
    fat_g: 9,
    ingredients: [
      { name: "Porotos Tortola Secos", qty: 200, unit: "g", category: "Despensa" },
      { name: "Tallarines (Espaguetis)", qty: 80, unit: "g", category: "Despensa" },
      { name: "Zapallo Amarillo", qty: 150, unit: "g", category: "Vegetales y Frutas" },
      { name: "Cebolla", qty: 100, unit: "g", category: "Vegetales y Frutas" },
      { name: "Diente de Ajo", qty: 10, unit: "g", category: "Vegetales y Frutas" },
      { name: "Aceite de Maravilla", qty: 15, unit: "ml", category: "Despensa" }
    ]
  },
  {
    id: "recipe-2",
    name: "Lomo Liso con Ensalada de Palta y Tomate",
    description: "Un plato alto en proteínas y grasas saludables, ideal para pérdida de grasa o mantenimiento.",
    servings: 1,
    preparation_time_mins: 20,
    calories: 485,
    protein_g: 44,
    carbs_g: 10,
    fat_g: 30,
    ingredients: [
      { name: "Lomo Liso de Vacuno", qty: 200, unit: "g", category: "Carnes y Proteínas" },
      { name: "Palta Hass", qty: 120, unit: "g", category: "Vegetales y Frutas" },
      { name: "Tomate Limachino", qty: 150, unit: "g", category: "Vegetales y Frutas" },
      { name: "Aceite de Oliva Extra Virgen", qty: 10, unit: "ml", category: "Despensa" }
    ]
  },
  {
    id: "recipe-3",
    name: "Desayuno Marraqueta Fit con Huevo",
    description: "Desayuno clásico chileno balanceado con carbohidratos, grasas buenas y excelente aporte proteico.",
    servings: 1,
    preparation_time_mins: 10,
    calories: 395,
    protein_g: 16,
    carbs_g: 42,
    fat_g: 18,
    ingredients: [
      { name: "Marraqueta Chilena", qty: 80, unit: "g", category: "Despensa" },
      { name: "Huevo Mediano", qty: 100, unit: "g", category: "Lácteos" }, // 2 huevos aprox
      { name: "Palta Hass", qty: 60, unit: "g", category: "Vegetales y Frutas" }
    ]
  },
  {
    id: "recipe-4",
    name: "Pechuga de Pollo al Horno con Arroz y Brócoli",
    description: "El almuerzo deportivo estándar por excelencia, optimizado para ganancia muscular o definición limpia.",
    servings: 1,
    preparation_time_mins: 30,
    calories: 520,
    protein_g: 48,
    carbs_g: 58,
    fat_g: 8,
    ingredients: [
      { name: "Pechuga de Pollo", qty: 160, unit: "g", category: "Carnes y Proteínas" },
      { name: "Arroz Blanco Grano Largo", qty: 80, unit: "g", category: "Despensa" },
      { name: "Brócoli Fresco", qty: 150, unit: "g", category: "Vegetales y Frutas" },
      { name: "Aceite de Oliva", qty: 5, unit: "ml", category: "Despensa" }
    ]
  }
];
