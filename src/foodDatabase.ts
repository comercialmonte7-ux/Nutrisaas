/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Food } from './types.js';

export const CHILEAN_LA_FOODS: Food[] = [
  {
    id: 1,
    name: "Palta Hass Chilena",
    brand: "Semilla INTA",
    barcode: "7801234560012",
    calories_100g: 160,
    protein_100g: 2.0,
    carbs_100g: 9.0,
    fat_100g: 15.0,
    serving_size_g: 100,
    source: "INTA Chile"
  },
  {
    id: 2,
    name: "Marraqueta Chilena (Pan Batido)",
    brand: "Local / Panadería",
    barcode: "7801234560029",
    calories_100g: 270,
    protein_100g: 8.5,
    carbs_100g: 56.0,
    fat_100g: 1.0,
    serving_size_g: 100,
    source: "INTA Chile"
  },
  {
    id: 3,
    name: "Lomo Liso Vacuno (Cocido)",
    brand: "Carnes de Osorno",
    barcode: "7801234560036",
    calories_100g: 195,
    protein_100g: 28.0,
    carbs_100g: 0.0,
    fat_100g: 9.0,
    serving_size_g: 150,
    source: "INTA Chile"
  },
  {
    id: 4,
    name: "Hallulla Especial",
    brand: "Local",
    barcode: "7801234560043",
    calories_100g: 310,
    protein_100g: 8.0,
    carbs_100g: 52.0,
    fat_100g: 8.2,
    serving_size_g: 90,
    source: "INTA Chile"
  },
  {
    id: 5,
    name: "Empanada de Pino de Horno",
    brand: "Casera Chilena",
    calories_100g: 245,
    protein_100g: 8.2,
    carbs_100g: 31.0,
    fat_100g: 10.0,
    serving_size_g: 250,
    source: "LATINFOODS"
  },
  {
    id: 6,
    name: "Porotos con Riendas Chilenos",
    brand: "Tradicional",
    calories_100g: 135,
    protein_100g: 6.2,
    carbs_100g: 21.0,
    fat_100g: 3.1,
    serving_size_g: 350,
    source: "LATINFOODS"
  },
  {
    id: 7,
    name: "Pechuga de Pollo Deshuesada",
    brand: "Súper Pollo",
    barcode: "7801234560074",
    calories_100g: 165,
    protein_100g: 31.0,
    carbs_100g: 0.0,
    fat_100g: 3.6,
    serving_size_g: 150,
    source: "USDA"
  },
  {
    id: 8,
    name: "Avena Entera Instantánea",
    brand: "Quaker",
    barcode: "030000010402",
    calories_100g: 380,
    protein_100g: 13.0,
    carbs_100g: 67.0,
    fat_100g: 7.0,
    serving_size_g: 40,
    source: "USDA"
  },
  {
    id: 9,
    name: "Arroz Blanco Cocido",
    brand: "Tucapel",
    barcode: "7801234560098",
    calories_100g: 130,
    protein_100g: 2.7,
    carbs_100g: 28.0,
    fat_100g: 0.3,
    serving_size_g: 150,
    source: "INTA Chile"
  },
  {
    id: 10,
    name: "Leche Semidescremada Líquida",
    brand: "Colun",
    barcode: "7801122334455",
    calories_100g: 45,
    protein_100g: 3.2,
    carbs_100g: 4.8,
    fat_100g: 1.5,
    serving_size_g: 200,
    source: "INTA Chile"
  },
  {
    id: 11,
    name: "Plátano (Banana)",
    brand: "Fruta",
    calories_100g: 89,
    protein_100g: 1.1,
    carbs_100g: 23.0,
    fat_100g: 0.3,
    serving_size_g: 120,
    source: "USDA"
  },
  {
    id: 12,
    name: "Huevo Cocido Entero",
    brand: "Granja",
    calories_100g: 155,
    protein_100g: 13.0,
    carbs_100g: 1.1,
    fat_100g: 11.0,
    serving_size_g: 50,
    source: "USDA"
  }
];

export function findFoodByBarcode(barcode: string): Food | null {
  const clean = barcode.trim();
  return CHILEAN_LA_FOODS.find(f => f.barcode === clean) || null;
}

export function searchFoods(query: string): Food[] {
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return [];
  return CHILEAN_LA_FOODS.filter(f => 
    f.name.toLowerCase().includes(cleanQuery) || 
    (f.brand && f.brand.toLowerCase().includes(cleanQuery))
  );
}
