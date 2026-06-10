/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { CHILEAN_LA_FOODS, searchFoods, findFoodByBarcode } from '../src/foodDatabase.js';
import { CHILEAN_RECIPES } from '../src/recipes.js';
import { Gender, ActivityLevel, Goal, MacroMethod, UserProfile, DailyLog, WearableConfig, CalculationResult, VisualFoodAnalysis } from '../src/types.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use(['/api/database/*', '/api/auth/*'], async (req, res, next) => {
  await syncFromCloud();
  next();
});

const PORT = 3000;

// Initialize GoogleGenAI client (safe lazy lookup)
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error("Error initializing Gemini API client:", e);
    }
  }
  return aiClient;
}

const BUCKET_URL = 'https://kvdb.io/nutrisaas_prod_db_bucket_7e465f5dcc901d8d0baac1bf94300bc212685cc6';

let simulatedScannedHistory: any = {};

async function syncFromCloud() {
  const globalFetch = (globalThis as any).fetch;
  if (!globalFetch) return;
  try {
    const usersRes = await globalFetch(`${BUCKET_URL}/profiles`);
    if (usersRes.ok) {
      simulatedUsers = await usersRes.json();
    }
  } catch (e) {}

  try {
    const logsRes = await globalFetch(`${BUCKET_URL}/logs`);
    if (logsRes.ok) {
      simulatedDailyLogs = await logsRes.json();
    }
  } catch (e) {}

  try {
    const histRes = await globalFetch(`${BUCKET_URL}/scanned_history`);
    if (histRes.ok) {
      simulatedScannedHistory = await histRes.json();
    }
  } catch (e) {}
}

// Helper functions to read/write JSON files for local persistence
function readLocalDbFile(filename: string, fallback: any) {
  if (filename === 'scanned_history.json' && Object.keys(simulatedScannedHistory).length > 0) {
    return simulatedScannedHistory;
  }
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.log(`[Local DB] Warning: Failed to read local DB file ${filename}:`, e);
  }
  return fallback;
}

function writeLocalDbFile(filename: string, data: any) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.log(`[Local DB] Warning: Failed to write local DB file ${filename}:`, e);
  }

  // Sync to remote cloud database bucket asynchronously
  const key = filename.replace('.json', '');
  const globalFetch = (globalThis as any).fetch;
  if (globalFetch) {
    globalFetch(`${BUCKET_URL}/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch((e: any) => console.log(`[Cloud DB] Warning: Failed to sync ${key} to cloud:`, e));
  }
}

// In-Memory Multi-tenant Simulated Database (Supabase Simulation)
const defaultUsers = {
  "de99bbfb-3712-40de-8e3b-9304005fc080": {
    email: "ricardo.marimo@gmail.com",
    first_name: "Ricardo",
    last_name: "Marimo",
    date_of_birth: "1994-06-07",
    gender: "male" as Gender,
    height_cm: 178,
    weight_kg: 82.0,
    activity_level: "moderately_active" as ActivityLevel,
    goal: "lose_weight" as Goal,
    target_calories: 2100,
    target_protein_g: 160,
    target_carbs_g: 210,
    target_fat_g: 70,
    has_constipation_trouble: false,
    has_long_trips: false,
    has_other_condition: false,
    other_condition_notes: ""
  },
  "44444444-4444-4444-4444-444444444444": {
    email: "unauthorized.attacker@evil.com",
    first_name: "Attacker",
    last_name: "Bin",
    date_of_birth: "1988-12-05",
    gender: "male" as Gender,
    height_cm: 180,
    weight_kg: 92.0,
    activity_level: "sedentary" as ActivityLevel,
    goal: "lose_weight" as Goal,
    target_calories: 2000,
    target_protein_g: 184,
    target_carbs_g: 160,
    target_fat_g: 70,
    has_constipation_trouble: false,
    has_long_trips: false,
    has_other_condition: false,
    other_condition_notes: ""
  }
};

const defaultDailyLogs: DailyLog[] = [
  {
    id: "log-1",
    user_id: "de99bbfb-3712-40de-8e3b-9304005fc080",
    log_date: "2026-06-07",
    food_id: 1, // Palta Hass
    custom_food_name: "Palta Hass Chilena",
    calories: 160,
    protein_g: 2.0,
    carbs_g: 9.0,
    fat_g: 15.0,
    serving_count: 1.2, // 120g
    meal_type: "breakfast",
    created_at: "2026-06-07T08:30:00Z"
  },
  {
    id: "log-2",
    user_id: "de99bbfb-3712-40de-8e3b-9304005fc080",
    log_date: "2026-06-07",
    food_id: 2, // Marraqueta
    custom_food_name: "Marraqueta Chilena (Pan Batido)",
    calories: 216,
    protein_g: 6.8,
    carbs_g: 44.8,
    fat_g: 0.8,
    serving_count: 0.8, // 80g
    meal_type: "breakfast",
    created_at: "2026-06-07T08:32:00Z"
  },
  {
    id: "log-3",
    user_id: "de99bbfb-3712-40de-8e3b-9304005fc080",
    log_date: "2026-06-07",
    food_id: 3, // Lomo liso
    custom_food_name: "Lomo Liso Vacuno (Cocido)",
    calories: 292,
    protein_g: 42.0,
    carbs_g: 0.0,
    fat_g: 13.5,
    serving_count: 1.5, // 150g
    meal_type: "lunch",
    created_at: "2026-06-07T13:15:00Z"
  },
  // An attacker's log to test secure database multi-tenant isolation
  {
    id: "log-attacker-1",
    user_id: "44444444-4444-4444-4444-444444444444",
    log_date: "2026-06-07",
    food_id: 5,
    custom_food_name: "Secret Cheat Burger Excluded from RLS",
    calories: 950,
    protein_g: 44.0,
    carbs_g: 78.0,
    fat_g: 48.0,
    serving_count: 1.0,
    meal_type: "dinner",
    created_at: "2026-06-07T21:00:00Z"
  }
];

let simulatedUsers = readLocalDbFile('profiles.json', defaultUsers);
let simulatedDailyLogs: DailyLog[] = readLocalDbFile('logs.json', defaultDailyLogs);

// --- API ROUTES FIRST ---

/**
 * MÓDULO 1: CÁLCULO CALÓRICO Y MACRONUTRIENTES
 */
