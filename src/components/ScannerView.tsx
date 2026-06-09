import React, { useState } from 'react';
import { Camera, Upload, Info, Trash2, Plus, Sparkles, Check, Edit3 } from 'lucide-react';
import { VisualFoodAnalysis } from '../types';

export interface ScannerViewProps {
  cameraPhotoBase64: string | null;
  handleFileUpload: (e: any) => void;
  scanningStatus: string | null;
  handleApplyPresetPhoto: (presetName: string) => void;
  aiAnalysisResult: VisualFoodAnalysis | null;
  setAiAnalysisResult: (val: VisualFoodAnalysis | null) => void;
  portionMultiplier: number;
  setPortionMultiplier: (val: number) => void;
  hiddenIngredientsForm: any[];
  setHiddenIngredientsForm: (val: any[]) => void;
  loggedMealType: string;
  setLoggedMealType: (val: any) => void;
  handleAddAnalyzedFoodToLog: () => void;
  scannerError: string | null;
  setScannerError: (val: string | null) => void;
}

export default function ScannerView({
  cameraPhotoBase64,
  handleFileUpload,
  scanningStatus,
  handleApplyPresetPhoto,
  aiAnalysisResult,
  setAiAnalysisResult,
  portionMultiplier,
  setPortionMultiplier,
  hiddenIngredientsForm,
  setHiddenIngredientsForm,
  loggedMealType,
  setLoggedMealType,
  handleAddAnalyzedFoodToLog,
  scannerError,
  setScannerError
}: ScannerViewProps) {
  const [typedFoodDescription, setTypedFoodDescription] = useState("");
  const [isEditingResult, setIsEditingResult] = useState(false);

  // Helper to trigger calculation based on typed description
  const handleTypedAnalyze = () => {
    if (!typedFoodDescription.trim()) return;
    handleApplyPresetPhoto(typedFoodDescription);
  };

  // Helper to handle individual ingredient fields updates
  const handleUpdateIngredient = (idx: number, field: string, value: any) => {
    if (!aiAnalysisResult) return;
    const updatedIngredients = aiAnalysisResult.ingredients.map((ing, i) => {
      if (i === idx) {
        const val = field === 'name' ? value : Number(value) || 0;
        return { ...ing, [field]: val };
      }
      return ing;
    });

    // Recompute total macros based on ingredients
    const total_calories = updatedIngredients.reduce((s, it) => s + it.calories, 0);
    const total_protein_g = Number(updatedIngredients.reduce((s, it) => s + it.protein_g, 0).toFixed(1));
    const total_carbs_g = Number(updatedIngredients.reduce((s, it) => s + it.carbs_g, 0).toFixed(1));
    const total_fat_g = Number(updatedIngredients.reduce((s, it) => s + it.fat_g, 0).toFixed(1));
    const estimated_weight_g = updatedIngredients.reduce((s, it) => s + it.weight_g, 0);

    setAiAnalysisResult({
      ...aiAnalysisResult,
      ingredients: updatedIngredients,
      total_calories,
      total_protein_g,
      total_carbs_g,
      total_fat_g,
      estimated_weight_g
    });
  };

  // Helper to delete an ingredient
  const handleDeleteIngredient = (idx: number) => {
    if (!aiAnalysisResult) return;
    const updatedIngredients = aiAnalysisResult.ingredients.filter((_, i) => i !== idx);

    const total_calories = updatedIngredients.reduce((s, it) => s + it.calories, 0);
    const total_protein_g = Number(updatedIngredients.reduce((s, it) => s + it.protein_g, 0).toFixed(1));
    const total_carbs_g = Number(updatedIngredients.reduce((s, it) => s + it.carbs_g, 0).toFixed(1));
    const total_fat_g = Number(updatedIngredients.reduce((s, it) => s + it.fat_g, 0).toFixed(1));
    const estimated_weight_g = updatedIngredients.reduce((s, it) => s + it.weight_g, 0);

    setAiAnalysisResult({
      ...aiAnalysisResult,
      ingredients: updatedIngredients,
      total_calories,
      total_protein_g,
      total_carbs_g,
      total_fat_g,
      estimated_weight_g
    });
  };

  // Helper to add mock ingredient row
  const handleAddIngredientRow = () => {
    if (!aiAnalysisResult) return;
    const newIngredient = {
      name: "Nuevo ingrediente",
      weight_g: 50,
      calories: 60,
      protein_g: 1.5,
      carbs_g: 8.0,
      fat_g: 1.0
    };
    const updatedIngredients = [...aiAnalysisResult.ingredients, newIngredient];

    const total_calories = updatedIngredients.reduce((s, it) => s + it.calories, 0);
    const total_protein_g = Number(updatedIngredients.reduce((s, it) => s + it.protein_g, 0).toFixed(1));
    const total_carbs_g = Number(updatedIngredients.reduce((s, it) => s + it.carbs_g, 0).toFixed(1));
    const total_fat_g = Number(updatedIngredients.reduce((s, it) => s + it.fat_g, 0).toFixed(1));
    const estimated_weight_g = updatedIngredients.reduce((s, it) => s + it.weight_g, 0);

    setAiAnalysisResult({
      ...aiAnalysisResult,
      ingredients: updatedIngredients,
      total_calories,
      total_protein_g,
      total_carbs_g,
      total_fat_g,
      estimated_weight_g
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="scanner_view_container">
      {/* Viewfinder, Custom Text & Presets */}
      <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold flex items-center gap-1.5 text-stone-900">
            <Camera className="h-5 w-5 text-[#5A7C56]" /> Lente de Reconocimiento y Carga de Fotos
          </h3>
          <p className="text-xs text-stone-400 font-bold mt-0.5">Sube la foto de tu plato para desglosar sus macros</p>
        </div>

        {scannerError && (
          <div className="bg-rose-50 border border-rose-250 rounded-2xl p-4 text-stone-700 space-y-2.5 shadow-3xs animate-fade-in">
            <div className="flex items-center gap-2 text-rose-800">
              <span className="text-base">⚠️</span>
              <strong className="font-extrabold text-stone-900">Error en Reconocimiento de Imagen</strong>
            </div>
            <p className="text-xs font-bold leading-relaxed text-stone-600">{scannerError}</p>
            {(scannerError.includes("API_KEY") || scannerError.includes("api_key")) && (
              <div className="bg-white/90 border border-rose-200/50 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-black text-[#3D5C3A] uppercase tracking-wider block">🛠️ Guía de solución paso a paso:</span>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed font-bold text-stone-600">
                  <li>Inicia sesión en tu cuenta de <strong className="text-stone-900">Vercel</strong> y abre el proyecto de esta app.</li>
                  <li>Ve a la pestaña de <strong className="text-stone-900">Settings</strong> e ingresa a <strong className="text-stone-900">Environment Variables</strong>.</li>
                  <li>Agrega una nueva variable de entorno:
                    <div className="my-1 text-[10px] bg-stone-100 p-1.5 rounded-lg border font-mono text-stone-900 select-all font-bold">
                      Key: GEMINI_API_KEY
                    </div>
                  </li>
                  <li>Pega el valor de tu clave API de Gemini y guarda.</li>
                  <li>Redespliega el proyecto en Vercel para que los cambios se activen.</li>
                </ol>
              </div>
            )}
            <div className="flex justify-end pt-1">
              <button 
                onClick={() => setScannerError(null)}
                className="bg-stone-900 hover:bg-stone-850 text-white px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition cursor-pointer"
              >
                Cerrar Aviso
              </button>
            </div>
          </div>
        )}

        <div className="relative w-full aspect-video bg-stone-100 rounded-xl overflow-hidden border flex flex-col justify-between p-4">
          <div className="absolute inset-4 pointer-events-none border border-dashed border-[#5A7C56]/30 rounded-lg"></div>
          {cameraPhotoBase64 ? (
            <img src={cameraPhotoBase64} alt="Plato" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <p className="text-xs text-stone-400 italic text-center m-auto">Foto activa o previsualización del plato</p>
          )}
          <label className="cursor-pointer bg-[#5A7C56] hover:bg-[#4D6949] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition m-auto z-10 flex gap-1.5 shadow-3xs">
            <Upload className="h-4 w-4" /> Tomar o Cargar Foto
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {scanningStatus ? (
          <p className="text-xs text-[#5A7C56] font-extrabold text-center bg-emerald-50 py-2 rounded-lg border border-emerald-100 animate-pulse">
            ⏳ {scanningStatus}
          </p>
        ) : null}

        {/* Dynamic description of what is in the photo */}
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
          <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            💭 1. ¿Qué comida u plato hay en la foto?
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Escribe ej: Arroz con bistec y ensalada o tallarines con tomate..."
              value={typedFoodDescription}
              onChange={(e) => setTypedFoodDescription(e.target.value)}
              className="flex-1 bg-white border border-stone-200 text-xs px-3 py-2 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#5A7C56]"
              onKeyDown={(e) => { if (e.key === 'Enter') handleTypedAnalyze(); }}
            />
            <button 
              onClick={handleTypedAnalyze}
              className="bg-[#5A7C56] hover:bg-[#4D6949] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" /> Calcular
            </button>
          </div>
          <p className="text-[10px] text-stone-400 font-bold">
            Ingresa lo que comiste para que la base de datos de precisión calcule las calorías reales.
          </p>
        </div>

        {/* Quick Chilean Presets */}
        <div className="space-y-2">
          <span className="text-[10px] text-stone-400 uppercase font-black block tracking-wider">Demostraciones y Presets Chilenos:</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
            <button onClick={() => { setTypedFoodDescription("Marraqueta con palta"); handleApplyPresetPhoto("palta"); }} className="bg-stone-50 border p-2 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left transition">🥑 Marraqueta c/Palta</button>
            <button onClick={() => { setTypedFoodDescription("Lomo liso con ensalada"); handleApplyPresetPhoto("lomo"); }} className="bg-stone-50 border p-2 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left transition">🥩 Lomo con Ensalada</button>
            <button onClick={() => { setTypedFoodDescription("Porotos con riendas"); handleApplyPresetPhoto("poroto"); }} className="bg-stone-50 border p-2 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left transition">🍲 Porotos c/Riendas</button>
            <button onClick={() => { setTypedFoodDescription("Pollo con arroz"); handleApplyPresetPhoto("pollo"); }} className="bg-stone-50 border p-2 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left transition">🍗 Pollo con Arroz</button>
            <button onClick={() => { setTypedFoodDescription("Pescado con papas"); handleApplyPresetPhoto("pescado"); }} className="bg-stone-50 border p-2 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left transition">🐟 Pescado c/Papas</button>
            <button onClick={() => { setTypedFoodDescription("Tallarines boloñesa"); handleApplyPresetPhoto("pasta"); }} className="bg-stone-50 border p-2 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left transition">🍝 Fideos Boloñesa</button>
            <button onClick={() => { setTypedFoodDescription("Completo italiano"); handleApplyPresetPhoto("completo"); }} className="bg-stone-50 border p-2 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left transition">🌭 Completo Italiano</button>
            <button onClick={() => { setTypedFoodDescription("Empanada de pino"); handleApplyPresetPhoto("empanada"); }} className="bg-stone-50 border p-2 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left transition">🥧 Empanada de Pino</button>
            <button onClick={() => { setTypedFoodDescription("Cazuela de vacuno"); handleApplyPresetPhoto("cazuela"); }} className="bg-stone-50 border p-2 rounded-xl font-bold hover:bg-[#EFF4EE] cursor-pointer text-left transition">🥣 Cazuela Vacuno</button>
          </div>
        </div>
      </div>

      {/* Analysis Output & Precision Editor */}
      <div className="lg:col-span-6" id="scanner_results_panel">
        {aiAnalysisResult ? (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b pb-3.5">
              <div>
                <span className="text-[10px] text-[#5A7C56] font-extrabold uppercase bg-[#EFF4EE] px-2 py-0.5 rounded-full border border-emerald-100">
                  Desglose del Plato
                </span>
                <h4 className="text-base font-black text-stone-900 mt-1">{aiAnalysisResult.food_name}</h4>
              </div>
              <button 
                onClick={() => setIsEditingResult(!isEditingResult)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition shrink-0 ${isEditingResult ? "bg-[#5A7C56] text-white hover:bg-[#4D6949]" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}
              >
                {isEditingResult ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Guardar Edición
                  </>
                ) : (
                  <>
                    <Edit3 className="h-3.5 w-3.5" /> Editar Precisión
                  </>
                )}
              </button>
            </div>

            {/* Read-only list OR Interactive macro precision editor */}
            {isEditingResult ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-stone-500">Nombre del Plato:</label>
                  <input 
                    type="text" 
                    value={aiAnalysisResult.food_name} 
                    onChange={e => setAiAnalysisResult({ ...aiAnalysisResult, food_name: e.target.value })}
                    className="w-full bg-stone-50 border text-xs px-2 py-1.5 rounded-lg focus:outline-hidden"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-bold text-stone-500">Desglose de Ingredientes:</label>
                    <button 
                      onClick={handleAddIngredientRow}
                      className="text-[#5A7C56] font-bold text-xs flex items-center gap-1 hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" /> Añadir Fila
                    </button>
                  </div>

                  <div className="space-y-3 bg-stone-50 p-3 rounded-xl border border-stone-100 max-h-[240px] overflow-y-auto">
                    {aiAnalysisResult.ingredients.map((ing, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border shadow-3xs space-y-2 relative">
                        <button 
                          onClick={() => handleDeleteIngredient(idx)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1"
                          title="Eliminar ingrediente"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-8">
                            <label className="text-[9px] font-bold text-stone-400 block">Ingrediente:</label>
                            <input 
                              type="text" 
                              value={ing.name} 
                              onChange={e => handleUpdateIngredient(idx, 'name', e.target.value)}
                              className="w-full bg-stone-50 border text-[11px] px-1.5 py-0.5 rounded focus:outline-hidden"
                            />
                          </div>
                          <div className="col-span-4 pr-6">
                            <label className="text-[9px] font-bold text-stone-400 block">Peso (g):</label>
                            <input 
                              type="number" 
                              value={ing.weight_g} 
                              onChange={e => handleUpdateIngredient(idx, 'weight_g', e.target.value)}
                              className="w-full bg-stone-50 border text-[11px] px-1.5 py-0.5 rounded font-mono focus:outline-hidden"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1">
                          <div>
                            <label className="text-[8px] font-bold text-stone-400 block">Kcal:</label>
                            <input 
                              type="number" 
                              value={ing.calories} 
                              onChange={e => handleUpdateIngredient(idx, 'calories', e.target.value)}
                              className="w-full bg-stone-50 border text-[11px] px-1.5 py-0.5 rounded font-mono focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-bold text-stone-400 block">Prot (g):</label>
                            <input 
                              type="number" 
                              step="0.1"
                              value={ing.protein_g} 
                              onChange={e => handleUpdateIngredient(idx, 'protein_g', e.target.value)}
                              className="w-full bg-stone-50 border text-[11px] px-1.5 py-0.5 rounded font-mono focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-bold text-stone-400 block">Carb (g):</label>
                            <input 
                              type="number" 
                              step="0.1"
                              value={ing.carbs_g} 
                              onChange={e => handleUpdateIngredient(idx, 'carbs_g', e.target.value)}
                              className="w-full bg-stone-50 border text-[11px] px-1.5 py-0.5 rounded font-mono focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-bold text-stone-400 block">Grasa (g):</label>
                            <input 
                              type="number" 
                              step="0.1"
                              value={ing.fat_g} 
                              onChange={e => handleUpdateIngredient(idx, 'fat_g', e.target.value)}
                              className="w-full bg-stone-50 border text-[11px] px-1.5 py-0.5 rounded font-mono focus:outline-hidden"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
                {aiAnalysisResult.ingredients.map((ing, idx) => (
                  <p key={idx} className="flex justify-between items-center py-0.5 border-b border-stone-100 last:border-0">
                    <span>● {ing.name} ({Math.round(ing.weight_g * portionMultiplier)}g)</span> 
                    <strong className="font-mono">{Math.round(ing.calories * portionMultiplier)} kcal</strong>
                  </p>
                ))}
              </div>
            )}

            {/* Adjust Portion */}
            <div className="space-y-1 bg-[#F9FAF9] p-3 rounded-xl border border-[#EFF4EE]">
              <p className="text-xs font-bold flex justify-between">
                <span>Porción Consumida: {Math.round(portionMultiplier * 100)}%</span> 
                <strong className="font-mono">{Math.round(aiAnalysisResult.estimated_weight_g * portionMultiplier)}g</strong>
              </p>
              <input 
                type="range" 
                min="0.5" 
                max="2.5" 
                step="0.1" 
                value={portionMultiplier} 
                onChange={e => setPortionMultiplier(parseFloat(e.target.value))} 
                className="w-full h-1.5 bg-stone-200 cursor-pointer accent-[#5A7C56]" 
              />
              <span className="text-[10px] text-stone-400 block">Desliza para achicar o agrandar el plato total</span>
            </div>

            {/* Hidden ingredients info */}
            <div className="space-y-1.5 font-medium text-xs text-stone-700 border-t pt-2">
              <p className="font-bold flex items-center gap-1 text-stone-800">
                <Info className="h-4 w-4 text-[#5A7C56]" /> ¿Considerar aceites u aderezos ocultos?
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

            {/* Live calculated macros readout */}
            <div className="bg-[#EFF4EE] text-emerald-950 p-4 rounded-xl border border-emerald-100 space-y-2">
              <div className="flex justify-between text-xs font-bold border-b border-emerald-200/40 pb-2">
                <span>Total Estimado del Registro:</span>
                <span className="font-mono text-sm font-black">
                  {Math.round(aiAnalysisResult.total_calories * portionMultiplier) + 
                   hiddenIngredientsForm.filter(i => i.checked).reduce((s, it) => s + it.extra_calories, 0)} kcal
                </span>
              </div>
              <div className="grid grid-cols-3 text-center text-[10px] font-bold text-emerald-800 pt-0.5 font-mono">
                <div>PRO: {((aiAnalysisResult.total_protein_g ?? 0) * portionMultiplier).toFixed(1)}g</div>
                <div>CARB: {((aiAnalysisResult.total_carbs_g ?? 0) * portionMultiplier).toFixed(1)}g</div>
                <div>GRASA: {(((aiAnalysisResult.total_fat_g ?? 0) * portionMultiplier) + (hiddenIngredientsForm.filter(i => i.checked).reduce((s, it) => s + it.extra_calories, 0) / 9)).toFixed(1)}g</div>
              </div>
            </div>

            {/* Meal Logging Choice */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase block">⏰ Tipo de Comida a registrar:</label>
              <select 
                value={loggedMealType} 
                onChange={e => setLoggedMealType(e.target.value as any)} 
                className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-[#5A7C56]"
              >
                <option value="breakfast">🌅 Desayuno</option>
                <option value="lunch">☀️ Almuerzo</option>
                <option value="dinner">🌙 Cena</option>
                <option value="snack">🍎 Snack / Colación</option>
              </select>
            </div>

            <button 
              onClick={handleAddAnalyzedFoodToLog} 
              className="w-full bg-[#5A7C56] hover:bg-[#4D6949] text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer shadow-3xs flex items-center justify-center gap-1.5"
            >
              Registrar Plato en Mi Bitácora
            </button>
          </div>
        ) : (
          <div className="bg-stone-50 rounded-2xl p-6 border-2 border-dashed border-stone-200 text-center py-16 flex flex-col items-center justify-center space-y-3">
            <div className="h-12 w-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
              <Camera className="h-6 w-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="font-bold text-stone-700 text-xs text-center">¡Prepara el lente inteligente!</p>
              <p className="text-stone-400 text-[10px] leading-relaxed">
                Carga una foto de tu plato u haz clic en un preset rápido para obtener el desglose automático de calorías, proteínas y carbohidratos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
