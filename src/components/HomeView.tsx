/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Droplet, 
  Flame, 
  Utensils, 
  Sparkles, 
  CheckCircle, 
  Calendar, 
  Trash2, 
  Plus, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  User,
  Scale,
  Bus,
  Shield,
  Smile,
  Info,
  Check,
  Zap,
  HelpCircle,
  Search,
  Watch,
  X,
  ChevronDown
} from 'lucide-react';
import { DailyLog } from '../types';
import { CHILEAN_LA_FOODS, searchFoods } from '../foodDatabase';

export interface HomeViewProps {
  key?: any;
  activeProfile?: any;
  activeUserId: string;
  calcForm: any;
  setCalcForm: React.Dispatch<React.SetStateAction<any>>;
  dailyLogs: DailyLog[];
  loggedTodayCalories: number;
  loggedTodayProtein: number;
  loggedTodayCarbs: number;
  loggedTodayFat: number;
  budgetCalories: number;
  budgetProtein: number;
  budgetCarbs: number;
  budgetFat: number;
  waterIntake: number;
  handleModifyWater: (amount: number) => void;
  handleDeleteDailyLog: (id: string | number) => void;
  setMobileScreen: React.Dispatch<React.SetStateAction<any>>;
  handleQuickLogFood?: (
    name: string,
    calories: number,
    protein: number,
    carbs: number,
    fat: number,
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ) => void;
}