app.post('/api/calculate', (req, res) => {
  const {
    weight_kg,
    height_cm,
    age,
    gender,
    activity_level,
    goal,
    macro_method,
    specific_protein_ratio = 2.0, // Used for Method B
    specific_fat_ratio = 1.0,     // Used for Method B
    wearable_config
  } = req.body;

  // 1. TMB - Mifflin-St Jeor
  let tmb_mifflin = 0;
  if (gender === 'male') {
    tmb_mifflin = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else {
    tmb_mifflin = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  }

  // 2. TMB - Harris-Benedict Revisada (1984)
  let tmb_harris = 0;
  if (gender === 'male') {
    tmb_harris = 88.362 + 13.397 * weight_kg + 4.799 * height_cm - 5.677 * age;
  } else {
    tmb_harris = 447.593 + 9.247 * weight_kg + 3.098 * height_cm - 4.330 * age;
  }

  // 3. PAL Mapping
  const palMap: Record<ActivityLevel, number> = {
    sedentary: 1.20,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.90
  };
  const pal = palMap[activity_level as ActivityLevel] || 1.2;
  const getd_standard = tmb_mifflin * pal;

  // 4. Dynamic Wearable TDEE
  let getd_applied = getd_standard;
  let getd_wearable: number | undefined = undefined;
  
  const wearable: WearableConfig = wearable_config;
  if (wearable && wearable.enabled) {
    // GETD Dinámico = TMB (Mifflin) + Calorías Activas Reales del wearable
    getd_wearable = tmb_mifflin + (Number(wearable.activeCaloriesToday) || 0);
    getd_applied = getd_wearable;
  }

  // 5. Target Calories based on Goal and Safety constraints
  let target_calories = getd_applied;
  let warning: string | undefined = undefined;

  if (goal === 'lose_weight') {
    // Reducción del 15% al 20% (Usamos un 15% estándar)
    target_calories = getd_applied * 0.85;

    // Safety floors: 1200 kcal for females, 1500 kcal for males
    const limit = gender === 'female' ? 1200 : 1500;
    if (target_calories < limit) {
      target_calories = limit;
      warning = `Restricción de Seguridad: El cálculo matemático sugería ${Math.round(getd_applied * 0.85)} kcal/día, pero se ha forzado el consumo mínimo seguro de ${limit} kcal/día para prevenir la degradación metabólica extrema en ${gender === 'female' ? 'Mujeres' : 'Hombres'}.`;
    }
  } else if (goal === 'gain_muscle') {
    // Incremento de 10% al 15% (Usamos 10% estándar)
    target_calories = getd_applied * 1.10;
  }

  // Round calories
  target_calories = Math.round(target_calories);

  // 6. Macro Distributions
  let target_protein_g = 0;
  let target_carbs_g = 0;
  let target_fat_g = 0;

  if (macro_method === 'weight_ratio') {
    // Método B: Basado en peso corporal (Recomendado)
    // Proteína: Fijar entre 1.6 y 2.2 g/kg (User specific)
    const raw_prot = weight_kg * specific_protein_ratio;
    target_protein_g = Math.round(raw_prot);

    // Grasas: Fijar entre 0.8 y 1.2 g/kg (User specific) con un piso del 20% del total calórico
    let raw_fat = weight_kg * specific_fat_ratio;
    const fat_calories_floor = target_calories * 0.20;
    const fat_g_floor = fat_calories_floor / 9;
    
    if (raw_fat < fat_g_floor) {
      raw_fat = fat_g_floor;
    }
    target_fat_g = Math.round(raw_fat);

    // Carbohidratos: calorías restantes
    const remaining_calories = target_calories - (target_protein_g * 4) - (target_fat_g * 9);
    target_carbs_g = Math.round(Math.max(0, remaining_calories / 4));

  } else {
    // Método A (Por porcentajes según la meta)
    let p_protein = 0.20;
    let p_carbs = 0.50;
    let p_fat = 0.30;

    if (goal === 'lose_weight') {
      // Pérdida de grasa: 30% Proteína, 45% Carb, 25% Grasa
      p_protein = 0.30;
      p_carbs = 0.45;
      p_fat = 0.25;
    } else if (goal === 'gain_muscle') {
      // Aumento muscular: 25% Proteína, 55% Carb, 20% Grasa
      p_protein = 0.25;
      p_carbs = 0.55;
      p_fat = 0.20;
    } else {
      // Mantenimiento: 20% Proteína, 50% Carb, 30% Grasa
      p_protein = 0.22;
      p_carbs = 0.48;
      p_fat = 0.30;
    }

    target_protein_g = Math.round((target_calories * p_protein) / 4);
    target_carbs_g = Math.round((target_calories * p_carbs) / 4);
    target_fat_g = Math.round((target_calories * p_fat) / 9);
  }

  const result: CalculationResult = {
    tmb_mifflin: Math.round(tmb_mifflin),
    tmb_harris: Math.round(tmb_harris),
    getd_standard: Math.round(getd_standard),
    getd_wearable: getd_wearable ? Math.round(getd_wearable) : undefined,
    getd_applied: Math.round(getd_applied),
    warning,
    target_calories,
    target_protein_g,
    target_carbs_g,
    target_fat_g,
    methodApplied: macro_method as MacroMethod
  };

  res.json(result);
});

/**
 * MÓDULO 2: RECONOCIMIENTO VISUAL DE ALIMENTOS
 */
// Retry wrapper for Gemini calls to survive transient 503 (High Demand) or 429 (Rate Limit) spikes
async function generateContentWithRetry(client: GoogleGenAI, options: any, maxRetries = 3, delayMs = 1500): Promise<any> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.models.generateContent(options);
    } catch (err: any) {
      lastError = err;
      const errMsg = (err.message || "").toString().toLowerCase();
      const errStatus = (err.status || "").toString().toLowerCase();
      
      const isRetryable = 
        errStatus.includes("unavailable") || 
        errMsg.includes("503") || 
        errMsg.includes("temporary") ||
        errMsg.includes("high demand") ||
        errMsg.includes("429") || 
        errStatus.includes("resource_exhausted") ||
        errMsg.includes("resource exhausted");
        
      if (isRetryable && attempt < maxRetries) {
        console.warn(`[Gemini API] Error transitorio detectado (${errStatus || '503'}). Reintentando en ${delayMs}ms... (Intento ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // exponential backoff
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

app.post('/api/analyze-food', async (req, res) => {
  const { imageBase64, mockFoodQuery, goal = "lose_weight" } = req.body;
  const client = getGeminiClient();

  // If a real image was uploaded, we REQUIRE the Gemini Client
  if (imageBase64 && !client) {
    return res.status(400).json({
      error: "api_key_missing",
      message: "La clave API de Gemini (GEMINI_API_KEY) no está configurada en el servidor de Vercel. Por favor configúrala en las variables de entorno de tu proyecto para habilitar el escáner de fotos, o usa el 'Modo Local' en el Header para probar los presets estáticos de demostración."
    });
  }

  // If we have a working Gemini Client, execute live analysis!
  if (client) {
    try {
      const systemPrompt = `Actúa como un Especialista en Nutrición Clínica y Visión Computacional.
Analiza detalladamente el plato suministrado (ya sea por descripción de texto o por una foto).
Identifica los ingredientes visibles o lógicamente parte de ese plato y estima sus pesos estándar en gramos.
Suministra los macronutrientes correspondientes (calorías, proteínas, carbohidratos, grasas).
Calcula y advierte sobre INGREDIENTES OCULTOS típicos que inflan las calorías (ej. aceite de cocina para saltear, mantecas, aderezos de ensalada ricos en aceites, azúcar añadida en salsas). Escoge 1 o 2 ingredientes ocultos típicos asociados con el plato y suminístralos bajo 'hidden_ingredients_found'.
Retorna tu respuesta estrictamente en el formato de esquema JSON indicado.`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          food_name: { type: Type.STRING, description: "Nombre principal o clasificación del plato completo (ej. Marraqueta con palta, Cazuela de pollo, etc.)" },
          estimated_weight_g: { type: Type.INTEGER, description: "Peso total estimado del plato en gramos" },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Nombre del ingrediente básico o componente" },
                weight_g: { type: Type.INTEGER },
                calories: { type: Type.INTEGER },
                protein_g: { type: Type.NUMBER },
                carbs_g: { type: Type.NUMBER },
                fat_g: { type: Type.NUMBER }
              },
              required: ["name", "weight_g", "calories", "protein_g", "carbs_g", "fat_g"]
            }
          },
          total_calories: { type: Type.INTEGER },
          total_protein_g: { type: Type.NUMBER },
          total_carbs_g: { type: Type.NUMBER },
          total_fat_g: { type: Type.NUMBER },
          hidden_ingredients_found: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Nombre del ingrediente oculto deletéreo (ej. Aceite de cocina)" },
                extra_calories: { type: Type.INTEGER, description: "Calorías incrementales, ej. 120" },
                description: { type: Type.STRING, description: "Explicación del porqué de su sospecha científica" }
              },
              required: ["name", "extra_calories", "description"]
            }
          }
        },
        required: ["food_name", "estimated_weight_g", "ingredients", "total_calories", "total_protein_g", "total_carbs_g", "total_fat_g", "hidden_ingredients_found"]
      };

      let response;

      if (imageBase64) {
        console.log("Analyzing food image with Gemini Vision...");
        
        let mimeType = "image/jpeg";
        const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
        if (mimeTypeMatch) {
          mimeType = mimeTypeMatch[1];
        }
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const imagePart = {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        };

        const textPart = {
          text: `Identifica detalladamente la comida o plato que aparece en esta imagen. Si el nombre del plato sugerido o archivo es "${mockFoodQuery || ''}", utilízalo como contexto de apoyo para mayor precisión culinaria. Estima los ingredientes componentes, sus gramos y calcula calorías y macronutrientes correspondientes, además de hasta 2 sospechas de aceites de cocina o aderezos ocultos.`
        };

        response = await generateContentWithRetry(client, {
          model: "gemini-2.5-flash",
          contents: {
            parts: [imagePart, textPart]
          },
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema
          }
        });
      } else if (mockFoodQuery) {
        console.log(`Analyzing typed food description: "${mockFoodQuery}" with Gemini...`);
        response = await generateContentWithRetry(client, {
          model: "gemini-2.5-flash",
          contents: `Analiza detalladamente este plato o comida descrita por el usuario: "${mockFoodQuery}". Identifica los ingredientes básicos que lo componen típicamente en la gastronomía (especialmente chilena si aplica), estima gramos razonables, desglosa calorías, proteínas, carbohidratos, grasas por ingrediente y sugiere hasta 2 ingredientes ocultos comunes de su preparación.`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            responseSchema
          }
        });
      }

      if (response && response.text) {
        const text = response.text.trim();
        const parsedAns = JSON.parse(text);
        return res.json(parsedAns);
      }
    } catch (err: any) {
      console.error("Gemini live food analysis failed:", err);
      // If imageBase64 was provided, we throw a server error so it doesn't silently fallback to random food
      if (imageBase64) {
        return res.status(500).json({
          error: "gemini_api_error",
          message: `El reconocimiento por IA con visión falló: ${err.message || 'Error desconocido'}`
        });
      }
    }
  }

  // High fidelity presets lookup (Simulation model based on typical items)
  const query = (mockFoodQuery || "palta").toLowerCase();
  let analysis: VisualFoodAnalysis;

  if (query.includes("palta") || query.includes("marraqueta")) {
    analysis = {
      food_name: "Marraqueta con Palta Hass y Huevo",
      estimated_weight_g: 210,
      ingredients: [
        { name: "Palta Hass Chilena", weight_g: 80, calories: 128, protein_g: 1.6, carbs_g: 7.2, fat_g: 12.0 },
        { name: "Marraqueta Pan Batido", weight_g: 80, calories: 216, protein_g: 6.8, carbs_g: 44.8, fat_g: 0.8 },
        { name: "Huevo Cocido", weight_g: 50, calories: 78, protein_g: 6.5, carbs_g: 0.5, fat_g: 5.5 }
      ],
      total_calories: 422,
      total_protein_g: 14.9,
      total_carbs_g: 52.5,
      total_fat_g: 18.3,
      hidden_ingredients_found: [
        { name: "Aceite de oliva rociado", extra_calories: 45, description: "Frecuentemente añadido al pan para suavizar la miga (+45 kcal)." }
      ]
    };
  } else if (query.includes("lomo") || query.includes("carne") || query.includes("vacuno")) {
    analysis = {
      food_name: "Lomo Liso Vacuno con Tomate",
      estimated_weight_g: 350,
      ingredients: [
        { name: "Lomo Liso Cocido", weight_g: 200, calories: 390, protein_g: 56.0, carbs_g: 0.0, fat_g: 18.0 },
        { name: "Tomate Limachino", weight_g: 150, calories: 27, protein_g: 1.3, carbs_g: 5.8, fat_g: 0.3 }
      ],
      total_calories: 417,
      total_protein_g: 57.3,
      total_carbs_g: 5.8,
      total_fat_g: 18.3,
      hidden_ingredients_found: [
        { name: "Aceite vegetal de cocción", extra_calories: 120, description: "Añadido inevitablemente a la plancha para evitar que la carne magra se pegue (+120 kcal)." }
      ]
    };
  } else if (query.includes("poroto") || query.includes("riendas")) {
    analysis = {
      food_name: "Porotos con Riendas Tradicionales",
      estimated_weight_g: 450,
      ingredients: [
        { name: "Porotos Tórtola", weight_g: 200, calories: 270, protein_g: 12.4, carbs_g: 42.0, fat_g: 6.2 },
        { name: "Tallarines Espaguetis", weight_g: 100, calories: 135, protein_g: 5.0, carbs_g: 28.0, fat_g: 0.5 },
        { name: "Zapallo Amarillo", weight_g: 150, calories: 45, protein_g: 1.5, carbs_g: 10.0, fat_g: 0.2 }
      ],
      total_calories: 450,
      total_protein_g: 18.9,
      total_carbs_g: 80.0,
      total_fat_g: 6.9,
      hidden_ingredients_found: [
        { name: "Sofrito de cebolla tradicional", extra_calories: 90, description: "Cebolla sudada con aceite adicional y manteca para dar sabor criollo (+90 kcal)." }
      ]
    };
  } else {
    // Default Chicken & Rice generic
    analysis = {
      food_name: "Pechuga de Pollo Plancha con Arroz Blanco",
      estimated_weight_g: 300,
      ingredients: [
        { name: "Pechuga de Pollo", weight_g: 150, calories: 247, protein_g: 46.5, carbs_g: 0.0, fat_g: 5.4 },
        { name: "Arroz Blanco Cocido", weight_g: 150, calories: 195, protein_g: 4.0, carbs_g: 42.0, fat_g: 0.4 }
      ],
      total_calories: 442,
      total_protein_g: 50.5,
      total_carbs_g: 42.0,
      total_fat_g: 5.8,
      hidden_ingredients_found: [
        { name: "Aceite rociado en la plancha", extra_calories: 80, description: "Película fina de aderezo graso para la terminación (+80 kcal)." }
      ]
    };
  }

  res.json(analysis);
});

/**
 * MÓDULO 3: GESTIÓN DE COMPRAS Y DIETA LOCAL
 */
app.get('/api/foods/search', (req, res) => {
  const query = String(req.query.q || '');
  if (query.match(/^\d+$/)) {
    // Barcode lookup
    const found = findFoodByBarcode(query);
    return res.json(found ? [found] : []);
  }
  const results = searchFoods(query);
  res.json(results);
});

app.get('/api/foods/local-seed', (req, res) => {
  res.json(CHILEAN_LA_FOODS);
});

app.get('/api/recipes', (req, res) => {
  res.json(CHILEAN_RECIPES);
});

app.post('/api/shopping-list', (req, res) => {
  const { selectedRecipesIds, pantryInventory = {} } = req.body;

  // 1. Gather all recipe objects
  const selectedRecipes = CHILEAN_RECIPES.filter(r => selectedRecipesIds.includes(r.id));
  
  // 2. Aggregate ingredients algorithm
  const aggregates: Record<string, { qty: number; unit: string; category: string; recipes: string[] }> = {};

  selectedRecipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      const key = ing.name.toLowerCase().trim();
      if (!aggregates[key]) {
        aggregates[key] = {
          qty: 0,
          unit: ing.unit,
          category: ing.category,
          recipes: []
        };
      }
      aggregates[key].qty += ing.qty;
      if (!aggregates[key].recipes.includes(recipe.name)) {
        aggregates[key].recipes.push(recipe.name);
      }
    });
  });

  // 3. Subtract inventory items (Standardize metric: Amount to buy = Amount needed - Amount in pantry)
  const resultList = Object.entries(aggregates).map(([rawName, data]) => {
    // Check if name or parts match pantry inventory keys (e.g. "palta", "arroz")
    const matchKey = Object.keys(pantryInventory).find(pk => 
      rawName.includes(pk.toLowerCase()) || pk.toLowerCase().includes(rawName)
    );
    
    const inventoryQty = matchKey ? (Number(pantryInventory[matchKey]) || 0) : 0;
    const needed = data.qty;
    const finalBuy = Math.max(0, needed - inventoryQty);

    const prettyName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

    return {
      name: prettyName,
      needed_qty: needed,
      inventory_qty: inventoryQty,
      quantity: finalBuy,
      unit: data.unit,
      category: data.category,
      usedInRecipes: data.recipes
    };
  });

  res.json(resultList);
});

/**
 * MÓDULO 4: SUPABASE MULTI-TENANT SIMULATOR ENDPOINTS
 */

// Email authentication endpoint for secure session initiation
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'invalid_email', message: 'Por favor ingresa un correo electrónico válido.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Find if email already exists
  const existingId = Object.keys(simulatedUsers).find(id =>  (simulatedUsers as any)[id].email.toLowerCase().trim() === cleanEmail);

  if (existingId) {
    return res.json({
      userId: existingId,
      profile: (simulatedUsers as any)[existingId],
      isNew: false
    });
  }

  // Create a new user profile on the fly
  const newUserId = `user-${Date.now()}`;
  const emailNamePart = cleanEmail.split('@')[0];
  const parts = emailNamePart.split('.');
  
  const first_name = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "Usuario";
  const last_name = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "SaaS";

  const newProfile = {
    email: cleanEmail,
    first_name,
    last_name,
    date_of_birth: "1995-01-01",
    gender: "female" as Gender,
    height_cm: 170,
    weight_kg: 70.0,
    activity_level: "moderately_active" as ActivityLevel,
    goal: "lose_weight" as Goal,
    target_calories: 1800,
    target_protein_g: 140,
    target_carbs_g: 170,
    target_fat_g: 62,
    has_constipation_trouble: false,
    has_long_trips: false,
    has_other_condition: false,
    other_condition_notes: ""
  };

  (simulatedUsers as any)[newUserId] = newProfile;
  writeLocalDbFile('profiles.json', simulatedUsers);

  // Add dummy initial logs for this new user so their dashboard is not completely empty
  const todayStr = new Date().toISOString().split('T')[0];
  simulatedDailyLogs.push({
    id: `log-seed-1-${Date.now()}`,
    user_id: newUserId,
    log_date: todayStr,
    food_id: 1, // Palta
    custom_food_name: "Palta Hass de Bienvenida (100g)",
    calories: 160,
    protein_g: 2.0,
    carbs_g: 9.0,
    fat_g: 15.0,
    serving_count: 1.0,
    meal_type: "breakfast",
    created_at: new Date().toISOString()
  });
  writeLocalDbFile('logs.json', simulatedDailyLogs);

  return res.json({
    userId: newUserId,
    profile: newProfile,
    isNew: true
  });
});

// Simulates user authentication session switches in frontend
app.get('/api/database/users', (req, res) => {
  res.json(Object.entries(simulatedUsers).map(([id, val]) => ({ id, ...(val as any) })));
});

// GET profile with Row Level Security check
app.get('/api/database/profile', (req, res) => {
  const userIdHeader = String(req.headers['x-user-id'] || '');
  
  console.log(`[Supabase Auth Simulator] GET /user_profiles context matching uid() = "${userIdHeader}"`);

  if (!userIdHeader || !simulatedUsers[userIdHeader as keyof typeof simulatedUsers]) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Row-Level Security bloqueó el acceso. El token de sesión auth.uid() no es válido o está ausente.",
      applied_rls_sql: 'SELECT * FROM user_profiles WHERE user_id = auth.uid()'
    });
  }

  const profile = simulatedUsers[userIdHeader as keyof typeof simulatedUsers];
  res.json({
    profile,
    rls_applied: true,
    matching_uid_claim: userIdHeader,
    sql_executed: `SELECT * FROM user_profiles WHERE user_id = '${userIdHeader}'`
  });
});

// Update profile
app.post('/api/database/profile/update', (req, res) => {
  const userIdHeader = String(req.headers['x-user-id'] || '');
  const updatedData = req.body;

  if (!userIdHeader || !simulatedUsers[userIdHeader as keyof typeof simulatedUsers]) {
    return res.status(403).json({
      error: "rls_violation",
      message: "Row-Level Security error: UPDATE prohibido. auth.uid() no tiene privilegios locales.",
      applied_rls_sql: 'CREATE POLICY "Usuarios pueden gestionar su propio perfil" ON user_profiles FOR ALL USING (auth.uid() = user_id)'
    });
  }

  simulatedUsers[userIdHeader as keyof typeof simulatedUsers] = {
    ...simulatedUsers[userIdHeader as keyof typeof simulatedUsers],
    ...updatedData
  };
  writeLocalDbFile('profiles.json', simulatedUsers);

  res.json({
    success: true,
    profile: simulatedUsers[userIdHeader as keyof typeof simulatedUsers],
    sql_executed: `UPDATE user_profiles SET first_name='${updatedData.first_name || ''}', ... WHERE user_id = '${userIdHeader}'`
  });
});

// GET logs with RLS filters applied
app.get('/api/database/daily_logs', (req, res) => {
  const userIdHeader = String(req.headers['x-user-id'] || '');

  console.log(`[Supabase Auth Simulator] GET /daily_logs. Applying: "auth.uid() = user_id"`);

  if (!userIdHeader) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Falta encabezado de autenticación. RLS falló.",
    });
  }

  // Row Level Security filter: user can ONLY read rows where user_id matches their active uid
  const allowedLogs = simulatedDailyLogs.filter(log => log.user_id === userIdHeader);

  res.json({
    logs: allowedLogs,
    metadata: {
      total_unfiltered_rows_in_db: simulatedDailyLogs.length,
      filtered_rows_returned: allowedLogs.length,
      rls_policy_injected: `WHERE daily_logs.user_id = '${userIdHeader}'`,
      explaining_plan: `Seq Scan on daily_logs (cost=0.00..35.50 rows=1 width=328) Filter: (user_id = '${userIdHeader}'::uuid)`
    }
  });
});

// Log food
app.post('/api/database/daily_logs/insert', (req, res) => {
  const userIdHeader = String(req.headers['x-user-id'] || '');
  const { id, log_date, food_id, custom_food_name, calories, protein_g, carbs_g, fat_g, serving_count, meal_type, photoBase64 } = req.body;

  if (!userIdHeader) {
    return res.status(401).json({
      error: "forbidden",
      message: "Row-Level Security error: INSERT violado. auth.uid() vacio."
    });
  }

  const newLog: DailyLog = {
    id: id || `log-${Date.now()}`,
    user_id: userIdHeader,
    log_date: log_date || new Date().toISOString().split('T')[0],
    food_id,
    custom_food_name,
    calories: Number(calories) || 0,
    protein_g: Number(protein_g) || 0,
    carbs_g: Number(carbs_g) || 0,
    fat_g: Number(fat_g) || 0,
    serving_count: Number(serving_count) || 1.0,
    meal_type: meal_type || 'breakfast',
    created_at: new Date().toISOString(),
    photoBase64: photoBase64 || undefined
  };

  simulatedDailyLogs.push(newLog);
  writeLocalDbFile('logs.json', simulatedDailyLogs);

  res.json({
    success: true,
    added_log: newLog,
    sql_executed: `INSERT INTO daily_logs (id, user_id, log_date, food_id, custom_food_name, calories, protein_g, carbs_g, fat_g, serving_count, meal_type) VALUES ('${newLog.id}', '${userIdHeader}', '${newLog.log_date}', ${food_id || 'NULL'}, '${custom_food_name || ''}', ${calories}, ${protein_g}, ${carbs_g}, ${fat_g}, ${serving_count}, '${meal_type}')`
  });
});

// Delete a daily log
app.post('/api/database/daily_logs/delete', (req, res) => {
  const userIdHeader = String(req.headers['x-user-id'] || '');
  const { log_id } = req.body;

  if (!userIdHeader) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // Find the log to verify ownership first (Simulating RLS validation on delete)
  const existingLog = simulatedDailyLogs.find(l => l.id === log_id);
  if (!existingLog) {
    return res.status(404).json({ error: "not_found", message: "Registro no encontrado." });
  }

  if (existingLog.user_id !== userIdHeader) {
    return res.status(403).json({
      error: "rls_restriction",
      message: "Row-Level Security impidió la eliminación. No puedes borrar registros pertenecientes a otro UID.",
      sql_attempt: `DELETE FROM daily_logs WHERE id = '${log_id}' AND user_id = '${userIdHeader}'`
    });
  }

  simulatedDailyLogs = simulatedDailyLogs.filter(l => l.id !== log_id);
  writeLocalDbFile('logs.json', simulatedDailyLogs);
  res.json({
    success: true,
    deleted_id: log_id,
    sql_executed: `DELETE FROM daily_logs WHERE id = '${log_id}' AND user_id = '${userIdHeader}'`
  });
});

// Interactive multi-tenant test bypass demo: Attacker attempts to read mari's logs directly
app.post('/api/database/raw-query', (req, res) => {
  const userIdHeader = String(req.headers['x-user-id'] || '');
  const { sqlQuery } = req.body;

  const upperQuery = sqlQuery.toUpperCase().trim();
  
  if (!userIdHeader) {
    return res.json({
      success: false,
      errorCode: "42501 (insufficient_privilege)",
      reason: "Row Level Security: No se ha establecido un contexto de sesión de usuario de Supabase. Acceso denegado.",
      rows: []
    });
  }

  // Simple SQL analyzer simulation to show users how RLS appends WHERE statements on Postgres
  let simulatedOutput: any[] = [];
  let isRlsApplied = true;
  let reason = "";

  if (upperQuery.includes("DAILY_LOGS")) {
    if (upperQuery.includes("WHERE USER_ID")) {
      // Checking if they tried to bypass and access someone else
      const matchesMari = upperQuery.includes("DE99BBFB-3712-40DE-8E3B-9304005FC080");
      if (matchesMari && userIdHeader !== 'de99bbfb-3712-40de-8e3b-9304005fc080') {
        isRlsApplied = true;
        simulatedOutput = [];
        reason = "Políticas RLS en acción: La consulta intentó forzar 'user_id' de otro usuario, pero la regla 'USING (auth.uid() = user_id)' de PostgreSQL reescribió los filtros de la consulta final reduciéndola a la nada. Cero filas devueltas.";
      } else {
        // Normal filter
        simulatedOutput = simulatedDailyLogs.filter(log => log.user_id === userIdHeader);
        reason = `Filtros procesados correctamente. Se devolvieron las filas del UID actual ('${userIdHeader}').`;
      }
    } else {
      // Attemped unconstrained query (e.g. SELECT * FROM daily_logs)
      // Supabase's PG engine automatically rewrites this to include: WHERE user_id = auth.uid()
      simulatedOutput = simulatedDailyLogs.filter(log => log.user_id === userIdHeader);
      reason = `Consulta general reescrita automáticamente por Supabase RLS. Filtro implícito añadido: 'user_id = auth.uid()' (Fila restringida a '${simulatedUsers[userIdHeader as keyof typeof simulatedUsers].email}').`;
    }
  } else if (upperQuery.includes("USER_PROFILES")) {
    simulatedOutput = [simulatedUsers[userIdHeader as keyof typeof simulatedUsers]].filter(Boolean);
    reason = `Políticas RLS aplicadas. Se limitó el resultado a tu perfil de usuario actual ('${userIdHeader}').`;
  } else if (upperQuery.includes("FOODS")) {
    // Foods are public (not under RLS limits in user spec)
    simulatedOutput = CHILEAN_LA_FOODS;
    isRlsApplied = false;
    reason = "La tabla 'foods' es de acceso público global (sin restricciones de RLS). Se devolvieron todos los registros maestros.";
  } else {
    return res.json({
      success: false,
      errorCode: "42601 (syntax_error)",
      reason: "Simulador de SQL solo soporta consultas sobre las tablas 'user_profiles', 'daily_logs' y 'foods' de forma segura en este MVP.",
      rows: []
    });
  }

  res.json({
    success: true,
    executed_sql: upperQuery,
    rls_applied: isRlsApplied,
    reason,
    rows: simulatedOutput,
    current_uid_acting_as: userIdHeader
  });
});
// GET scanned history with RLS simulation
app.get('/api/database/scanned_history', (req, res) => {
  const userIdHeader = String(req.headers['x-user-id'] || '');
  
  if (!userIdHeader) {
    return res.status(401).json({
      error: "unauthorized",
      message: "Falta encabezado de autenticación. RLS falló.",
    });
  }

  const allHistory = readLocalDbFile('scanned_history.json', {});
  const userHistory = allHistory[userIdHeader] || [];
  
  res.json({
    history: userHistory
  });
});

// Update scanned history
app.post('/api/database/scanned_history/update', (req, res) => {
  const userIdHeader = String(req.headers['x-user-id'] || '');
  const { history } = req.body;

  if (!userIdHeader) {
    return res.status(401).json({
      error: "forbidden",
      message: "Row-Level Security error: INSERT/UPDATE violado. auth.uid() vacio."
    });
  }

  const allHistory = readLocalDbFile('scanned_history.json', {});
  allHistory[userIdHeader] = Array.isArray(history) ? history : [];
  writeLocalDbFile('scanned_history.json', allHistory);

  res.json({
    success: true
  });
});


// --- END OF MAIN API ROUTES ---

// Export the app for serverless function use on Vercel
export default app;

// Vite Middleware & static handlers
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const viteModuleName = 'vite';
    const { createServer: createViteServer } = await import(viteModuleName);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}
