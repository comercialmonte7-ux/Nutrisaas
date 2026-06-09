/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  Apple,
  Camera,
  History,
  ListChecks,
  Scale,
  Search,
  ShoppingBag,
  Trash2,
  RefreshCw,
  Droplet,
  Sparkles,
  Heart,
  Calendar,
  Activity,
  LogOut
} from 'lucide-react';
import { CHILEAN_RECIPES } from './recipes';
import { CHILEAN_LA_FOODS } from './foodDatabase';
import { Gender, ActivityLevel, Goal, MacroMethod, UserProfile, DailyLog, CalculationResult, VisualFoodAnalysis } from './types';

import HomeView from './components/HomeView';
import CalculatorView from './components/CalculatorView';
import ScannerView from './components/ScannerView';
import RecipesView from './components/RecipesView';
import DbExplorerView from './components/DbExplorerView';
import LoginView from './components/LoginView';

export default function App() {
  // System Sessions / Authenticated User Context Simulator
  const [users, setUsers] = useState<any[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(() => {
    return localStorage.getItem('nutrisaas_active_user_id');
  });
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<{ type: 'success' | 'info' | 'error'; text: string; sql?: string } | null>(null);
  const [isStaticMode, setIsStaticMode] = useState<boolean>(() => {
    return localStorage.getItem('nutrisaas_is_static_mode') === 'true';
  });

  // Active Tab/App View inside mobile device simulation
  const [mobileScreen, setMobileScreen] = useState<'home' | 'calculator' | 'scanner' | 'recipes' | 'db_explorer'>('home');

  // Interactive Hydration state managed with local storage
  const [waterIntake, setWaterIntake] = useState<number>(() => {
    const saved = localStorage.getItem('nutrisaas_water_intake');
    return saved ? Number(saved) : 3;
  });

  const handleModifyWater = (amount: number) => {
    setWaterIntake(prev => {
      const next = Math.max(0, Math.min(12, prev + amount));
      localStorage.setItem('nutrisaas_water_intake', String(next));
      return next;
    });
  };

  // MÓDULO 1: Scientific Calculator interactive parameters
  const [calcForm, setCalcForm] = useState({
    weight_kg: 68.5,
    height_cm: 165,
    age: 32,
    gender: 'female' as Gender,
    activity_level: 'moderately_active' as ActivityLevel,
    goal: 'lose_weight' as Goal,
    macro_method: 'weight_ratio' as MacroMethod,
    specific_protein_ratio: 2.0, // 2.0g/kg
    specific_fat_ratio: 0.9,     // 0.9g/kg
    wearable_enabled: true,
    activeCaloriesToday: 420,
    deviceName: 'Apple Watch Ultra',
    has_constipation_trouble: true,
    has_long_trips: true,
    has_other_condition: false,
    other_condition_notes: ''
  });
  const [calculatedTarget, setCalculatedTarget] = useState<CalculationResult | null>(null);

  // MÓDULO 2: Visión por Computadora simulation / uploads
  const [cameraPhotoBase64, setCameraPhotoBase64] = useState<string | null>(null);
  const [scanningStatus, setScanningStatus] = useState<string | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<VisualFoodAnalysis | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0); // 1.0 = 100% of analyzed weight
  const [hiddenIngredientsForm, setHiddenIngredientsForm] = useState<{ name: string; extra_calories: number; checked: boolean }[]>([
    { name: "Aceite de cocina (para sofreír/plancha)", extra_calories: 120, checked: false },
    { name: "Aderezo de ensaladas rico en grasas", extra_calories: 85, checked: false },
    { name: "Margarina o mantequilla extra añadida", extra_calories: 110, checked: false },
  ]);
  const [barcodeSearchQuery, setBarcodeSearchQuery] = useState("");
  const [localFoodSearchQuery, setLocalFoodSearchQuery] = useState("");
  const [foodSearchResults, setFoodSearchResults] = useState<any[]>([]);

  // MÓDULO 3: Recipe Shopping list Planner
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>(["recipe-3", "recipe-2"]); // Default starting plan
  const [shoppingListResult, setShoppingListResult] = useState<any[]>([]);
  const [shoppingCheckedItems, setShoppingCheckedItems] = useState<Record<string, boolean>>({});
  const [pantryInventory, setPantryInventory] = useState<Record<string, number>>({
    "palta": 100, // 100g of avocado already in household
    "arroz": 0,
    "cebolla": 100,
    "marraqueta": 0,
    "lomo": 150
  });

  // Food log modal helper
  const [loggedMealType, setLoggedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

  // Trigger TDEE calculation locally and automatically on parameter changes
  useEffect(() => {
    calculateTDEELocally();
  }, [calcForm]);

  // Sync profile data and logs on init or user switch
  useEffect(() => {
    if (activeUserId) {
      fetchUserData();
    }
  }, [activeUserId]);

  const fetchUserData = async () => {
    if (!activeUserId) return;
    setLoading(true);
    setDbStatusMsg(null);

    const checkIsJson = (res: Response) => {
      const contentType = res.headers.get('content-type');
      return !!(contentType && contentType.includes('application/json'));
    };

    try {
      if (isStaticMode) {
        throw new Error('Static Mode Force Back');
      }

      // 1. Fetch Users List
      const usersRes = await fetch('/api/database/users');
      if (usersRes.ok && checkIsJson(usersRes)) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      } else {
        throw new Error('Not local server - static mode');
      }

      // 2. Fetch targeted Profile
      const profRes = await fetch('/api/database/profile', {
        headers: { 'x-user-id': activeUserId || '' }
      });
      if (profRes.ok && checkIsJson(profRes)) {
        const pData = await profRes.json();
        setActiveProfile(pData.profile);
        // Pre-populate calculator fields from the database profile
        if (pData.profile) {
          const birthDate = new Date(pData.profile.date_of_birth);
          const ageCalculated = new Date().getFullYear() - birthDate.getFullYear();
          setCalcForm(prev => ({
            ...prev,
            weight_kg: Number(pData.profile.weight_kg),
            height_cm: Number(pData.profile.height_cm),
            age: isNaN(ageCalculated) ? 30 : ageCalculated,
            gender: pData.profile.gender as Gender,
            activity_level: pData.profile.activity_level as ActivityLevel,
            goal: pData.profile.goal as Goal,
            has_constipation_trouble: pData.profile.has_constipation_trouble !== undefined ? !!pData.profile.has_constipation_trouble : false,
            has_long_trips: pData.profile.has_long_trips !== undefined ? !!pData.profile.has_long_trips : false,
            has_other_condition: pData.profile.has_other_condition !== undefined ? !!pData.profile.has_other_condition : false,
            other_condition_notes: pData.profile.other_condition_notes || ''
          }));
        }
      } else {
        setActiveProfile(null);
      }

      // 3. Fetch Daily Logs
      const logsRes = await fetch('/api/database/daily_logs', {
        headers: { 'x-user-id': activeUserId || '' }
      });
      if (logsRes.ok && checkIsJson(logsRes)) {
        const lData = await logsRes.json();
        setDailyLogs(lData.logs || []);
      }
    } catch (e) {
      console.log('Utilizando base de datos local (Vercel Offline/Static mode)...');
      setIsStaticMode(true);
      localStorage.setItem('nutrisaas_is_static_mode', 'true');

      // 1. Emulate users
      const localProfilesKey = 'nutrisaas_local_profiles';
      const localProfiles = JSON.parse(localStorage.getItem(localProfilesKey) || '{}');
      const usersList = Object.entries(localProfiles).map(([id, val]: any) => ({ id, ...val }));
      setUsers(usersList);

      // 2. Emulate active profile
      const prof = localProfiles[activeUserId];
      if (prof) {
        setActiveProfile(prof);
        // Pre-populate calculator fields
        const birthDate = new Date(prof.date_of_birth);
        const ageCalculated = new Date().getFullYear() - birthDate.getFullYear();
        setCalcForm(prev => ({
          ...prev,
          weight_kg: Number(prof.weight_kg),
          height_cm: Number(prof.height_cm),
          age: isNaN(ageCalculated) ? 30 : ageCalculated,
          gender: prof.gender as Gender,
          activity_level: prof.activity_level as ActivityLevel,
          goal: prof.goal as Goal,
          has_constipation_trouble: prof.has_constipation_trouble !== undefined ? !!prof.has_constipation_trouble : false,
          has_long_trips: prof.has_long_trips !== undefined ? !!prof.has_long_trips : false,
          has_other_condition: prof.has_other_condition !== undefined ? !!prof.has_other_condition : false,
          other_condition_notes: prof.other_condition_notes || ''
        }));
      }

      // 3. Emulate logs
      const localLogsKey = 'nutrisaas_local_logs';
      const localLogs = JSON.parse(localStorage.getItem(localLogsKey) || '[]');
      const userLogs = localLogs.filter((l: any) => l.user_id === activeUserId);
      setDailyLogs(userLogs);
    } finally {
      setLoading(false);
    }
  };

  const calculateTDEELocally = async () => {
    try {
      if (isStaticMode) {
        throw new Error('Static mode calculations active');
      }

      const res = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight_kg: calcForm.weight_kg,
          height_cm: calcForm.height_cm,
          age: calcForm.age,
          gender: calcForm.gender,
          activity_level: calcForm.activity_level,
          goal: calcForm.goal,
          macro_method: calcForm.macro_method,
          specific_protein_ratio: calcForm.specific_protein_ratio,
          specific_fat_ratio: calcForm.specific_fat_ratio,
          wearable_config: {
            enabled: calcForm.wearable_enabled,
            activeCaloriesToday: calcForm.activeCaloriesToday,
            deviceName: calcForm.deviceName
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCalculatedTarget(data);
      } else {
        throw new Error('Calculate server failed or static');
      }
    } catch (err) {
      // Offline / Static Mifflin-St Jeor local formula calculation
      const weight = calcForm.weight_kg;
      const height = calcForm.height_cm;
      const age = calcForm.age;
      const gender = calcForm.gender;
      
      let bmr = 0;
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }

      const activityMultipliers: Record<ActivityLevel, number> = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
        extra_active: 1.9
      };

      const multiplier = activityMultipliers[calcForm.activity_level] || 1.375;
      let tdee = Math.round(bmr * multiplier);

      if (calcForm.wearable_enabled) {
        tdee += calcForm.activeCaloriesToday;
      }

      let targetKcal = tdee;
      if (calcForm.goal === 'lose_weight') {
        targetKcal = Math.round(tdee - 500);
      } else if (calcForm.goal === 'gain_muscle') {
        targetKcal = Math.round(tdee + 300);
      }
      if (targetKcal < 1200) targetKcal = 1200; // safe baseline

      let protG = 135;
      let carbsG = 140;
      let fatG = 60;

      if (calcForm.macro_method === 'weight_ratio') {
        protG = Math.round(weight * calcForm.specific_protein_ratio);
        fatG = Math.round(weight * calcForm.specific_fat_ratio);
        const protKcal = protG * 4;
        const fatKcal = fatG * 9;
        const remainingKcal = Math.max(0, targetKcal - protKcal - fatKcal);
        carbsG = Math.round(remainingKcal / 4);
      } else {
        // Balanced ratio 30/40/30
        protG = Math.round((targetKcal * 0.3) / 4);
        carbsG = Math.round((targetKcal * 0.4) / 4);
        fatG = Math.round((targetKcal * 0.3) / 9);
      }

      setCalculatedTarget({
        bmr: Math.round(bmr),
        tdee,
        target_calories: targetKcal,
        target_protein_g: protG,
        target_carbs_g: carbsG,
        target_fat_g: fatG,
        water_l: Number((weight * 0.035).toFixed(1)),
        dietary_fiber_g: calcForm.has_constipation_trouble ? 35 : 25
      });
    }
  };

  const handleUpdateSupabaseProfile = async () => {
    if (!calculatedTarget) return;
    setLoading(true);
    
    const payload = {
      gender: calcForm.gender,
      height_cm: calcForm.height_cm,
      weight_kg: calcForm.weight_kg,
      activity_level: calcForm.activity_level,
      goal: calcForm.goal,
      target_calories: calculatedTarget.target_calories,
      target_protein_g: calculatedTarget.target_protein_g,
      target_carbs_g: calculatedTarget.target_carbs_g,
      target_fat_g: calculatedTarget.target_fat_g,
      has_constipation_trouble: !!calcForm.has_constipation_trouble,
      has_long_trips: !!calcForm.has_long_trips,
      has_other_condition: !!calcForm.has_other_condition,
      other_condition_notes: calcForm.other_condition_notes || ''
    };

    try {
      if (isStaticMode) {
        throw new Error('Static Mode Force Update Local');
      }

      const res = await fetch('/api/database/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeUserId || ''
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDbStatusMsg({
          type: 'success',
          text: `¡Tu perfil clínico y metas nutricionales han sido actualizados con éxito!`
        });
        fetchUserData();
      } else {
        throw new Error('Profile update failed on server');
      }
    } catch (err: any) {
      // Local storage profile update
      const localProfilesKey = 'nutrisaas_local_profiles';
      const localProfiles = JSON.parse(localStorage.getItem(localProfilesKey) || '{}');
      if (activeUserId) {
        localProfiles[activeUserId] = {
          ...localProfiles[activeUserId],
          ...payload
        };
        localStorage.setItem(localProfilesKey, JSON.stringify(localProfiles));
        setDbStatusMsg({
          type: 'success',
          text: `¡Tu perfil clínico y metas nutricionales han sido guardados localmente!`
        });
        fetchUserData();
      } else {
        setDbStatusMsg({ type: 'error', text: `Error: ${err.message || 'ID usuario ausente'}` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPresetPhoto = async (presetName: string) => {
    setScanningStatus("Escaneando plato e invocando IA de Nutrición (Gemini con visión)...");
    setAiAnalysisResult(null);
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: null, // trigger fallback presets or prompt based simulation
          mockFoodQuery: presetName
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysisResult(data);
        setPortionMultiplier(1.0);
        // Reset hidden checklist
        setHiddenIngredientsForm([
          { name: "Aceite de cocina (para sofreír/plancha)", extra_calories: 120, checked: false },
          { name: "Aderezo de ensaladas rico en grasas", extra_calories: 85, checked: false },
          { name: "Margarina o mantequilla extra añadida", extra_calories: 110, checked: false },
        ]);
      }
    } catch (_) {
    } finally {
      setScanningStatus(null);
    }
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningStatus("Leyendo bytes y procesando imagen en red...");
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setCameraPhotoBase64(base64String);

      try {
        const res = await fetch('/api/analyze-food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64String,
            mockFoodQuery: file.name
          })
        });
        if (res.ok) {
          const data = await res.json();
          setAiAnalysisResult(data);
          setPortionMultiplier(1.0);
          setScanningStatus(null);
        } else {
          setScanningStatus("Error del servidor de visión artificial, usando presets chilenos.");
          setTimeout(() => handleApplyPresetPhoto(file.name), 1000);
        }
      } catch (err) {
        setScanningStatus("Error cargando modelo: fallando hacia presets chilenos.");
        setTimeout(() => handleApplyPresetPhoto(file.name), 1000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddAnalyzedFoodToLog = async () => {
    if (!aiAnalysisResult) return;
    setLoading(true);

    // Calculate final metrics considering Portion Slider and Hidden Ingredients Checklist
    const mult = portionMultiplier;
    const computedIngredientsCalories = Math.round(aiAnalysisResult.total_calories * mult);
    const hiddenCalories = hiddenIngredientsForm
      .filter(item => item.checked)
      .reduce((sum, item) => sum + item.extra_calories, 0);

    const totalKcal = computedIngredientsCalories + hiddenCalories;
    const totalProt = Number((aiAnalysisResult.total_protein_g * mult).toFixed(1));
    const totalCarb = Number((aiAnalysisResult.total_carbs_g * mult).toFixed(1));
    const totalFat = Number((aiAnalysisResult.total_fat_g * mult + (hiddenCalories / 9)).toFixed(1));

    const payload = {
      log_date: new Date().toISOString().split('T')[0],
      custom_food_name: `${aiAnalysisResult.food_name} (${Math.round(mult * 105)}% de porción)`,
      calories: totalKcal,
      protein_g: totalProt,
      carbs_g: totalCarb,
      fat_g: totalFat,
      serving_count: mult,
      meal_type: loggedMealType
    };

    try {
      if (isStaticMode) {
        throw new Error('Static Mode Active');
      }

      const res = await fetch('/api/database/daily_logs/insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeUserId || ''
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDbStatusMsg({
          type: 'success',
          text: `¡Alimento analizado correctamente e integrado a tu bitácora de hoy!`
        });
        fetchUserData();
        setMobileScreen('home'); // Go back to mobile dashboard
      } else {
        throw new Error('Server insert failed');
      }
    } catch (err: any) {
      // Local storage fallback log insertion
      const localLogsKey = 'nutrisaas_local_logs';
      const localLogs = JSON.parse(localStorage.getItem(localLogsKey) || '[]');
      const newLog = {
        id: `local-log-${Date.now()}`,
        user_id: activeUserId,
        ...payload,
        created_at: new Date().toISOString()
      };
      localStorage.setItem(localLogsKey, JSON.stringify([newLog, ...localLogs]));
      setDbStatusMsg({
        type: 'success',
        text: `¡Alimento analizado correctamente e integrado a tu bitácora de hoy (Local)!`
      });
      fetchUserData();
      setMobileScreen('home');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async (query: string, searchType: 'barcode' | 'local') => {
    if (searchType === 'barcode') {
      setBarcodeSearchQuery(query);
    } else {
      setLocalFoodSearchQuery(query);
    }

    if (query.length < 2) {
      setFoodSearchResults([]);
      return;
    }

    try {
      if (isStaticMode) {
        throw new Error('Static Mode Active');
      }

      const res = await fetch(`/api/foods/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setFoodSearchResults(data);
      } else {
        throw new Error('Search API failed or static');
      }
    } catch (_) {
      // High fidelity client-side query over CHILEAN_LA_FOODS
      const queryL = query.toLowerCase().trim();
      if (searchType === 'barcode') {
        const found = CHILEAN_LA_FOODS.find(f => f.barcode === queryL);
        setFoodSearchResults(found ? [found] : []);
      } else {
        const found = CHILEAN_LA_FOODS.filter(f => 
          f.name.toLowerCase().includes(queryL) || 
          (f.brand && f.brand.toLowerCase().includes(queryL))
        );
        setFoodSearchResults(found);
      }
    }
  };

  const handleLogManualFood = async (food: any) => {
    setLoading(true);
    const payload = {
      log_date: new Date().toISOString().split('T')[0],
      food_id: food.id,
      custom_food_name: food.name,
      calories: Math.round(food.calories_100g * (food.serving_size_g / 100)),
      protein_g: Number((food.protein_100g * (food.serving_size_g / 100)).toFixed(1)),
      carbs_g: Number((food.carbs_100g * (food.serving_size_g / 100)).toFixed(1)),
      fat_g: Number((food.fat_100g * (food.serving_size_g / 100)).toFixed(1)),
      serving_count: 1.0,
      meal_type: "snack"
    };

    try {
      if (isStaticMode) {
        throw new Error('Static Mode Active');
      }

      const res = await fetch('/api/database/daily_logs/insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeUserId || ''
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDbStatusMsg({
          type: 'success',
          text: `¡Alimento registrado exitosamente en tu bitácora de hoy!`
        });
        fetchUserData();
        setFoodSearchResults([]);
        setBarcodeSearchQuery("");
        setLocalFoodSearchQuery("");
      } else {
        throw new Error('Server manual insert failed');
      }
    } catch (err: any) {
      // Local storage manual food insert
      const localLogsKey = 'nutrisaas_local_logs';
      const localLogs = JSON.parse(localStorage.getItem(localLogsKey) || '[]');
      const newLog = {
        id: `local-log-${Date.now()}`,
        user_id: activeUserId,
        ...payload,
        created_at: new Date().toISOString()
      };
      localStorage.setItem(localLogsKey, JSON.stringify([newLog, ...localLogs]));
      setDbStatusMsg({
        type: 'success',
        text: `¡Alimento registrado exitosamente en tu bitácora de hoy (Local)!`
      });
      fetchUserData();
      setFoodSearchResults([]);
      setBarcodeSearchQuery("");
      setLocalFoodSearchQuery("");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDailyLog = async (logId: string | number) => {
    setLoading(true);
    try {
      if (isStaticMode) {
        throw new Error('Static Mode Active');
      }

      const res = await fetch('/api/database/daily_logs/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeUserId || ''
        },
        body: JSON.stringify({ log_id: logId })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDbStatusMsg({
          type: 'success',
          text: `El platillo ha sido eliminado de tu registro diario.`
        });
        fetchUserData();
      } else {
        throw new Error('Delete failed on server');
      }
    } catch (err: any) {
      // Local storage daily log delete
      const localLogsKey = 'nutrisaas_local_logs';
      const localLogs = JSON.parse(localStorage.getItem(localLogsKey) || '[]');
      const filtered = localLogs.filter((l: any) => l.id !== logId);
      localStorage.setItem(localLogsKey, JSON.stringify(filtered));
      setDbStatusMsg({
        type: 'success',
        text: `El platillo ha sido eliminado de tu registro diario local.`
      });
      fetchUserData();
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogFood = async (
    name: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack'
  ) => {
    setLoading(true);
    const payload = {
      log_date: new Date().toISOString().split('T')[0],
      custom_food_name: name,
      calories: calories,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      serving_count: 1.0,
      meal_type: mealType
    };

    try {
      if (isStaticMode) {
        throw new Error('Static Mode Active');
      }

      const res = await fetch('/api/database/daily_logs/insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeUserId || ''
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setDbStatusMsg({
          type: 'success',
          text: `¡${name} agregado con éxito a tu bitácora de hoy!`
        });
        fetchUserData();
      } else {
        throw new Error('Server insert failed');
      }
    } catch (err: any) {
      // Local storage logging fallback
      const localLogsKey = 'nutrisaas_local_logs';
      const localLogs = JSON.parse(localStorage.getItem(localLogsKey) || '[]');
      const newLog = {
        id: `local-log-${Date.now()}`,
        user_id: activeUserId,
        ...payload,
        created_at: new Date().toISOString()
      };
      localStorage.setItem(localLogsKey, JSON.stringify([newLog, ...localLogs]));
      setDbStatusMsg({
        type: 'success',
        text: `¡${name} agregado con éxito a tu bitácora de hoy (Local)!`
      });
      fetchUserData();
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipeSelection = (recipeId: string) => {
    setSelectedRecipes(prev =>
      prev.includes(recipeId) ? prev.filter(id => id !== recipeId) : [...prev, recipeId]
    );
  };

  const generateShoppingList = async () => {
    setLoading(true);
    try {
      if (isStaticMode) {
        throw new Error('Static Mode Active');
      }

      const res = await fetch('/api/shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedRecipesIds: selectedRecipes,
          pantryInventory
        })
      });
      if (res.ok) {
        const data = await res.json();
        setShoppingListResult(data);
        // Reset checkable UI list
        const initialChecked: Record<string, boolean> = {};
        data.forEach((item: any) => {
          initialChecked[item.name] = false;
        });
        setShoppingCheckedItems(initialChecked);
      } else {
        throw new Error('Shopping list generation failed or static');
      }
    } catch (e) {
      // Dynamic local shopping list algorithm using imported ingredients/recipes
      const needed: Record<string, { qty: number; unit: string }> = {};
      selectedRecipes.forEach(recipeId => {
        const rec = CHILEAN_RECIPES.find(r => r.id === recipeId);
        if (rec && rec.ingredients) {
          rec.ingredients.forEach(ing => {
            const name = ing.name.toLowerCase();
            const current = needed[name] || { qty: 0, unit: ing.unit };
            needed[name] = {
              qty: current.qty + ing.qty,
              unit: ing.unit
            };
          });
        }
      });

      const list: any[] = [];
      Object.entries(needed).forEach(([ingName, info]) => {
        const stock = pantryInventory[ingName] || 0;
        const required = info.qty;
        const shortage = Math.max(0, required - stock);
        list.push({
          ingredient: ingName.charAt(0).toUpperCase() + ingName.slice(1),
          required,
          pantry_stock: stock,
          shortage,
          unit: info.unit
        });
      });

      setShoppingListResult(list);
      const initialChecked: Record<string, boolean> = {};
      list.forEach((item: any) => {
        initialChecked[item.ingredient] = false;
      });
      setShoppingCheckedItems(initialChecked);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePantry = (ingredientKey: string, val: number) => {
    setPantryInventory(prev => ({
      ...prev,
      [ingredientKey]: val
    }));
  };

  // Run automatically on first render
  useEffect(() => {
    generateShoppingList();
  }, [pantryInventory, selectedRecipes]);

  const handleSignOut = () => {
    localStorage.removeItem('nutrisaas_active_user_id');
    setActiveUserId(null);
    setActiveProfile(null);
    setDailyLogs([]);
  };

  // Compute aggregated totals for the user logs today
  const loggedTodayCalories = dailyLogs.reduce((sum, item) => sum + item.calories, 0);
  const loggedTodayProtein = dailyLogs.reduce((sum, item) => sum + Number(item.protein_g), 0);
  const loggedTodayCarbs = dailyLogs.reduce((sum, item) => sum + Number(item.carbs_g), 0);
  const loggedTodayFat = dailyLogs.reduce((sum, item) => sum + Number(item.fat_g), 0);

  const budgetCalories = activeProfile?.target_calories || 1700;
  const budgetProtein = activeProfile?.target_protein_g || 120;
  const budgetCarbs = activeProfile?.target_carbs_g || 160;
  const budgetFat = activeProfile?.target_fat_g || 60;

  if (!activeUserId) {
    return <LoginView onLoginSuccess={(uid) => setActiveUserId(uid)} loading={loading} setLoading={setLoading} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans antialiased">
      
      {/* NutriSaaS Consumer App Header with Beautiful Brand Focus & User Card */}
      <header className="border-b border-[#E1E6DC]/80 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#5A7C56] to-[#3D5C3A] rounded-2xl text-white shadow-xs">
              <Apple className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-stone-900">
                  NutriSaaS
                </h1>
                <span className="text-[10px] bg-[#EFF4EE] text-[#3D5C3A] font-black px-2.5 py-0.5 rounded-full border border-[#CDDCD0]">
                  Mi Nutrición Inteligente
                </span>
                {isStaticMode && (
                  <span className="text-[10px] bg-[#E8F1FC] text-blue-700 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200 animate-pulse" title="Ejecutando en Modo Sandbox Local Storage (Vercel)">
                    Modo Local Activo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 font-bold">Bitácora activa y planificador de precisión saludable</p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-stone-100 pt-3 sm:pt-0">
            {/* Elegant User Card Profile instead of Patient badge */}
             <div className="flex items-center gap-2.5 bg-[#FAF8F5] p-1.5 pl-2 pr-3.5 rounded-2xl border border-[#CDDCD0]/80">
              <div className="w-7 h-7 rounded-xl bg-[#5A7C56] text-white flex items-center justify-center font-black text-xs shadow-3xs uppercase">
                {activeProfile ? `${activeProfile.first_name[0]}${activeProfile.last_name[0]}` : "RM"}
              </div>
              <div className="text-left leading-none">
                <span className="text-[9px] text-stone-400 font-extrabold block uppercase tracking-wider">Bitácora de</span>
                <span className="text-xs font-black text-stone-850">
                  {activeProfile ? `${activeProfile.first_name} ${activeProfile.last_name}` : "Ricardo Mari"}
                </span>
              </div>
            </div>

            <button 
              onClick={fetchUserData} 
              className="p-2 bg-white hover:bg-[#EFF4EE] border border-stone-250 rounded-xl text-[#5A7C56] transition shadow-3xs hover:shadow-2xs cursor-pointer flex-shrink-0" 
              title="Sincronizar Hoy"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button 
              onClick={handleSignOut} 
              className="p-2 bg-white hover:bg-rose-50 border border-stone-250 hover:border-rose-200 rounded-xl text-stone-500 hover:text-rose-600 transition shadow-3xs hover:shadow-2xs cursor-pointer flex-shrink-0" 
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Non-Scrollable Grid Navigation */}
      <div className="bg-[#FAF8F5] border-b border-[#CDDCD0]/60 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-stone-100/70 p-1.5 rounded-2xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 shadow-3xs">
            {[
              { id: 'home', label: 'Mi Bitácora', icon: History },
              { id: 'calculator', label: 'Metas & Perfil', icon: Scale },
              { id: 'scanner', label: 'Escáner Inteligente IA', icon: Camera },
              { id: 'recipes', label: 'Recetas & Compras', icon: ShoppingBag },
              { id: 'db_explorer', label: 'Buscador INTA', icon: Search }
            ].map(t => {
              const Icon = t.icon;
              const active = mobileScreen === t.id;
              return (
                <button 
                  key={t.id} 
                  onClick={() => setMobileScreen(t.id as any)} 
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-center text-xs font-extrabold transition duration-150 cursor-pointer ${
                    active 
                      ? 'bg-gradient-to-r from-[#5A7C56] to-[#3D5C3A] text-white shadow-xs' 
                      : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {dbStatusMsg && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between text-xs font-bold ${dbStatusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-[#3D5C3A]' : 'bg-red-50 border-red-100 text-red-900'}`}>
            <span>{dbStatusMsg.text}</span>
            <button onClick={() => setDbStatusMsg(null)} className="text-[#5A7C56] hover:underline cursor-pointer">Entendido</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Interactive Tab Render view space */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tab 1: Home View */}
            {mobileScreen === 'home' && (
              <HomeView
                activeProfile={activeProfile}
                activeUserId={activeUserId}
                calcForm={calcForm}
                setCalcForm={setCalcForm}
                dailyLogs={dailyLogs}
                loggedTodayCalories={loggedTodayCalories}
                loggedTodayProtein={loggedTodayProtein}
                loggedTodayCarbs={loggedTodayCarbs}
                loggedTodayFat={loggedTodayFat}
                budgetCalories={budgetCalories}
                budgetProtein={budgetProtein}
                budgetCarbs={budgetCarbs}
                budgetFat={budgetFat}
                waterIntake={waterIntake}
                handleModifyWater={handleModifyWater}
                handleDeleteDailyLog={handleDeleteDailyLog}
                setMobileScreen={setMobileScreen}
                handleQuickLogFood={handleQuickLogFood}
              />
            )}

            {/* Tab 2: Settings & Calculations */}
            {mobileScreen === 'calculator' && (
              <CalculatorView
                calcForm={calcForm}
                setCalcForm={setCalcForm}
                calculatedTarget={calculatedTarget}
                handleUpdateSupabaseProfile={handleUpdateSupabaseProfile}
                loading={loading}
              />
            )}

            {/* Tab 3: AI Lens Plate Scanner */}
            {mobileScreen === 'scanner' && (
              <ScannerView
                cameraPhotoBase64={cameraPhotoBase64}
                handleFileUpload={handleFileUpload}
                scanningStatus={scanningStatus}
                handleApplyPresetPhoto={handleApplyPresetPhoto}
                aiAnalysisResult={aiAnalysisResult}
                portionMultiplier={portionMultiplier}
                setPortionMultiplier={setPortionMultiplier}
                hiddenIngredientsForm={hiddenIngredientsForm}
                setHiddenIngredientsForm={setHiddenIngredientsForm}
                loggedMealType={loggedMealType}
                setLoggedMealType={setLoggedMealType}
                handleAddAnalyzedFoodToLog={handleAddAnalyzedFoodToLog}
              />
            )}

            {/* Tab 4: Recipe Matrix Map */}
            {mobileScreen === 'recipes' && (
              <RecipesView
                CHILEAN_RECIPES={CHILEAN_RECIPES}
                selectedRecipes={selectedRecipes}
                toggleRecipeSelection={toggleRecipeSelection}
                pantryInventory={pantryInventory}
                handleUpdatePantry={handleUpdatePantry}
                shoppingListResult={shoppingListResult}
                shoppingCheckedItems={shoppingCheckedItems}
                setShoppingCheckedItems={setShoppingCheckedItems}
              />
            )}

            {/* Tab 5: Food databases Search Maestro */}
            {mobileScreen === 'db_explorer' && (
              <DbExplorerView
                localFoodSearchQuery={localFoodSearchQuery}
                handleManualSearch={handleManualSearch}
                foodSearchResults={foodSearchResults}
                handleLogManualFood={handleLogManualFood}
              />
            )}

          </div>

          {/* Right column: Patient Health & Progress Panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Water Tracker Widget */}
            <div className="bg-white rounded-3xl p-6 border border-[#CDDCD0] shadow-xs space-y-5 animate-fade-in" id="water_tracker_widget">
              <div className="flex items-center justify-between border-b border-[#EFF4EE] pb-3">
                <h4 className="text-sm font-extrabold text-[#3D5C3A] flex items-center gap-2">
                  <Droplet className="h-5 w-5 text-sky-500 fill-sky-100" /> Registro de Hidratación
                </h4>
                <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-full border border-sky-100">
                  {waterIntake >= 8 ? "¡Meta cumplida!" : "En progreso"}
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-6">
                <div className="relative w-16 h-24 border-4 border-stone-200 bg-stone-50 rounded-b-2xl rounded-t-sm overflow-hidden flex flex-col justify-end shadow-xs flex-shrink-0">
                  <div 
                    className="bg-gradient-to-t from-sky-400 to-sky-300 w-full transition-all duration-500 relative flex items-center justify-center text-white"
                    style={{ height: `${Math.min(100, (waterIntake / 8) * 100)}%` }}
                  >
                    {waterIntake > 0 && (
                      <span className="absolute bottom-1 text-[10px] drop-shadow-xs font-mono font-bold tracking-tight">
                        {Math.round((waterIntake / 8) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-stone-600 font-bold">Consumo de hoy:</p>
                  <p className="text-xl font-black text-stone-900 font-mono">
                    {waterIntake} <span className="text-xs text-stone-500 font-bold">vasos ({waterIntake * 250} ml)</span>
                  </p>
                  <p className="text-[10px] text-stone-500 leading-relaxed font-semibold">
                    Meta clínica recomendada: 2.0 Litros (8 vasos de 250ml) al día para Mari Ricardo.
                  </p>
                </div>
              </div>

              {/* + - Buttons and Quick Add glasses list */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button 
                  onClick={() => handleModifyWater(-1)}
                  className="bg-white hover:bg-stone-50 border border-stone-250 py-1.5 rounded-xl text-xs font-bold text-stone-600 transition cursor-pointer"
                >
                  - Quitar 1 Vaso
                </button>
                <button 
                  onClick={() => handleModifyWater(1)}
                  className="bg-[#EFF4EE] hover:bg-[#E2ECD0] text-[#3D5C3A] py-1.5 rounded-xl text-xs font-extrabold border border-[#CDDCD0] transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Droplet className="h-3.5 w-3.5 text-sky-500 fill-sky-400" /> +1 Vaso
                </button>
              </div>

              {/* Circular Droplet Icons indicators click to set immediately */}
              <div className="flex justify-between items-center gap-1 py-1.5 border-t border-[#EFF4EE]">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(glass => {
                  const active = waterIntake >= glass;
                  return (
                    <button
                      key={glass}
                      onClick={() => {
                        setWaterIntake(glass);
                        localStorage.setItem('nutrisaas_water_intake', String(glass));
                      }}
                      className={`p-1 rounded-full transition-all cursor-pointer ${active ? 'bg-sky-500 text-white scale-110 shadow-3xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-400'}`}
                      title={`Registrar ${glass} vasos`}
                    >
                      <Droplet className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Habit Streak / Days Tracker Panel */}
            <div className="bg-white rounded-3xl p-6 border border-[#CDDCD0] shadow-xs space-y-4" id="habit_streak_panel">
              <h4 className="text-sm font-extrabold text-[#3D5C3A] flex items-center gap-2 border-b border-[#EFF4EE] pb-3">
                <Calendar className="h-5 w-5 text-[#5A7C56]" /> Hábitos de la Semana
              </h4>
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {[
                  { day: 'Lun', achieved: true, current: false },
                  { day: 'Mar', achieved: true, current: false },
                  { day: 'Mié', achieved: true, current: false },
                  { day: 'Jue', achieved: false, current: false },
                  { day: 'Vie', achieved: true, current: false },
                  { day: 'Sáb', achieved: false, current: false },
                  { day: 'Dom', achieved: loggedTodayCalories <= budgetCalories && loggedTodayCalories > 0, current: true }
                ].map((d, i) => (
                  <div key={i} className={`p-1.5 rounded-lg border ${d.current ? 'border-[#5A7C56] bg-[#EFF4EE]' : 'border-stone-100 bg-stone-50'}`}>
                    <span className="text-[9px] text-stone-500 font-bold block">{d.day}</span>
                    <div className="mt-1 flex justify-center">
                      <div className={`w-2 h-2 rounded-full ${d.achieved ? 'bg-emerald-500' : 'bg-stone-200'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-stone-500 font-medium leading-relaxed">
                Cada punto verde indica que se cumplió el balance saludable de energía propuesto por tu nutricionista.
              </p>
            </div>

            {/* Smart Clinical Advice Coach */}
            <div className="bg-gradient-to-br from-[#EFF4EE] to-white rounded-3xl p-6 border border-[#CDDCD0] shadow-xs space-y-4.5" id="clinical_advice_coach">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-xl border border-[#CDDCD0]">
                  <Sparkles className="h-4 w-4 text-[#5A7C56]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#3D5C3A] uppercase tracking-wider">Consejero Clínico Personalizado</h4>
                  <p className="text-[10px] text-stone-500 font-bold font-mono">Orientación terapéutica</p>
                </div>
              </div>
              
              <div className="bg-white/80 p-3.5 rounded-xl border border-[#CDDCD0]/60 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#5A7C56] rounded-full"></span>
                  <span className="text-[11px] font-extrabold text-stone-850">Consejo para esta tarde:</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed font-sans">
                  {calcForm.goal === 'lose_weight' 
                    ? "Mari, hoy tu meta es déficit controlado. Prioriza guarniciones de ensaladas verdes en lugar de carbohidratos complejos para optimizar la quema de grasas nocturna." 
                    : calcForm.goal === 'gain_muscle' 
                    ? "Para el superávit y aumento muscular magro, procura añadir ingredientes ricos en proteína, como pechuga de pollo o claras de huevo a tu colación de la tarde."
                    : "Para el mantenimiento chileno tradicional saludable, recuerda alternar el pan blanco de tu colación por cereales rústicos de avena."
                  }
                </p>
                <p className="text-[10px] text-[#5A7C56] font-semibold flex items-center gap-1 mt-1">
                  <Heart className="h-3 w-3 fill-rose-100 text-rose-500 inline" /> Valores y presión arterial en rango óptimo
                </p>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Standard Beautiful Patient-Facing Footer */}
      <footer className="bg-white border-t border-[#CDDCD0]/60 mt-16 py-12 text-stone-600" id="app_footer">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-6 border-b border-[#CDDCD0]/40">
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#3D5C3A] uppercase tracking-wider flex items-center gap-1.5">
                <Apple className="h-4 w-4" /> NutriSaaS Clínico
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Terapia nutricional respaldada por ciencia, control de presupuesto calórico con inteligencia de visión y buscador oficial de alimentos nacionales INTA.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest">Compromiso Clínico</h4>
              <p className="text-[11px] text-stone-400 leading-relaxed font-semibold">
                NutriSaaS calcula tus requerimientos diarios energéticos utilizando la fórmula científica Mifflin-St Jeor corregida bajo nivel de actividad física (PAL).
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest">Información de Salud</h4>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                IMPORTANTE: Toda sugerencia e índice calórico de esta bitácora tiene propósitos exclusivamente educacionales y de apoyo clínico. No reemplaza un diagnóstico médico o pautas de su nutricionista clínico calificado.
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between text-[11px] text-stone-400 font-medium gap-4">
            <p>© {new Date().getFullYear()} NutriSaaS Corporation SA. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <span className="hover:text-stone-600 cursor-pointer">Términos de Servicio Clínico</span>
              <span>•</span>
              <span className="hover:text-stone-600 cursor-pointer">Privacidad de Fichas Pacientes</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