export default function HomeView({
  activeProfile,
  activeUserId,
  calcForm,
  setCalcForm,
  dailyLogs,
  loggedTodayCalories,
  loggedTodayProtein,
  loggedTodayCarbs,
  loggedTodayFat,
  budgetCalories,
  budgetProtein,
  budgetCarbs,
  budgetFat,
  waterIntake,
  handleModifyWater,
  handleDeleteDailyLog,
  setMobileScreen,
  handleQuickLogFood
}: HomeViewProps) {
  
  // Quick calculations for metabolic expenditure
  // Mifflin-St Jeor formula baseline estimation dynamically adjusted by gender
  const bmrEstimate = Math.round(
    10 * calcForm.weight_kg +
    6.25 * calcForm.height_cm -
    5 * calcForm.age +
    (calcForm.gender === 'male' ? 5 : -161)
  );
  const activeDeviceCalories = calcForm.wearable_enabled ? calcForm.activeCaloriesToday : 0;
  
  // Total daily metabolic expenditure
  const activityCoefficients: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725
  };
  const coef = activityCoefficients[calcForm.activity_level] || 1.375;
  const tdeeEstimateWithoutBonus = Math.round(bmrEstimate * coef);
  const totalCaloriesExpended = Math.round(tdeeEstimateWithoutBonus + activeDeviceCalories);

  // Remaining calorie balance to hit target budget
  const calDifference = budgetCalories - loggedTodayCalories;

  // --- NEW INTERACTIVE STATES ---

  // Apple Watch / iPhone Health Sync States
  const [showWatchModal, setShowWatchModal] = useState(false);
  const [watchCalInput, setWatchCalInput] = useState<string>(String(calcForm.activeCaloriesToday || 0));
  const [showBmrExplanation, setShowBmrExplanation] = useState(false);

  // Easy Add Food states
  const [activeFoodTab, setActiveFoodTab] = useState<'suggested' | 'search' | 'manual'>('suggested');
  
  // Manual Add Form states
  const [manualFoodName, setManualFoodName] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualMealType, setManualMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showManualMacros, setShowManualMacros] = useState(false);

  // Search tab states
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [searchMealType, setSearchMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [searchPortionMultiplier, setSearchPortionMultiplier] = useState<number>(1.0);

  // Selected suggested food for meal selection popup/dialog
  const [selectedSuggestedFood, setSelectedSuggestedFood] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const [suggestedMealType, setSuggestedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

  // Triggered when saving the Apple Watch Active calories
  const handleSaveWatchCalories = (e: React.FormEvent) => {
    e.preventDefault();
    const kcal = Math.max(0, Math.min(3000, Number(watchCalInput) || 0));
    setCalcForm((prev: any) => {
      const next = {
        ...prev,
        wearable_enabled: true,
        activeCaloriesToday: kcal
      };
      // Save user-scoped wearable settings to localStorage
      localStorage.setItem(`nutrisaas_wearable_active_cals_${activeUserId}`, String(kcal));
      return next;
    });
    setShowWatchModal(false);
  };
  
  // 1. Fiber Intake Tracker for digestive support (Mari's girlfriend & user health focus)
  const [fiberIntake, setFiberIntake] = useState<number>(() => {
    const saved = localStorage.getItem('nutrisaas_fiber_intake');
    return saved ? Number(saved) : 10;
  });

  const handleModifyFiber = (amount: number) => {
    setFiberIntake(prev => {
      const next = Math.max(0, Math.min(60, prev + amount));
      localStorage.setItem('nutrisaas_fiber_intake', String(next));
      return next;
    });
  };

  // 2. Personalized, multi-tenant Supplements tracker based on current profile parameters
  const [userSupplements, setUserSupplements] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const defaultSupps: Record<string, boolean> = {};
    
    // Choose the best magnesium formulation based on active digestive or travel conditions
    const magnesiumName = calcForm.has_constipation_trouble 
      ? 'Citrato de Magnesio (400mg) - Tránsito Digestivo e Intestinal' 
      : (calcForm.has_long_trips ? 'Citrato de Magnesio (400mg) - Relajación Muscular para Viajes' : 'Citrato de Magnesio (300mg) - Descanso nocturno');

    defaultSupps[magnesiumName] = false;

    if (calcForm.goal === 'gain_muscle') {
      defaultSupps['Creatina Monohidratada (5g) - Fuerza y Masa Muscular'] = false;
    } else {
      defaultSupps['Creatina Monohidratada (3g) - Soporte Cognitivo y Celular'] = false;
    }

    defaultSupps['Omega 3 Alta Concentración (1g) - Cardiovascular'] = false;

    if (calcForm.has_long_trips) {
      defaultSupps['Electrolitos Hidratantes Activos - Cuidado en Trayecto'] = false;
    }

    if (calcForm.gender === 'female') {
      defaultSupps['Colágeno Hidrolizado + Biotina - Elasticidad'] = false;
    } else {
      defaultSupps['Complejo Multivitamínico Activo - Balance Diario'] = false;
    }

    // Load any previously saved state for this specific user ID
    const saved = localStorage.getItem(`nutrisaas_supps_state_${activeUserId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserSupplements({
          ...defaultSupps,
          ...parsed
        });
      } catch (e) {
        setUserSupplements(defaultSupps);
      }
    } else {
      setUserSupplements(defaultSupps);
    }
  }, [activeUserId, calcForm.has_constipation_trouble, calcForm.has_long_trips, calcForm.goal, calcForm.gender]);

  const toggleUserSupp = (key: string) => {
    setUserSupplements(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(`nutrisaas_supps_state_${activeUserId}`, JSON.stringify(next));
      return next;
    });
  };

  // 3. Smart Bus Long Trip Helper states (tied to profile and saved hours)
  const busTripMode = !!calcForm.has_long_trips;

  const [busDuration, setBusDuration] = useState<number>(() => {
    const saved = localStorage.getItem('nutrisaas_bus_duration_hours');
    return saved ? Number(saved) : 6;
  });

  // Quick logging of fiber/prebiotic foods with one click
  const logPrebioticFood = (foodName: string, cal: number, protein: number, carb: number, fat: number, fiberG: number) => {
    if (handleQuickLogFood) {
      handleQuickLogFood(`${foodName} 🌾 (+${fiberG}g fibra)`, cal, protein, carb, fat, 'snack');
      handleModifyFiber(fiberG);
    }
  };

  // Custom plan text generation based on the active medical goal
  const getPersonalizedAdvice = () => {
    if (calcForm.goal === 'lose_weight') {
      if (calDifference > 100) {
        return {
          title: "Mantener el Déficit Calórico",
          status: "En verde para reducción de peso",
          badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
          text: `Para consolidar tu ritmo de pérdida de grasa hoy, te quedan ${calDifference} kcal por consumir. Registra una colación ligera o cena equilibrada rica en agua, como ensaladas de hojas verdes con pechuga asada.`
        };
      } else if (calDifference >= -100 && calDifference <= 100) {
        return {
          title: "¡Presupuesto Perfecto!",
          status: "Balance óptimo alcanzado",
          badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-250",
          text: "Estás justo en tu meta de déficit diaria. Si tienes ganas de picar algo, prioriza infusiones de hierbas sin azúcar o vasos de agua adicionales para controlar la ansiedad."
        };
      } else {
        return {
          title: "Ajustar Próximas Comidas",
          status: "Exceso de energía detectado",
          badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
          text: `Has superado tu presupuesto objetivo por ${Math.abs(calDifference)} kcal. Para regular la meta semanal de pérdida de peso, enfócate en una caminata ligera por la noche y reduce las porciones en tu siguiente comida del día.`
        };
      }
    } else if (calcForm.goal === 'gain_muscle') {
      if (calDifference > 100) {
        return {
          title: "Consolidar el Superávit Crítico",
          status: "Falta energía para ganar músculo",
          badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
          text: `Necesitas consumir ${calDifference} kcal extra para estimular la síntesis muscular hoy. Te recomendamos agregar un licuado proteico, huevos duros o frutos secos chilenos de alta calidad.`
        };
      } else {
        return {
          title: "¡Meta de Hipertrofia Lograda!",
          status: "Síntesis de masa activa",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
          text: "Cumpliste con la ingesta calórica programada. Mantén tus entrenamientos constantes para direccionar esta energía al músculo magro."
        };
      }
    } else {
      // Maintenance
      if (calDifference > 100) {
        return {
          title: "Alcanzar Equilibrio Diario",
          status: "Déficit moderado involuntario",
          badgeColor: "bg-stone-100 text-stone-800 border-stone-200",
          text: `Te quedan ${calDifference} kcal para cubrir tu tasa de mantenimiento de hoy. Puedes planificar una once chilena tradicional y saludable para equilibrar.`
        };
      } else {
        return {
          title: "¡Energía en Equilibrio!",
          status: "Alineación óptima de mantenimiento",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
          text: "Has balanceado tu gasto con tu consumo diario con precisión. Sigue así para conservar tu peso clínico actual."
        };
      }
    }
  };

  // Dynamic physiological metabolic analysis (Apple Watch + Hydration)
  const getMetabolicAnalysis = () => {
    const activeCal = calcForm.activeCaloriesToday || 0;
    const waterCups = waterIntake || 0;
    
    let trainingLevel: 'low' | 'medium' | 'high' = 'low';
    if (activeCal > 500) trainingLevel = 'high';
    else if (activeCal >= 200) trainingLevel = 'medium';

    let hydrationLevel: 'low' | 'medium' | 'high' = 'low';
    if (waterCups >= 8) hydrationLevel = 'high';
    else if (waterCups >= 4) hydrationLevel = 'medium';

    let statusTitle = "";
    let statusDesc = "";
    let nutritionalAdvice = "";
    let healthColor = "bg-stone-50 text-stone-850 border-stone-200";

    if (trainingLevel === 'high') {
      if (hydrationLevel === 'low') {
        statusTitle = "⚠️ Alerta Metabólica: Esfuerzo Alto + Deshidratación";
        statusDesc = "Estás entrenando intensamente pero tu ingesta de agua es críticamente baja. Esto incrementa el riesgo de calambres musculares, fatiga precoz y sobrecarga renal.";
        nutritionalAdvice = "¡URGENTE! Bebe 2 vasos de agua ahora. Para tu comida post-entrenamiento, consume alimentos ricos en agua y potasio (ej. Plátano maduro o kiwi chileno) con 25g de proteína magra. Evita comidas muy saladas o pesadas.";
        healthColor = "bg-rose-50 text-rose-950 border-rose-250";
      } else if (hydrationLevel === 'medium') {
        statusTitle = "🏃 Entrenamiento Exigente: Hidratación Aceptable";
        statusDesc = "Tu gasto calórico activo es alto. Vas por buen camino con la hidratación, pero necesitas más volumen para recuperar fluidos perdidos.";
        nutritionalAdvice = "Agrega 1 o 2 vasos de agua en la próxima hora. Come carbohidratos de absorción moderada/rápida (ej. Arroz blanco o avena instantánea) y 30g de proteína (pechuga de pollo o huevos) para rellenar el glucógeno y reparar fibras.";
        healthColor = "bg-amber-50 text-amber-950 border-amber-250";
      } else {
        statusTitle = "🌟 Ventana Anabólica Óptima: Rendimiento y Recuperación al Máximo";
        statusDesc = "¡Excelente combinación! Has entrenado duro y mantienes tus células perfectamente hidratadas. La síntesis de proteína y la quema de grasa son altamente eficientes.";
        nutritionalAdvice = "Consume una porción completa de carbohidratos complejos (arroz o avena) + proteína de alta calidad + grasas saludables (palta chilena) para consolidar tu recuperación celular.";
        healthColor = "bg-emerald-50 text-emerald-950 border-emerald-250";
      }
    } else if (trainingLevel === 'medium') {
      if (hydrationLevel === 'low') {
        statusTitle = "💧 Hidratación Insuficiente para Actividad Moderada";
        statusDesc = "Has realizado un gasto de actividad física medio, pero la falta de agua está reduciendo tu tasa metabólica basal y afectando tu concentración.";
        nutritionalAdvice = "Bebe 1 vaso de agua inmediatamente. Elige snacks saludables de bajo residuo como un puñado de almendras naturales y una fruta acuosa (manzana).";
        healthColor = "bg-rose-50 text-rose-950 border-rose-250";
      } else if (hydrationLevel === 'medium') {
        statusTitle = "🟢 Balance Estable: Gasto Moderado e Hidratación Regular";
        statusDesc = "Te mantienes en una zona segura de balance energético y metabólico de nivel intermedio.";
        nutritionalAdvice = "Mantén la ingesta regular de líquidos. Si tu meta es perder peso, una once ligera chilena (medio pan marraqueta con huevo o palta) cubrirá tus macros perfectamente.";
        healthColor = "bg-emerald-50 text-emerald-950 border-emerald-205";
      } else {
        statusTitle = "💧 Superávit de Hidratación: Recuperación Confortable";
        statusDesc = "Excelente hidratación celular para el nivel de ejercicio moderado realizado hoy. Tu cuerpo elimina toxinas eficazmente.";
        nutritionalAdvice = "Mantén el ritmo. No necesitas excesos de comida rápida. Un plato de porotos con riendas o una empanada de pino casera moderada encajará bien si estás en mantenimiento.";
        healthColor = "bg-sky-50 text-sky-950 border-sky-205";
      }
    } else {
      // low training
      if (hydrationLevel === 'low') {
        statusTitle = "⚠️ Sedentarismo con Deshidratación";
        statusDesc = "Hoy has tenido muy poco movimiento y no estás consumiendo suficiente agua. Tu digestión y metabolismo se ralentizarán notablemente.";
        nutritionalAdvice = "Toma agua tibia para estimular el tránsito intestinal. Agrega alimentos prebióticos altos en fibra (como ciruelas pasas o avena con linaza) en tu próxima colación para apoyar tu digestión.";
        healthColor = "bg-amber-50 text-amber-950 border-amber-205";
      } else {
        statusTitle = "🧘 Día de Recuperación / Descanso Activo";
        statusDesc = "Hoy tu gasto por entrenamiento es bajo y tu nivel de hidratación es óptimo. Es un día ideal para depurar el organismo y desinflamar fibras musculares.";
        nutritionalAdvice = "Reduce la porción de carbohidratos de hoy para evitar acumular grasa. Prioriza ensaladas de hojas verdes con aceite de oliva, proteínas magras y tu suplementación de Magnesio nocturna.";
        healthColor = "bg-stone-50 text-stone-900 border-stone-200";
      }
    }

    return { statusTitle, statusDesc, nutritionalAdvice, healthColor };
  };

  const advice = getPersonalizedAdvice();

   const activeUserName = activeProfile ? activeProfile.first_name : "Ricardo";
   const userSuppsList = Object.keys(userSupplements);
   const isUserSuppsComplete = userSuppsList.length > 0 && Object.values(userSupplements).every(val => val);
 
   return (
     <div className="space-y-6 animate-fade-in" id="home_dashboard">
       
       {/* 1. SECCIÓN DÓNDE DICE "¿CÓMO VA MI DÍA?" (Centrallized progress dashboard) */}
       <div className="bg-white rounded-3xl border border-[#CDDCD0] p-6 sm:p-8 space-y-6" id="comova_mi_dia_header">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
             <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
               <Sparkles className="h-5 w-5 text-[#5A7C56] fill-stone-100" />
               ¿Cómo va mi día hoy, {activeUserName}?
             </h2>
             <p className="text-xs text-stone-500 font-semibold mt-0.5">
               Control integrado de nutrición en tiempo real para {activeProfile ? `${activeProfile.first_name} ${activeProfile.last_name}` : "Ricardo Mari"}
             </p>
           </div>
          <div className="flex gap-2.5 bg-stone-50 p-1.5 px-3 rounded-2xl border border-stone-150 text-[11px] font-bold text-stone-700">
            <span className="flex items-center gap-1">
              <Scale className="h-3.5 w-3.5 text-[#5A7C56]" /> {calcForm.weight_kg} kg
            </span>
            <span className="text-stone-300">|</span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-[#5A7C56]" /> Meta: {calcForm.goal === 'lose_weight' ? 'Déficit (Pérdida)' : calcForm.goal === 'gain_muscle' ? 'Superávit (Músculo)' : 'Mantenimiento'}
            </span>
          </div>
        </div>

        {/* Triple Columns: Comido, Gastado, Hidratación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* A. Cuánto he comido (Ingesta calórica) */}
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4.5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-600 flex items-center gap-1.5 uppercase tracking-wider">
                <Utensils className="h-4 w-4 text-[#5A7C56]" /> He Comido
              </span>
              <span className="text-[10px] bg-white text-[#3D5C3A] font-bold px-2 py-0.5 rounded-full border border-[#CDDCD0]">
                Presupuesto
              </span>
            </div>
            <div>
              <p className="text-3xl font-black text-stone-900 font-mono">
                {loggedTodayCalories} <span className="text-sm font-bold text-stone-500">kcal</span>
              </p>
              <p className="text-[10px] text-stone-500 font-bold mt-1 leading-relaxed">
                De tu meta de <span className="text-stone-700 font-extrabold">{budgetCalories} kcal</span> diarias
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#5A7C56] h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (loggedTodayCalories / budgetCalories) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* B. Cuánto he gastado (Gasto metabólico estimado) */}
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4.5 flex flex-col justify-between space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-600 flex items-center gap-1.5 uppercase tracking-wider">
                <Flame className="h-4 w-4 text-amber-600" /> He Gastado
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowBmrExplanation(prev => !prev)}
                  className="text-stone-400 hover:text-[#5A7C56] transition cursor-pointer p-0.5"
                  title="Ver desglose del cálculo calórico"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
                {calcForm.wearable_enabled && (
                  <span className="text-[9px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-205">
                    Watch Activo
                  </span>
                )}
              </div>
            </div>
            
            {showBmrExplanation ? (
              <div className="text-[9px] bg-white border border-stone-150 p-2.5 rounded-xl text-stone-605 leading-normal space-y-1">
                <div className="flex justify-between items-center border-b border-stone-100 pb-1">
                  <span className="font-extrabold text-stone-850">Fórmula Mifflin-St Jeor</span>
                  <button onClick={() => setShowBmrExplanation(false)} className="text-[8px] text-stone-400 font-bold hover:underline">cerrar</button>
                </div>
                <div><strong>Basal (BMR):</strong> 10xPeso + 6.25xAltura - 5xEdad {calcForm.gender === 'male' ? '+ 5' : '- 161'} = <strong className="text-stone-850">{bmrEstimate} kcal</strong></div>
                <div><strong>Activo Diario:</strong> BMR x {coef} ({calcForm.activity_level === 'sedentary' ? 'Sedentario' : calcForm.activity_level === 'lightly_active' ? 'Ligero' : 'Moderado'}) = <strong className="text-stone-850">{tdeeEstimateWithoutBonus} kcal</strong></div>
                {calcForm.wearable_enabled && <div><strong>Apple Watch:</strong> +{activeDeviceCalories} kcal</div>}
                <div className="border-t border-stone-100 pt-1 font-black text-stone-850 text-right">Gasto Total: {totalCaloriesExpended} kcal</div>
              </div>
            ) : (
              <div>
                <p className="text-3xl font-black text-stone-900 font-mono">
                  {totalCaloriesExpended} <span className="text-sm font-bold text-stone-500">kcal</span>
                </p>
                <p className="text-[10px] text-stone-500 font-bold mt-1 leading-relaxed">
                  Tasa basal ({bmrEstimate} kcal) + {activeDeviceCalories} {calcForm.deviceName}
                </p>
              </div>
            )}

            <div className="space-y-1.5 mt-1">
              <div className="text-[9px] text-stone-550 font-bold bg-white px-2 py-1 rounded-lg border border-stone-150 flex items-center justify-between">
                <span>Nivel actividad:</span>
                <span className="font-black text-[#5A7C56]">
                  {calcForm.activity_level === 'sedentary' ? 'Sedentario' : calcForm.activity_level === 'lightly_active' ? 'Ligero' : 'Moderado'}
                </span>
              </div>
              
              <button 
                onClick={() => {
                  setWatchCalInput(String(calcForm.activeCaloriesToday || 0));
                  setShowWatchModal(true);
                }}
                className="w-full py-1.5 bg-white hover:bg-stone-50 border border-stone-250 hover:border-[#5A7C56] text-[#3D5C3A] font-extrabold rounded-xl text-[10px] transition flex items-center justify-center gap-1 cursor-pointer shadow-3xs"
              >
                <span className="text-stone-900 font-extrabold"></span> Sincronizar Apple Watch
              </button>
            </div>
          </div>

          {/* C. Cuánta agua llevo (Registro de Hidratación interactivo en dashboard) */}
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4.5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-600 flex items-center gap-1.5 uppercase tracking-wider">
                <Droplet className="h-4 w-4 text-sky-500 fill-sky-100" /> Agua Bebida
              </span>
              <span className="text-[10px] bg-white text-sky-700 font-extrabold px-1.5 py-0.5 rounded-full border border-sky-100">
                {waterIntake >= 8 ? "¡Meta!" : `${waterIntake}/8`}
              </span>
            </div>
            <div>
              <p className="text-2xl font-black text-stone-900 font-mono">
                {waterIntake * 250} <span className="text-xs font-extrabold text-stone-500">ml</span>
              </p>
              <p className="text-[10px] text-stone-400 font-semibold">
                Vasos registrados: <strong className="text-stone-700">{waterIntake}</strong> de 8 recomendados
              </p>
            </div>
            
            {/* Quick interactive buttons inside dashboard */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handleModifyWater(-1)}
                className="bg-white hover:bg-stone-100 border border-stone-250 w-8 h-7 rounded-lg text-xs font-bold text-stone-600 transition flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <button 
                onClick={() => handleModifyWater(1)}
                className="flex-1 bg-[#EFF4EE] hover:bg-[#E2ECD0] border border-[#CDDCD0] text-[#3D5C3A] h-7 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3 text-sky-500" /> vaso
              </button>
            </div>
          </div>

        </div>

        {/* Dynamic precision physiological advice engine */}
        {(() => {
          const analysis = getMetabolicAnalysis();
          return (
            <div className={`rounded-2xl border-2 border-dashed p-4 text-left ${analysis.healthColor} shadow-3xs space-y-2`} id="precision_metabolic_coaching">
              <div className="flex items-center gap-2 border-b border-stone-200/50 pb-2">
                <div className="p-1.5 bg-white rounded-lg border border-stone-200">
                  <Activity className="h-4 w-4 text-[#5A7C56]" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Recomendador Metabólico de Precisión (Watch + Hidratación)
                </h4>
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-black flex items-center gap-1">{analysis.statusTitle}</h5>
                <p className="text-[11px] leading-relaxed font-semibold opacity-90">{analysis.statusDesc}</p>
                <div className="bg-white/95 p-3 rounded-xl border border-stone-200/40 text-[11px] leading-relaxed mt-2 text-stone-850">
                  <span className="font-extrabold block text-[#3D5C3A] mb-0.5">💡 Recomendación para comer y entrenar hoy:</span>
                  {analysis.nutritionalAdvice}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Original plan advice fallback widget */}
        <div className="border-t border-stone-150 pt-4 text-left">
          <div className="bg-gradient-to-br from-[#EFF4EE]/45 to-white rounded-2xl border border-[#CDDCD0]/60 p-4 space-y-3" id="personalized_goal_match">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-xs font-black text-[#3D5C3A] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#5A7C56]" /> 
                Objetivo Semanal
              </h4>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${advice.badgeColor}`}>
                {advice.status}
              </span>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-stone-850 flex items-center gap-1.5">
                {calcForm.goal === 'lose_weight' ? <TrendingDown className="h-3.5 w-3.5 text-[#5A7C56]" /> : <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
                Meta de Caloric Target: {advice.title}
              </p>
              <p className="text-[11px] text-stone-600 leading-relaxed font-semibold">
                {advice.text}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* --- Apple Watch Sync Modal Overlay --- */}
      {showWatchModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-[#CDDCD0] shadow-2xl p-6 sm:p-8 max-w-lg w-full relative space-y-6">
            <button 
              onClick={() => setShowWatchModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 hover:bg-stone-100 rounded-full transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="space-y-2 text-center sm:text-left">
              <div className="inline-flex p-3 bg-[#EFF4EE] rounded-2xl text-[#3D5C3A]">
                <Watch className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-stone-900 tracking-tight">
                 Sincronización Real con Apple Watch & Health
              </h3>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">
                Las aplicaciones web en iOS no pueden acceder de fondo a tu base de datos privada de HealthKit. 
                Puedes registrar tu actividad física de dos maneras sencillas:
              </p>
            </div>

            {/* Option 1: Manual Input / Sync */}
            <form onSubmit={handleSaveWatchCalories} className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4.5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[#3D5C3A] uppercase tracking-wider block">
                  Calorías Activas de Hoy (Apple Watch):
                </label>
                <p className="text-[10px] text-stone-400 font-semibold leading-tight">
                  Ingresa las "Calorías Activas" registradas hoy en los anillos de tu reloj o en la app Salud de tu iPhone.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  value={watchCalInput}
                  onChange={(e) => setWatchCalInput(e.target.value)}
                  className="w-24 px-3 py-2 bg-white border border-stone-250 rounded-xl text-sm font-mono font-black text-stone-900 text-center focus:outline-hidden focus:border-[#5A7C56]"
                  placeholder="e.g. 500"
                  min="0"
                  max="3000"
                  required
                />
                <span className="text-xs font-bold text-stone-500">kcal</span>

                <input 
                  type="range"
                  min="0"
                  max="1500"
                  step="20"
                  value={Number(watchCalInput) || 0}
                  onChange={(e) => setWatchCalInput(e.target.value)}
                  className="flex-1 accent-[#5A7C56] h-1.5 bg-stone-250 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#5A7C56] hover:bg-[#3D5C3A] text-white font-black py-2.5 rounded-xl text-xs transition shadow-3xs cursor-pointer"
              >
                Guardar Sincronización
              </button>
            </form>

            {/* Option 2: Automated Shortcut Guide */}
            <div className="border border-stone-150 rounded-2xl p-4.5 space-y-3">
              <h4 className="text-xs font-black text-stone-850 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" /> Sincronización Automática con iOS Shortcuts
              </h4>
              <p className="text-[10px] text-stone-500 font-medium leading-relaxed">
                Puedes configurar un atajo en tu iPhone para que tu Apple Watch actualice esta página con un solo toque:
              </p>
              <ol className="list-decimal list-inside text-[10px] text-stone-600 font-semibold space-y-1.5 pl-1 leading-normal">
                <li>Abre la app **Atajos (Shortcuts)** integrada en tu iPhone.</li>
                <li>Crea un atajo nuevo llamado **"Sincronizar NutriSaaS"**.</li>
                <li>Agrega la acción **"Buscar muestras de Salud"** (Filtrar por Energía Activa, fecha de inicio es Hoy).</li>
                <li>Agrega la acción **"Obtener URL"** con: <code className="bg-stone-105 px-1 py-0.5 rounded text-stone-800 font-mono text-[9px] break-all select-all select-text">http://localhost:3000?active_cals=[Valor de Salud]</code></li>
                <li>Agrega la acción **"Abrir URL"** (Selecciona Safari u otro navegador).</li>
              </ol>
              <p className="text-[9px] text-[#3D5C3A] font-black">
                💡 Al presionar el atajo, el iPhone leerá tu reloj e inyectará de inmediato tus calorías activas en NutriSaaS.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- QUICK FOOD ADD PANEL --- */}
      <div className="bg-white rounded-3xl border border-[#CDDCD0] p-6 sm:p-8 space-y-6" id="quick_food_adder_card">
        <div className="flex items-center gap-2.5 border-b border-[#EFF4EE] pb-3">
          <div className="p-2 bg-gradient-to-br from-[#5A7C56] to-[#3D5C3A] rounded-2xl text-white shadow-xs">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-stone-900">Registrar Alimentos Hoy</h3>
            <p className="text-[10px] text-stone-400 font-bold">Agrega tus comidas de forma rápida y sencilla</p>
          </div>
        </div>

        {/* Tab Selectors */}
        <div className="flex gap-2 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-bold text-stone-600">
          <button 
            onClick={() => setActiveFoodTab('suggested')}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${activeFoodTab === 'suggested' ? 'bg-white text-stone-900 shadow-3xs font-black' : 'hover:bg-stone-50'}`}
          >
            ⭐ Favoritos Chilenos
          </button>
          <button 
            onClick={() => setActiveFoodTab('search')}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${activeFoodTab === 'search' ? 'bg-white text-stone-900 shadow-3xs font-black' : 'hover:bg-stone-50'}`}
          >
            🔍 Buscar
          </button>
          <button 
            onClick={() => setActiveFoodTab('manual')}
            className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer ${activeFoodTab === 'manual' ? 'bg-white text-stone-900 shadow-3xs font-black' : 'hover:bg-stone-50'}`}
          >
            ✍️ Manual Rápido
          </button>
        </div>

        {/* Tab Content 1: Suggested / Favorites */}
        {activeFoodTab === 'suggested' && (
          <div className="space-y-4">
            <p className="text-[10px] text-stone-500 font-bold">Haz clic en cualquier alimento para agregarlo en un segundo:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "Marraqueta (Pan Batido)", cal: 270, prot: 8.5, carb: 56, fat: 1, label: "🥖 100g Marraqueta" },
                { name: "Palta Hass Chilena", cal: 160, prot: 2, carb: 9, fat: 15, label: "🥑 100g Palta" },
                { name: "Huevo Cocido Entero", cal: 78, prot: 6.5, carb: 0.6, fat: 5.5, label: "🥚 1 Huevo Cocido" },
                { name: "Pechuga de Pollo", cal: 248, prot: 46.5, carb: 0, fat: 5.4, label: "🐔 150g Pechuga Pollo" },
                { name: "Arroz Blanco Cocido", cal: 195, prot: 4, carb: 42, fat: 0.5, label: "🍚 150g Arroz Blanco" },
                { name: "Plátano Maduro", cal: 107, prot: 1.3, carb: 27.6, fat: 0.4, label: "🍌 1 Plátano Mediano" },
                { name: "Leche Semidescremada", cal: 90, prot: 6.4, carb: 9.6, fat: 3, label: "🥛 1 Vaso Leche (200ml)" },
                { name: "Manzana Chilena", cal: 78, prot: 0.4, carb: 21, fat: 0.3, label: "🍎 1 Manzana Mediana" }
              ].map(f => (
                <button
                  key={f.name}
                  onClick={() => {
                    const hr = new Date().getHours();
                    let guessedType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack';
                    if (hr < 11) guessedType = 'breakfast';
                    else if (hr >= 11 && hr < 16) guessedType = 'lunch';
                    else if (hr >= 19 && hr < 23) guessedType = 'dinner';
                    
                    setSelectedSuggestedFood(f);
                    setSuggestedMealType(guessedType);
                  }}
                  className="p-3 bg-[#FAF8F5] hover:bg-[#EFF4EE] border border-stone-200 hover:border-[#CDDCD0] rounded-2xl text-left transition flex flex-col justify-between h-20 cursor-pointer shadow-3xs"
                >
                  <span className="text-[11px] font-black text-stone-850 line-clamp-2 leading-tight">{f.label}</span>
                  <span className="text-[10px] text-stone-500 font-mono font-bold mt-1">{f.cal} kcal</span>
                </button>
              ))}
            </div>

            {/* Food suggested meal selector inline popup */}
            {selectedSuggestedFood && (
              <div className="bg-stone-50 border border-[#CDDCD0] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                <div className="text-xs text-stone-700">
                  ¿Registrar <strong className="text-stone-900">{selectedSuggestedFood.name}</strong> ({selectedSuggestedFood.cal} kcal) como qué comida del día?
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { type: 'breakfast', label: '🌅 Desayuno' },
                    { type: 'lunch', label: '☀️ Almuerzo' },
                    { type: 'dinner', label: '🌙 Cena' },
                    { type: 'snack', label: '🍎 Colación' }
                  ].map(m => (
                    <button
                      key={m.type}
                      onClick={() => {
                        if (handleQuickLogFood) {
                          handleQuickLogFood(
                            selectedSuggestedFood.name,
                            selectedSuggestedFood.cal,
                            selectedSuggestedFood.prot,
                            selectedSuggestedFood.carb,
                            selectedSuggestedFood.fat,
                            m.type as any
                          );
                        }
                        setSelectedSuggestedFood(null);
                      }}
                      className={`px-3 py-1.5 border rounded-xl text-xs font-bold transition cursor-pointer ${
                        suggestedMealType === m.type 
                          ? 'bg-[#5A7C56] border-[#3D5C3A] text-white' 
                          : 'bg-white border-stone-250 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                  <button 
                    onClick={() => setSelectedSuggestedFood(null)} 
                    className="px-3 py-1.5 text-xs font-black text-rose-600 hover:underline cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Search */}
        {activeFoodTab === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Ej: Palta, Marraqueta, Pollo..."
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-250 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-hidden focus:border-[#5A7C56] transition"
              />
            </div>

            {foodSearchQuery.trim() ? (
              <div className="space-y-3">
                <p className="text-[10px] text-stone-500 font-bold">Resultados en la Base de Datos Chilena:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(() => {
                    const results = searchFoods(foodSearchQuery);
                    if (results.length === 0) {
                      return <p className="text-xs text-stone-400 font-semibold italic">No se encontraron alimentos. Intenta con palabras clave como 'Palta', 'Pan', 'Huevo'.</p>;
                    }
                    return results.map(f => (
                      <div key={f.id} className="p-3 bg-[#FAF8F5] border border-stone-200 rounded-xl flex items-center justify-between gap-4">
                        <div className="text-xs flex-1 min-w-0">
                          <strong className="text-stone-850 block truncate">{f.name}</strong>
                          <span className="text-[10px] text-stone-500 font-bold block">{f.brand || 'INTA Chile'} • 100g</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold">
                          <div className="text-right">
                             <span className="font-black font-mono text-stone-900">{f.calories_100g}</span>
                             <span className="text-[9px] text-stone-400 block font-bold">kcal</span>
                          </div>
                          
                          {/* Portion multiplier and meal type */}
                          <div className="flex items-center gap-1.5">
                            <select
                              value={searchMealType}
                              onChange={(e) => setSearchMealType(e.target.value as any)}
                              className="bg-white border border-stone-250 rounded-lg text-[10px] font-black text-stone-700 px-1 py-0.5 focus:outline-hidden"
                            >
                              <option value="breakfast">🌅 Desayuno</option>
                              <option value="lunch">☀️ Almuerzo</option>
                              <option value="dinner">🌙 Cena</option>
                              <option value="snack">🍎 Colación</option>
                            </select>
                            
                            <button
                              onClick={() => {
                                if (handleQuickLogFood) {
                                  handleQuickLogFood(
                                    f.name,
                                    Math.round(f.calories_100g * searchPortionMultiplier),
                                    Math.round(f.protein_100g * searchPortionMultiplier),
                                    Math.round(f.carbs_100g * searchPortionMultiplier),
                                    Math.round(f.fat_100g * searchPortionMultiplier),
                                    searchMealType
                                  );
                                }
                                setFoodSearchQuery('');
                              }}
                              className="bg-[#5A7C56] hover:bg-[#3D5C3A] text-white text-[10px] font-black px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-0.5"
                            >
                              <Plus className="h-3 w-3" /> Registrar
                            </button>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-stone-200/80 rounded-2xl text-xs text-stone-400 italic font-semibold leading-relaxed">
                Escribe arriba para buscar ingredientes chilenos con macros y calorías clínicamente validados.
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Manual Add */}
        {activeFoodTab === 'manual' && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!manualFoodName.trim() || !manualCalories.trim()) return;
              if (handleQuickLogFood) {
                handleQuickLogFood(
                  manualFoodName.trim(),
                  Number(manualCalories) || 0,
                  Number(manualProtein) || 0,
                  Number(manualCarbs) || 0,
                  Number(manualFat) || 0,
                  manualMealType
                );
              }
              // Reset form
              setManualFoodName('');
              setManualCalories('');
              setManualProtein('');
              setManualCarbs('');
              setManualFat('');
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Nombre del alimento:</label>
                <input
                  type="text"
                  value={manualFoodName}
                  onChange={(e) => setManualFoodName(e.target.value)}
                  placeholder="Ej: Plato de Lasaña, Sándwich con queso..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-250 rounded-xl font-bold text-stone-900 focus:bg-white focus:outline-hidden focus:border-[#5A7C56] transition"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block text-center">Calorías (kcal):</label>
                <input
                  type="number"
                  value={manualCalories}
                  onChange={(e) => setManualCalories(e.target.value)}
                  placeholder="Ej: 350"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-250 rounded-xl font-mono font-bold text-stone-900 focus:bg-white focus:outline-hidden focus:border-[#5A7C56] transition text-center"
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Macros inputs hidden toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowManualMacros(prev => !prev)}
                className="text-[10px] text-[#5A7C56] hover:text-[#3D5C3A] font-extrabold flex items-center gap-1 cursor-pointer"
              >
                <span>{showManualMacros ? '▼ Ocultar' : '▶ Añadir'} Macronutrientes (Proteínas, Carbohidratos, Grasas)</span>
              </button>
            </div>

            {showManualMacros && (
              <div className="grid grid-cols-3 gap-3 text-xs animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest block text-center">Proteínas (g):</label>
                  <input
                    type="number"
                    value={manualProtein}
                    onChange={(e) => setManualProtein(e.target.value)}
                    placeholder="g"
                    className="w-full px-2 py-2 bg-stone-50 border border-stone-250 rounded-xl font-mono text-stone-900 text-center"
                    min="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest block text-center">Carb (g):</label>
                  <input
                    type="number"
                    value={manualCarbs}
                    onChange={(e) => setManualCarbs(e.target.value)}
                    placeholder="g"
                    className="w-full px-2 py-2 bg-stone-50 border border-stone-250 rounded-xl font-mono text-stone-900 text-center"
                    min="0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest block text-center">Grasas (g):</label>
                  <input
                    type="number"
                    value={manualFat}
                    onChange={(e) => setManualFat(e.target.value)}
                    placeholder="g"
                    className="w-full px-2 py-2 bg-stone-50 border border-stone-250 rounded-xl font-mono text-stone-900 text-center"
                    min="0"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                <span>Tipo de Comida:</span>
                <div className="flex gap-1.5">
                  {[
                    { type: 'breakfast', label: '🌅 Desayuno' },
                    { type: 'lunch', label: '☀️ Almuerzo' },
                    { type: 'dinner', label: '🌙 Cena' },
                    { type: 'snack', label: '🍎 Colación' }
                  ].map(m => (
                    <button
                      key={m.type}
                      type="button"
                      onClick={() => setManualMealType(m.type as any)}
                      className={`px-2.5 py-1 border rounded-lg text-[10px] transition cursor-pointer ${
                        manualMealType === m.type 
                          ? 'bg-[#5A7C56] border-[#3D5C3A] text-white font-extrabold' 
                          : 'bg-white border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {m.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="bg-[#5A7C56] hover:bg-[#3D5C3A] text-white font-black px-5 py-2.5 rounded-xl text-xs transition shadow-3xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Registrar Comida
              </button>
            </div>
          </form>
        )}
      </div>

      {/* fallback actions */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button 
          onClick={() => setMobileScreen('scanner')}
          className="bg-[#5A7C56] hover:bg-[#3D5C3A] text-white font-black px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-3xs hover:shadow-2xs"
        >
          Escanear Plato con IA <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button 
          onClick={() => setMobileScreen('db_explorer')}
          className="bg-white hover:bg-stone-55 text-stone-650 border border-stone-250 font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-3xs"
        >
          Buscar Alimento Técnico
        </button>
      </div>

      {/* --- NEW SECTION: BENTO BOX LIFESTYLE INTEGRATION (Fiber, Bus Trips, Supplements) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="bento_clinical_modules">
        
        {/* MODULE 1: DIGESTIÓN FELIZ & REGISTRO DE FIBRA (Shown conditional on user-specific profile setting) */}
        {calcForm.has_constipation_trouble && (
          <div className="bg-white rounded-3xl p-6 border border-[#CDDCD0] shadow-xs flex flex-col justify-between space-y-4" id="digestion_fiber_module">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#EFF4EE] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-150">
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-emerald-950">Módulo Digestión Feliz</h3>
                  <p className="text-[10px] text-stone-500 font-bold">Salud intestinal y prevención del estreñimiento</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full border border-emerald-205">
                Novia / Salud
              </span>
            </div>

            {/* Fiber progress bar & count */}
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-stone-700">Mi Fibra Diaria de Hoy:</span>
                <span className="font-black font-mono text-emerald-800">
                  {fiberIntake}g <span className="text-[10px] text-stone-500">/ 25g meta</span>
                </span>
              </div>
              
              <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (fiberIntake / 25) * 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center gap-2 pt-1">
                <button 
                  onClick={() => handleModifyFiber(-2)}
                  className="bg-white hover:bg-stone-105 border border-stone-250 text-stone-600 text-[11px] font-bold px-2 py-1 rounded-lg transition overflow-hidden truncate cursor-pointer"
                >
                  -2g Fibra
                </button>
                <button 
                  onClick={() => handleModifyFiber(2)}
                  className="bg-white hover:bg-stone-105 border border-stone-250 text-stone-700 text-[11px] font-black px-2 py-1 rounded-lg transition overflow-hidden truncate cursor-pointer"
                >
                  +2g Fibra
                </button>
                <button 
                  onClick={() => {
                    setFiberIntake(25);
                    localStorage.setItem('nutrisaas_fiber_intake', '25');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-2 py-1 rounded-lg transition cursor-pointer"
                >
                  Marcar Meta {">"}
                </button>
              </div>
            </div>

            {/* Quick action prebiotic foods addition */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Añadir Alimento Rico en Fibra Activa:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => logPrebioticFood("Ciruelas Pasas Hidratadas (6 unidades)", 125, 1, 31, 0.2, 6)}
                  className="p-2.5 bg-[#FAF8F5] hover:bg-emerald-50/70 border border-stone-200 hover:border-emerald-200 rounded-xl text-left transition flex items-start gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="leading-tight">
                    <span className="font-extrabold text-stone-800 block">Ciruelas Pasas</span>
                    <span className="text-[10px] text-[#3D5C3A] font-bold">+6g Fibra • 125 kcal</span>
                  </div>
                </button>

                <button
                  onClick={() => logPrebioticFood("Pudding de Chía con Kiwi chileno", 145, 3.5, 18, 5, 8)}
                  className="p-2.5 bg-[#FAF8F5] hover:bg-emerald-50/70 border border-stone-200 hover:border-emerald-200 rounded-xl text-left transition flex items-start gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="leading-tight">
                    <span className="font-extrabold text-stone-800 block">Chía & Kiwi Pudding</span>
                    <span className="text-[10px] text-[#3D5C3A] font-bold">+8g Fibra • 145 kcal</span>
                  </div>
                </button>
                
                <button
                  onClick={() => logPrebioticFood("Porción de Avena Silvestre con Linaza", 160, 5.5, 26, 3, 5)}
                  className="p-2.5 bg-[#FAF8F5] hover:bg-emerald-50/70 border border-stone-200 hover:border-emerald-200 rounded-xl text-left transition flex items-start gap-1.5 cursor-pointer col-span-1 sm:col-span-2"
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="leading-tight">
                    <span className="font-extrabold text-stone-800 block">Avena con Linaza Molida</span>
                    <span className="text-[10px] text-[#3D5C3A] font-bold">+5g Fibra Prebiótica • 160 kcal</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 text-emerald-950 p-3 rounded-xl text-[11px] leading-relaxed border border-emerald-100 flex items-start gap-2 pt-3">
            <Info className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">Recomendación Médica de Digestión:</span>
              La fibra soluble actúa como prebiótico. Para activar el tránsito, acompáñala siempre de 1 vaso de agua tibia y asegúrate de tomar el <strong className="text-emerald-900">Citrato de Magnesio</strong> en la once o cena (ver panel de suplementos).
            </div>
          </div>
          </div>
        )}

        {/* MODULE 2: VIAJES LARGOS EN BUS (Shown conditional on user-specific profile setting) */}
        {calcForm.has_long_trips && (
          <div className="bg-white rounded-3xl p-6 border border-[#CDDCD0] shadow-xs flex flex-col justify-between space-y-4" id="bus_travel_module">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#EFF4EE] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-150">
                    <Bus className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-indigo-950">Nutrición de Ruta Activa</h3>
                    <p className="text-[10px] text-stone-500 font-bold">Viajes largos en bus sin pesadez ni malestar</p>
                  </div>
                </div>
                
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-black px-2.5 py-1 rounded-full border border-indigo-250 animate-pulse">
                  ● Viaje Activo
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-stone-700">Duración estimada del trayecto:</span>
                    <select 
                      value={busDuration} 
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setBusDuration(v);
                        localStorage.setItem('nutrisaas_bus_duration_hours', String(v));
                      }}
                      className="bg-white border border-stone-200 rounded-lg text-xs font-black text-indigo-955 px-2 py-0.5 focus:outline-hidden"
                    >
                      <option value="4">4 Horas (Corto)</option>
                      <option value="6">6 Horas (Mediano)</option>
                      <option value="8">8 Horas (Largo)</option>
                      <option value="12">12 Horas (Extremo)</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-stone-500 font-semibold leading-relaxed">
                    {busDuration >= 8 
                      ? "Viaje extenso: Evita grasas trans y condimentos. El movimiento limitado en el bus ralentiza tu metabolismo, necesitas comidas secas fáciles de asimilar." 
                      : "Viaje moderado: Consume alimentos de bajo residuo y mantén hidratación reducida a pequeños sorbos frecuentes."}
                  </p>
                </div>

                {/* Travel safe foods list quick logging */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-black text-stone-500 uppercase tracking-wider flex items-center gap-1 text-indigo-950">
                    <Zap className="h-3 w-3 text-amber-500" /> Registrar Snacks Seguros de Viaje:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => logPrebioticFood("Puñado Almendras natural (bajo sodio)", 160, 6, 6, 14, 3)}
                      className="p-2.5 bg-[#FAF8F5] hover:bg-indigo-50/40 border border-stone-200 hover:border-indigo-200 rounded-xl text-left transition flex items-start gap-1.5 cursor-pointer text-stone-800"
                    >
                      <Plus className="h-3.5 w-3.5 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="leading-tight">
                        <span className="font-extrabold text-stone-850 block">Almendras Naturales</span>
                        <span className="text-[10px] text-indigo-700 font-bold">160 kcal • No hinchan</span>
                      </div>
                    </button>

                    <button
                      onClick={() => logPrebioticFood("Plátano Maduro Mediano (Potasio activo)", 105, 1.2, 27, 0.3, 3)}
                      className="p-2.5 bg-[#FAF8F5] hover:bg-indigo-50/40 border border-stone-200 hover:border-indigo-200 rounded-xl text-left transition flex items-start gap-1.5 cursor-pointer text-[#3D5C3A] font-bold"
                    >
                      <Plus className="h-3.5 w-3.5 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div className="leading-tight">
                        <span className="font-extrabold text-stone-850 block">Plátano de Ruta</span>
                        <span className="text-[10px] text-indigo-700 font-bold">105 kcal • Evita calambres</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Important trip rules checklists */}
                <div className="text-[10px] text-stone-600 bg-amber-50/50 border border-amber-200/50 rounded-xl p-2.5 space-y-1">
                  <span className="font-black text-amber-900 block flex items-center gap-1">
                    ⚠️ Reglas de Oro del Pasajero:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 leading-relaxed font-semibold">
                    <li><strong>Cero Legumbres/Brócoli/Gaseosas</strong> 8h antes de subir (previenen meteorismo en ruta).</li>
                    <li><strong>Hidratación fraccionada:</strong> No más de 200ml por hora para evitar urgencias sin paradas.</li>
                    <li>Saca las zapatillas de vez en cuando y <strong>haz contracciones de pantorrillas</strong> para bombear sangre.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 text-indigo-950 p-2.5 rounded-xl text-[11px] leading-relaxed border border-indigo-100 flex items-start gap-2">
              <Shield className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Fórmula de Ruta Cómoda:</span>
                Toma 1 dosis de Citrato de Magnesio antes de abordar para relajar el sistema nervioso simpático, previniendo el estrés del trayecto.
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2B: OTRAS CONDICIONES REGISTRADAS */}
        {calcForm.has_other_condition && (
          <div className="bg-white rounded-3xl p-6 border border-amber-200 shadow-xs flex flex-col justify-between space-y-4" id="other_condition_module">
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-150">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#5A7C56]">Atención de Condición Especial</h3>
                  <p className="text-[10px] text-stone-500 font-bold font-mono">Control de salud diario</p>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">Observaciones Activas:</span>
                <p className="text-xs text-stone-700 bg-[#FAF8F5] p-3 rounded-xl border border-stone-200/60 font-semibold italic">
                  "{calcForm.other_condition_notes || "Acompañamiento clínico habilitado."}"
                </p>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 font-medium">
              NutriSaaS adapta tu planificación diaria cuidando estas observaciones. Conversa de tus dudas clínicas con tu médico tratante.
            </p>
          </div>
        )}

        {/* DEFAULT STATE: Prompt how to configure them if none is active */}
        {!calcForm.has_constipation_trouble && !calcForm.has_long_trips && !calcForm.has_other_condition && (
          <div className="bg-[#FAF8F5]/30 rounded-3xl p-6 border-2 border-dashed border-stone-200/80 shadow-xs col-span-1 lg:col-span-2 text-center py-10 space-y-4 flex flex-col items-center justify-center">
            <div className="p-3 bg-white border border-stone-150 rounded-full text-stone-400">
              <User className="h-8 w-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-sm font-black text-stone-900">Soporte de Estilo de Vida y Salud</h3>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">
                No tienes condiciones clínicas especiales configuradas hoy. En la pestaña <strong className="text-[#3D5C3A]">Metas & Perfil</strong> puedes activar apoyo para ir al baño (estreñimiento), guías de viajes largos en bus o notas de salud personalizadas.
              </p>
            </div>
            <button 
              onClick={() => setMobileScreen('calculator')}
              className="mt-1 bg-[#5A7C56] hover:bg-[#3D5C3A] text-white text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer shadow-3xs"
            >
              Configurar Condiciones de Perfil
            </button>
          </div>
        )}

      </div>

      {/* MODULE 3: MONO-USER PERSONALIZED DAILY SUPPLEMENTATION CHECKLIST (Tied cleanly to logged in profile) */}
      <div className="bg-white rounded-3xl p-6 border border-[#CDDCD0] shadow-xs space-y-4" id="supplements_module">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFF4EE] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 rounded-xl border border-rose-150">
              <Heart className="h-5 w-5 text-rose-500 fill-rose-100" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900">Mi Bitácora de Suplementación Diaria</h3>
              <p className="text-[10px] text-stone-400 font-bold">
                Control de micro-nutrientes diario para {activeProfile ? `${activeProfile.first_name} ${activeProfile.last_name}` : "Ricardo Mari"}
              </p>
            </div>
          </div>

          <div className="font-extrabold text-[#5A7C56] font-mono bg-[#EFF4EE] px-3 py-1 rounded-xl border border-[#CDDCD0] text-xs">
            {Object.values(userSupplements).filter(Boolean).length} / {Object.keys(userSupplements).length} consumidos
          </div>
        </div>

        <div className="space-y-3">
          {userSuppsList.length === 0 ? (
            <p className="text-xs text-stone-400 font-semibold italic">No existen suplementos programados hoy.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userSuppsList.map(supKey => {
                const checked = !!userSupplements[supKey];
                return (
                  <button
                    key={supKey}
                    onClick={() => toggleUserSupp(supKey)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                      checked 
                        ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950' 
                        : 'bg-[#FAF8F5] border-stone-200/80 text-stone-750 hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                       <span className="text-xs font-black block leading-tight">{supKey.split(' - ')[0]}</span>
                       <span className="text-[10px] text-stone-500 font-semibold block leading-tight">{supKey.split(' - ')[1]}</span>
                    </div>
                    <div className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center border transition-colors flex-shrink-0 ${
                      checked ? 'bg-[#5A7C56] border-[#3D5C3A] text-white' : 'bg-white border-stone-300'
                    }`}>
                      {checked && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {isUserSuppsComplete && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border-2 border-dashed border-emerald-250 text-center rounded-2xl text-xs font-black animate-bounce mt-4 leading-normal">
              🌟 ¡Suplementación completa para {activeUserName}! Tránsito intestinal, enfoque cognitivo y balance corporal protegidos hoy. 🌟
            </div>
          )}
        </div>
      </div>

      {/* 3. LISTADO DE REGISTROS DE NUTRICIóN HOY (Comidas del día) */}
      <div className="bg-white rounded-3xl p-6 border border-[#CDDCD0] shadow-xs space-y-4" id="nutrition_history_list">
        <div className="flex justify-between items-center border-b border-[#EFF4EE] pb-3">
          <h3 className="text-sm font-black text-stone-850 flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-[#5A7C56]" /> Registros de Nutrición Registrados Hoy
          </h3>
          <span className="text-xs font-bold text-stone-500 font-mono bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
            {dailyLogs.length} alimentos
          </span>
        </div>

        {dailyLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400 italic font-semibold max-w-md mx-auto space-y-3">
            <p>Aún no has ingresado ningún platillo ni colación para el día de hoy.</p>
            <p className="text-[11px] text-[#5A7C56] not-italic font-bold">
              ¡Prueba nuestro escáner inteligente con Inteligencia Artificial o busca ingredientes en el buscador técnico más abajo!
            </p>
            <div className="pt-2">
              <button 
                onClick={() => setMobileScreen('scanner')}
                className="bg-[#EFF4EE] text-[#3D5C3A] font-extrabold border border-[#CDDCD0] px-3.5 py-2 rounded-xl text-xs hover:bg-[#E2ECD0] transition-colors cursor-pointer inline-block"
              >
                Escanear mi primera comida
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dailyLogs.map(log => (
              <div 
                key={log.id} 
                className="bg-[#FAF8F5] hover:bg-[#FAF8F5]/80 p-3.5 rounded-2xl border border-stone-200/80 flex justify-between items-center text-xs transition duration-150" 
                id={`log_item_${log.id}`}
              >
                <div className="space-y-1">
                  <span className="font-extrabold text-stone-850 block">{log.custom_food_name}</span>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-stone-500 font-medium">
                    <span className="bg-white px-2 py-0.5 rounded-md border border-stone-200 text-[#3D5C3A] font-bold uppercase overflow-hidden truncate max-w-[80px]">
                      {log.meal_type}
                    </span>
                    <span>•</span>
                    <span>Prot: <strong className="text-stone-700">{log.protein_g}g</strong></span>
                    <span>Carb: <strong className="text-stone-700">{log.carbs_g}g</strong></span>
                    <span>Grasas: <strong className="text-stone-700">{log.fat_g}g</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-l border-stone-150 pl-3">
                  <div className="text-right">
                    <span className="font-black font-mono text-stone-900 text-sm">{log.calories}</span>
                    <span className="text-[10px] text-stone-400 font-bold block">kcal</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteDailyLog(log.id)} 
                    className="text-stone-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition duration-150 cursor-pointer flex-shrink-0" 
                    id={`delete_log_btn_${log.id}`}
                    title="Eliminar de mi bitácora"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Quick summary of remaining balance */}
            <div className="bg-stone-55 border border-stone-150 p-3 rounded-2xl flex items-center justify-between text-xs text-stone-500 font-bold">
              <span>Totales Registrados:</span>
              <span>
                {loggedTodayCalories} kcal / {loggedTodayProtein}g Proteína
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
