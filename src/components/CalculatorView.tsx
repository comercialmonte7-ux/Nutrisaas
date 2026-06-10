import React from 'react';
import { Sliders, Flame, UserCheck, Save, Download, Upload, Info } from 'lucide-react';
import { CalculationResult } from '../types';

export interface CalculatorViewProps {
  calcForm: any;
  setCalcForm: React.Dispatch<React.SetStateAction<any>>;
  calculatedTarget: CalculationResult | null;
  handleUpdateSupabaseProfile: () => void;
  loading: boolean;
  handleExportData: () => void;
  handleImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CalculatorView({
  calcForm,
  setCalcForm,
  calculatedTarget,
  handleUpdateSupabaseProfile,
  loading,
  handleExportData,
  handleImportData
}: CalculatorViewProps) {
  const [weightText, setWeightText] = React.useState(calcForm.weight_kg ? String(calcForm.weight_kg) : '');
  const [heightText, setHeightText] = React.useState(calcForm.height_cm ? String(calcForm.height_cm) : '');
  const [ageText, setAgeText] = React.useState(calcForm.age ? String(calcForm.age) : '');

  // Synchronize string inputs when calcForm changes from elsewhere (like startup loading)
  React.useEffect(() => {
    const parsedWeight = parseFloat(weightText) || 0;
    if (parsedWeight !== calcForm.weight_kg) {
      setWeightText(calcForm.weight_kg ? String(calcForm.weight_kg) : '');
    }
  }, [calcForm.weight_kg]);

  React.useEffect(() => {
    const parsedHeight = parseInt(heightText, 10) || 0;
    if (parsedHeight !== calcForm.height_cm) {
      setHeightText(calcForm.height_cm ? String(calcForm.height_cm) : '');
    }
  }, [calcForm.height_cm]);

  React.useEffect(() => {
    const parsedAge = parseInt(ageText, 10) || 0;
    if (parsedAge !== calcForm.age) {
      setAgeText(calcForm.age ? String(calcForm.age) : '');
    }
  }, [calcForm.age]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="calculator_view_container">
      {/* Parameter Settings */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
        <h3 className="text-base font-bold flex items-center gap-2 border-b pb-3">
          <Sliders className="h-5 w-5 text-[#5A7C56]" /> Editar Parámetros de Biometría
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-stone-600 font-bold block">Peso corporal (kg)</span>
            <input 
              type="text" 
              inputMode="decimal"
              value={weightText} 
              onChange={e => {
                // Allow only digits and a single dot
                let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                const parts = val.split('.');
                val = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                
                // Strip leading zero if followed by a digit
                val = val.replace(/^0+(?=\d)/, '');

                setWeightText(val);
                const num = parseFloat(val);
                setCalcForm((p: any) => ({ ...p, weight_kg: isNaN(num) ? 0 : num }));
              }} 
              className="w-full bg-stone-50 border p-2.5 rounded-lg text-sm font-bold focus:outline-hidden focus:ring-1 focus:ring-[#5A7C56]" 
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-stone-600 font-bold block">Estatura corporal (cm)</span>
            <input 
              type="text" 
              inputMode="numeric"
              value={heightText} 
              onChange={e => {
                let val = e.target.value.replace(/[^0-9]/g, '');
                val = val.replace(/^0+(?=\d)/, '');
                
                setHeightText(val);
                const num = parseInt(val, 10);
                setCalcForm((p: any) => ({ ...p, height_cm: isNaN(num) ? 0 : num }));
              }} 
              className="w-full bg-stone-50 border p-2.5 rounded-lg text-sm font-bold focus:outline-hidden focus:ring-1 focus:ring-[#5A7C56]" 
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-stone-600 font-bold block">Edad</span>
            <input 
              type="text" 
              inputMode="numeric"
              value={ageText} 
              onChange={e => {
                let val = e.target.value.replace(/[^0-9]/g, '');
                val = val.replace(/^0+(?=\d)/, '');

                setAgeText(val);
                const num = parseInt(val, 10);
                setCalcForm((p: any) => ({ ...p, age: isNaN(num) ? 0 : num }));
              }} 
              className="w-full bg-stone-50 border p-2.5 rounded-lg text-sm font-bold focus:outline-hidden focus:ring-1 focus:ring-[#5A7C56]" 
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-stone-600 font-bold block">Elegir Objetivo de Peso</span>
            <select 
              value={calcForm.goal} 
              onChange={e => setCalcForm((p: any) => ({ ...p, goal: e.target.value as any }))} 
              className="w-full bg-stone-50 border p-2 rounded-lg text-xs font-bold"
            >
              <option value="lose_weight">📉 Pérdida de Grasa</option>
              <option value="maintain_weight">⚖️ Mantenimiento Corporal</option>
              <option value="gain_muscle">💪 Superávit Masa Muscular</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-stone-600 font-bold block font-semibold">Nivel de Actividad Física (PAL):</span>
          <select 
            value={calcForm.activity_level} 
            onChange={e => setCalcForm((p: any) => ({ ...p, activity_level: e.target.value as any }))} 
            className="w-full bg-stone-50 border p-2.5 rounded-lg text-xs font-bold"
          >
            <option value="sedentary">Sedentario (PAL: 1.20)</option>
            <option value="lightly_active">Actividad ligera (PAL: 1.375)</option>
            <option value="moderately_active">Moderadamente activo (PAL: 1.55)</option>
            <option value="very_active">Deporte Intenso (PAL: 1.725)</option>
          </select>
        </div>

        {/* Condiciones Clínicas y de Estilo de Vida */}
        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-250/80 space-y-4">
          <h4 className="text-xs font-black text-stone-700 uppercase tracking-wider">
            Soporte Clínico y Estilo de Vida
          </h4>
          <p className="text-[11px] text-stone-500 leading-normal font-semibold">
            Activa las condiciones específicas para adaptar dinámicamente tu dashboard personal de NutriSaaS:
          </p>

          <div className="space-y-3">
            {/* 1. Constipation Support toggle */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={!!calcForm.has_constipation_trouble}
                onChange={e => setCalcForm((p: any) => ({ ...p, has_constipation_trouble: e.target.checked }))}
                className="mt-1 h-4 w-4 bg-white rounded border-stone-300 text-[#5A7C56] focus:ring-[#5A7C56] accent-[#5A7C56]"
              />
              <div className="leading-tight">
                <span className="text-xs font-black text-stone-850 block">Dificultad recurrente para ir al baño</span>
                <span className="text-[10px] text-stone-500 font-medium block">
                  Habilita el contador y recomendaciones de fibra soluble y líquidos activos.
                </span>
              </div>
            </label>

            {/* 2. Long Trips configuration toggle */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={!!calcForm.has_long_trips}
                onChange={e => setCalcForm((p: any) => ({ ...p, has_long_trips: e.target.checked }))}
                className="mt-1 h-4 w-4 bg-white rounded border-stone-300 text-[#5A7C56] focus:ring-[#5A7C56] accent-[#5A7C56]"
              />
              <div className="leading-tight">
                <span className="text-xs font-black text-stone-850 block">Viajes largos en bus / avión frecuentes</span>
                <span className="text-[10px] text-stone-500 font-medium block">
                  Activa el planificador de snacks secos de bajo residuo y ejercicios circulatorios.
                </span>
              </div>
            </label>

            {/* 3. Other clinical conditions notes */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={!!calcForm.has_other_condition}
                onChange={e => setCalcForm((p: any) => ({ ...p, has_other_condition: e.target.checked }))}
                className="mt-1 h-4 w-4 bg-white rounded border-stone-300 text-[#5A7C56] focus:ring-[#5A7C56] accent-[#5A7C56]"
              />
              <div className="leading-tight">
                <span className="text-xs font-black text-stone-850 block">¿Existe otro tipo de condición o restricción?</span>
                <span className="text-[10px] text-stone-500 font-medium block">
                  Especifica alergias relevantes, intolerancias o metas clínicas externas.
                </span>
              </div>
            </label>

            {/* Render details textarea if checked */}
            {calcForm.has_other_condition && (
              <div className="pl-6.5 animate-fade-in space-y-1.5">
                <span className="text-[10px] text-stone-600 font-bold block uppercase tracking-wide">Notas de la condición:</span>
                <textarea 
                  value={calcForm.other_condition_notes || ''}
                  onChange={e => setCalcForm((p: any) => ({ ...p, other_condition_notes: e.target.value }))}
                  placeholder="Ej: Intolerancia severa a la lactosa, colon irritable, hipertensión arterial, etc..."
                  className="w-full bg-white border border-stone-250 p-2 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#5A7C56]"
                  rows={2}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button 
            onClick={() => setCalcForm((p: any) => ({ ...p, macro_method: 'percentage' }))} 
            className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${calcForm.macro_method === 'percentage' ? 'bg-[#5A7C56] text-white' : 'bg-stone-50 text-stone-600'}`}
          >
            Método Porcentaje
          </button>
          <button 
            onClick={() => setCalcForm((p: any) => ({ ...p, macro_method: 'weight_ratio' }))} 
            className={`p-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${calcForm.macro_method === 'weight_ratio' ? 'bg-[#5A7C56] text-white' : 'bg-stone-50 text-stone-600'}`}
          >
            Método por Gramos/Kg
          </button>
        </div>
      </div>

      {/* Target Result calculations */}
      <div className="lg:col-span-5 space-y-6" id="calculator_results_panel">
        {calculatedTarget && (
          <div className="bg-[#EFF4EE] rounded-2xl p-6 border border-[#BCDAB7] space-y-4">
            <h4 className="text-base font-bold text-stone-900 flex items-center gap-1">
              <Flame className="h-5 w-5 text-amber-600 fill-amber-500" /> Presupuesto Calculado
            </h4>
            <div className="space-y-2 border-b pb-3 text-xs text-stone-600">
              <p className="flex justify-between"><span>Basal Mifflin-St Jeor:</span> <strong>{calculatedTarget.getd_applied ? Math.round(calculatedTarget.getd_applied * 0.8) : 1400} kcal</strong></p>
              <p className="flex justify-between"><span>GETD Estimado:</span> <strong>{calculatedTarget.getd_applied} kcal</strong></p>
            </div>
            <div className="bg-white p-3.5 rounded-xl text-center border">
              <span className="text-[10px] text-stone-500 font-extrabold uppercase">Meta de Energía Diaria</span>
              <span className="text-2xl font-bold text-[#5A7C56] font-mono block mt-0.5">{calculatedTarget.target_calories} kcal</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-2.5 rounded-xl border">
              <div><span className="text-[10px] text-stone-400 block pb-1">Proteínas</span> <strong>{calculatedTarget.target_protein_g}g</strong></div>
              <div><span className="text-[10px] text-stone-400 block pb-1">Carbos</span> <strong>{calculatedTarget.target_carbs_g}g</strong></div>
              <div><span className="text-[10px] text-stone-400 block pb-1">Grasas</span> <strong>{calculatedTarget.target_fat_g}g</strong></div>
            </div>
            <button 
              onClick={handleUpdateSupabaseProfile} 
              disabled={loading}
              className="w-full bg-[#5A7C56] hover:bg-[#4D6949] text-white rounded-xl py-3 text-xs font-bold transition uppercase cursor-pointer"
            >
              <UserCheck className="inline-block h-4 w-4 mr-1.5" /> Guardar en Perfil de NutriSaaS
            </button>
          </div>
        )}

        {/* Respaldo y Restauración de Datos Widget */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
          <h4 className="text-sm font-extrabold text-[#3D5C3A] flex items-center gap-2 border-b border-[#EFF4EE] pb-3">
            <Save className="h-5 w-5 text-[#5A7C56]" /> Respaldo y Restauración de Datos
          </h4>
          <p className="text-[11px] text-stone-500 leading-normal font-semibold">
            Para evitar la pérdida de tus fotos y bitácoras si el navegador limpia el almacenamiento local (común en iPhones/Safari), te recomendamos exportar un respaldo periódico a tu dispositivo.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button 
              onClick={handleExportData}
              className="bg-white hover:bg-stone-50 border border-stone-250 py-2.5 rounded-xl text-xs font-bold text-stone-700 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <Download className="h-3.5 w-3.5 text-[#5A7C56]" /> Exportar Respaldo
            </button>
            <label 
              className="bg-[#EFF4EE] hover:bg-[#E2ECD0] text-[#3D5C3A] py-2.5 rounded-xl text-xs font-extrabold border border-[#CDDCD0] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <Upload className="h-3.5 w-3.5 text-[#5A7C56]" /> Importar Respaldo
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
          
          <div className="bg-amber-50 text-amber-950 p-2.5 rounded-xl text-[10px] leading-relaxed border border-amber-200 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block">Recomendación de Seguridad:</span>
              El archivo de respaldo contiene toda tu información de perfil, metas, bitácoras históricas y fotos. Guárdalo de forma segura.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
