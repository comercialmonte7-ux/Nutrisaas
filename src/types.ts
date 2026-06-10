/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';

export type Goal = 'lose_weight' | 'maintain_weight' | 'gain_muscle';

export type MacroMethod = 'percentage' | 'weight_ratio';

export interface UserProfile {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  has_constipation_trouble?: boolean;
  has_long_trips?: boolean;
  has_other_condition?: boolean;
  other_condition_notes?: string;
  picture?: string;
}

export interface Food {
  id: number;
  name: string;
  brand?: string;
  barcode?: string;
  calories_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  serving_size_g?: number;
  source: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  food_id?: number;
  custom_food_name?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_count: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  created_at: string;
  photoBase64?: string;
}

export interface WearableConfig {
  enabled: boolean;
  activeCaloriesToday: number;
  deviceName: string;
}

export interface CalculationResult {
  tmb_mifflin: number;
  tmb_harris: number;
  getd_standard: number;
  getd_wearable?: number;
  getd_applied: number;
  warning?: string;
  target_calories: number;
  target_protein_g: number;
  target_carbs_g: number;
  target_fat_g: number;
  methodApplied: MacroMethod;
}

export interface VisualFoodAnalysis {
  food_name: string;
  estimated_weight_g: number;
  ingredients: {
    name: string;
    weight_g: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  hidden_ingredients_found: {
    name: string;
    extra_calories: number;
    description: string;
  }[];
}

export interface ShoppingIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  usedInRecipes: string[];
}
