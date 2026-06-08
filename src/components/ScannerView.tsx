import React from 'react';
import { Camera, Upload, Info } from 'lucide-react';
import { VisualFoodAnalysis } from '../types';

export interface ScannerViewProps {
  cameraPhotoBase64: string | null;
  handleFileUpload: (e: any) => void;
  scanningStatus: string | null;
  handleApplyPresetPhoto: (presetName: string) => void;
  aiAnalysisResult: VisualFoodAnalysis | null;
  portionMultiplier: number;
  setPortionMultiplier: (val: number) => void;
  hiddenIngredientsForm: any[];
  setHiddenIngredientsForm: (val: any[]) => void;
  loggedMealType: string;
  setLoggedMealType: (val: any) => void;
  handleAddAnalyzedFoodToLog: () => void;
}

export default function ScannerView({
  cameraPhotoBase64,
  handleFileUpload,
  scanningStatus,
  handleApplyPresetPhoto,
  aiAnalysisResult,
  portionMultiplier,
  setPortionMultiplier,
  hiddenIngredientsForm,
  setHiddenIngredientsForm,
  loggedMealType,
  setLoggedMealType,
  handleAddAnalyzedFoodToLog
}: ScannerViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="scanner_view_container">
      {/* Viewfinder & Presets */}
      <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
        <h3 className="text-base font-bold flex items-center gap-1.5 border-b pb-3">
          <Camera className="h-5 w-5 text-[#5A7C56]" /> Lente de Reconocimiento de Comida
        </h3>
        <div className="relative w-full aspect-video bg-stone-100 rounded-xl overflow-hidden border flex flex-col justify-between p-4">
          <div className="absolute inset-4 pointer-events-none border border-dashed border-[#5A7C56]/30 rounded-lg"></div>
          {cameraPhotoBase64 ? (
            <img src={cameraPhotoBase64} alt="Plato" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <p className="text-xs text-stone-400 italic text-center m-auto">Enfoque a 45° con buena iluminación</p>
          )}
          <label className="cursor-pointer bg-[#5A7C56] hover:bg-[#4D6949] text-white px-4 py-2 rounded-lg text-xs font-bold transition m-auto z-10 flex gap-1 shadow-3xs">
            <Upload className="h-4 w-4" /> Tomar o Cargar Foto
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {scanningStatus && <p className="text-xs text-[#5A7C56] font-bold text-center animate-pulse">{scanningStatus}</p>}

        <div className="space-y-1.5">
          <span className="text-[10px] text-stone-500 uppercase font-bold block">Demostraciones Rápidas (Presets Chilenos):</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button onClick={() => handleApplyPresetPhoto("palta")} className="bg-stone-50 border p-2.5 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left">🥑 Marraqueta con Palta</button>
            <button onClick={() => handleApplyPresetPhoto("lomo")} className="bg-stone-50 border p-2.5 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left">🥩 Lomo Liso con ensalada</button>
            <button onClick={() => handleApplyPresetPhoto("poroto")} className="bg-stone-50 border p-2.5 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left">🍲 Porotos con Riendas</button>
            <button onClick={() => handleApplyPresetPhoto("pollo")} className="bg-stone-50 border p-2.5 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left">🍗 Pollo Grillado con Verduras</button>
          </div>
        </div>
      </div>

      {/* Analysis Output */}
      <div className="lg:col-span-6" id="scanner_results_panel">
        {aiAnalysisResult ? (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h4 className="text-base font-bold text-stone-900 border-b pb-2">{aiAnalysisResult.food_name}</h4>
            <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-3 rounded-lg">
              {aiAnalysisResult.ingredients.map((ing, idx) => (
                <p key={idx} className="flex justify-between">
                  <span>● {ing.name} ({Math.round(ing.weight_g * portionMultiplier)}g)</span> 
                  <strong>{Math.round(ing.calories * portionMultiplier)} kcal</strong>
                </p>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold flex justify-between">
                <span>Porción: {Math.round(portionMultiplier * 100)}%</span> 
                <strong>{Math.round(aiAnalysisResult.estimated_weight_g * portionMultiplier)}g</strong>
              </p>
              <input 
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                value={portionMultiplier} 
                onChange={e => setPortionMultiplier(parseFloat(e.target.value))} 
                className="w-full h-1.5 bg-stone-200 cursor-pointer accent-[#5A7C56]" 
              />
            </div>

            <div className="space-y-1 font-medium text-xs text-stone-700 border-t pt-2">
              <p className="font-bold flex items-center gap-1">
                <Info className="h-4 w-4 text-stone-400" /> ¿Ingredientes Ocultos en Cocción?
              </p>
              {hiddenIngredientsForm.map((item, idx) => (
                <label key={idx} className="flex items-center gap-2 mt-1 cursor-pointer hover:text-stone-900">
                  <input 
                    type="checkbox" 
                    checked={item.checked} 
                    onChange={e => {
                      const u = [...hiddenIngredientsForm];
                      u[idx].checked = e.target.checked;
                      setHiddenIngredientsForm(u);
                    }} 
                    className="rounded text-[#5A7C56] focus:ring-[#5A7C56]" 
                  />
                  <span>{item.name} (+{item.extra_calories} kcal)</span>
                </label>
              ))}
            </div>

            <div className="bg-emerald-50 text-emerald-950 p-3 rounded-xl border flex justify-between text-xs font-bold font-mono">
              <span>Total Estimado:</span>
              <span>
                {Math.round(aiAnalysisResult.total_calories * portionMultiplier) + 
                 hiddenIngredientsForm.filter(i => i.checked).reduce((s, it) => s + it.extra_calories, 0)} kcal
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <select 
                value={loggedMealType} 
                onChange={e => setLoggedMealType(e.target.value as any)} 
                className="w-full bg-stone-50 border p-2 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#5A7C56]"
              >
                <option value="breakfast">🌅 Desayuno</option>
                <option value="lunch">☀️ Almuerzo</option>
                <option value="dinner">🌙 Cena</option>
                <option value="snack">🍎 Snack / Colación</option>
              </select>
            </div>

            <button 
              onClick={handleAddAnalyzedFoodToLog} 
              className="w-full bg-[#5A7C56] hover:bg-[#4D6949] text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-3xs"
            >
              Registrar en Bitácora
            </button>
          </div>
        ) : (
          <div className="bg-stone-50 rounded-2xl p-6 border border-dashed border-stone-200 text-center py-12 italic text-xs text-stone-500 m-auto">
            Carga un plato o presiona un preset para visualizar las porciones calculadas por la IA de visión computacional.
          </div>
        )}
      </div>
    </div>
  );
}
