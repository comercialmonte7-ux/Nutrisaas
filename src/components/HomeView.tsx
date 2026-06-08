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
  HelpCircle
} from 'lucide-react';
import { DailyLog } from '../types';

export interface HomeViewProps {
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
  // Mifflin-St Jeor formula baseline estimation for Mari (68.5kg, 165cm, 32yo, female)
  const bmrEstimate = Math.round(10 * calcForm.weight_kg + 6.25 * calcForm.height_cm - 5 * calcForm.age - 161);
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
              <User className="h-3.5 w-3.5 text-[#5A7C56]" /> Goal: {calcForm.goal === 'lose_weight' ? 'Déficit (Pérdida)' : calcForm.goal === 'gain_muscle' ? 'Superávit (Músculo)' : 'Mantenimiento'}
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
          <div className="bg-[#FAF8F5] border border-stone-200 rounded-2xl p-4.5 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-600 flex items-center gap-1.5 uppercase tracking-wider">
                <Flame className="h-4 w-4 text-amber-600" /> He Gastado
              </span>
              {calcForm.wearable_enabled && (
                <span className="text-[9px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                  Wearable Activo
                </span>
              )}
            </div>
            <div>
              <p className="text-3xl font-black text-stone-900 font-mono">
                {totalCaloriesExpended} <span className="text-sm font-bold text-stone-500">kcal</span>
              </p>
              <p className="text-[10px] text-stone-500 font-bold mt-1 leading-relaxed">
                Tasa basal ({bmrEstimate} kcal) + {activeDeviceCalories} {calcForm.deviceName}
              </p>
            </div>
            <div className="text-[10px] text-stone-500 font-medium bg-white px-2 py-1.5 rounded-lg border border-stone-150 flex items-center justify-between">
              <span>Nivel actividad:</span>
              <span className="font-bold text-[#5A7C56]">
                {calcForm.activity_level === 'sedentary' ? 'Sedentario' : calcForm.activity_level === 'lightly_active' ? 'Ligero' : 'Moderado'}
              </span>
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

        {/* 2. PLAN DE ACCIÓN PERSONALIZADO PARA EMPAREJAR TU OBJETIVO */}
        <div className="border-t border-stone-150 pt-5 text-left">
          <div className="bg-gradient-to-br from-[#EFF4EE] to-white rounded-2xl border border-[#CDDCD0] p-4.5 space-y-3 shadow-3xs" id="personalized_goal_match">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-xs font-black text-[#3D5C3A] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#5A7C56]" /> 
                ¿Qué hacer ahora para cumplir mi objetivo?
              </h4>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${advice.badgeColor}`}>
                {advice.status}
              </span>
            </div>
            
            <div className="space-y-2">
              <p className="text-xs font-extrabold text-stone-850 flex items-center gap-1.5">
                {calcForm.goal === 'lose_weight' ? <TrendingDown className="h-4 w-4 text-[#5A7C56]" /> : <TrendingUp className="h-4 w-4 text-emerald-600" />}
                Plan Clínico Activo: {advice.title}
              </p>
              <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                {advice.text}
              </p>
            </div>

            {/* Quick Actions triggers */}
            <div className="pt-2 border-t border-[#CDDCD0]/40 flex flex-wrap gap-2 text-xs">
              <button 
                onClick={() => setMobileScreen('scanner')}
                className="bg-[#5A7C56] hover:bg-[#3D5C3A] text-white font-black px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-3xs hover:shadow-2xs"
              >
                Escanear Plato con IA <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => setMobileScreen('db_explorer')}
                className="bg-white hover:bg-stone-50 text-stone-650 border border-stone-250 font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-3xs"
              >
                Buscar Alimento Técnico
              </button>
            </div>
          </div>
        </div>

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
