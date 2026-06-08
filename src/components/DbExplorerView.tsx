import React from 'react';
import { Search } from 'lucide-react';

export interface DbExplorerViewProps {
  localFoodSearchQuery: string;
  handleManualSearch: (query: string, type: 'barcode' | 'local') => void;
  foodSearchResults: any[];
  handleLogManualFood: (food: any) => void;
}

export default function DbExplorerView({
  localFoodSearchQuery,
  handleManualSearch,
  foodSearchResults,
  handleLogManualFood
}: DbExplorerViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="db_explorer_view_container">
      {/* Search Input Box */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold flex items-center gap-2 border-b pb-3">
          <Search className="h-5 w-5 text-[#5A7C56]" /> Maestro de Alimentos (INTA Chile)
        </h3>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Ej: Palta, Colun, Soprole, Quaker..." 
            value={localFoodSearchQuery} 
            onChange={e => handleManualSearch(e.target.value, 'local')} 
            className="w-full bg-stone-50 border p-3 pl-9 rounded-xl text-sm font-bold font-mono focus:outline-hidden focus:ring-1 focus:ring-[#5A7C56]" 
            id="food_search_input"
          />
          <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-stone-400" />
        </div>

        {foodSearchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {foodSearchResults.map(f => (
              <div key={f.id} className="bg-[#FAF8F5] p-3 rounded-xl border flex flex-col justify-between text-xs space-y-3" id={`search_hit_${f.id}`}>
                <div>
                  <div className="flex justify-between items-start font-bold">
                    <span>{f.name}</span>
                    <span className="text-[9px] bg-emerald-100 text-[#3D5C3A] px-1 rounded">{f.source}</span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">EAN/UPC: {f.barcode || 'Maestro Local'}</p>
                  <p className="text-[10px] font-mono font-bold mt-1 text-[#5A7C56]">
                    {f.calories_100g} kcal/100g (P: {f.protein_100g}g | C: {f.carbs_100g}g)
                  </p>
                </div>
                <button 
                  onClick={() => handleLogManualFood(f)} 
                  className="w-full bg-[#5A7C56] hover:bg-[#4D6949] text-white py-1.5 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Registrar 100g en hoy
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barcodes Demonstration presets panel */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4" id="barcode_simulator_panel">
        <span className="text-xs font-bold text-stone-800 block uppercase tracking-wider">Simulador de Lector de Barras UPC</span>
        <p className="text-xs text-stone-500 leading-relaxed">
          Haz click en cualquiera de estos códigos de supermercado chileno para simular el disparo del lector de barras:
        </p>
        <div className="space-y-2 pt-1 text-xs font-bold">
          <button 
            onClick={() => handleManualSearch("7801234560012", 'local')} 
            className="w-full bg-stone-55 hover:bg-[#EFF4EE] p-2.5 rounded-lg border text-left flex justify-between cursor-pointer border-stone-200 transition-colors"
          >
            <span>Código: 7801234560012</span> 
            <span className="text-stone-550 font-extrabold font-sans text-[11px]">🥑 Palta Hass</span>
          </button>
          
          <button 
            onClick={() => handleManualSearch("7801234560029", 'local')} 
            className="w-full bg-stone-55 hover:bg-[#EFF4EE] p-2.5 rounded-lg border text-left flex justify-between cursor-pointer border-stone-200 transition-colors"
          >
            <span>Código: 7801234560029</span> 
            <span className="text-stone-550 font-extrabold font-sans text-[11px]">🍞 Marraqueta</span>
          </button>
          
          <button 
            onClick={() => handleManualSearch("7801122334455", 'local')} 
            className="w-full bg-stone-55 hover:bg-[#EFF4EE] p-2.5 rounded-lg border text-left flex justify-between cursor-pointer border-stone-200 transition-colors"
          >
            <span>Código: 7801122334455</span> 
            <span className="text-stone-550 font-extrabold font-sans text-[11px]">🥛 Leche Colun</span>
          </button>
        </div>
      </div>
    </div>
  );
}
