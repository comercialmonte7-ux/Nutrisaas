import React from 'react';
import { ListChecks, Sliders, ShoppingCart } from 'lucide-react';

export interface RecipesViewProps {
  CHILEAN_RECIPES: any[];
  selectedRecipes: string[];
  toggleRecipeSelection: (recipeId: string) => void;
  pantryInventory: Record<string, number>;
  handleUpdatePantry: (key: string, val: number) => void;
  shoppingListResult: any[];
  shoppingCheckedItems: Record<string, boolean>;
  setShoppingCheckedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export default function RecipesView({
  CHILEAN_RECIPES,
  selectedRecipes,
  toggleRecipeSelection,
  pantryInventory,
  handleUpdatePantry,
  shoppingListResult,
  shoppingCheckedItems,
  setShoppingCheckedItems
}: RecipesViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="recipes_view_container">
      {/* Recipe Checklist selector */}
      <div className="lg:col-span-6 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold flex items-center gap-2 border-b pb-3">
          <ListChecks className="h-5 w-5 text-[#5A7C56]" /> Recetario & Planificador Semanal
        </h3>
        <p className="text-xs text-stone-500">Selecciona los platos del menú de la semana para compilar la lista de compras del mercado:</p>
        <div className="space-y-2">
          {CHILEAN_RECIPES.map(recipe => {
            const active = selectedRecipes.includes(recipe.id);
            return (
              <div 
                key={recipe.id} 
                onClick={() => toggleRecipeSelection(recipe.id)} 
                className={`p-3.5 rounded-xl border cursor-pointer transition text-xs ${active ? 'bg-[#EEF4EE] border-emerald-500' : 'bg-stone-50'}`}
                id={`recipe_selector_${recipe.id}`}
              >
                <div className="flex justify-between font-bold">
                  <span>{recipe.name}</span>
                  <span className="text-xs text-[#5A7C56] font-extrabold">{active ? '✓ Activo' : '+ Agregar'}</span>
                </div>
                <p className="text-[10px] text-stone-400 mt-1 italic">{recipe.description}</p>
                <p className="text-[10px] font-mono font-bold mt-1 text-[#5A7C56]">
                  {recipe.calories} kcal | P: {recipe.protein_g}g | C: {recipe.carbs_g}g | G: {recipe.fat_g}g
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-6 space-y-6">
        {/* Local Pantry Inventory Inputs */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4" id="pantry_inputs_panel">
          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <Sliders className="h-4.5 w-4.5 text-[#5A7C56]" /> Definir Despensa Local (g disponibles)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "🥑 Palta (g)", k: "palta" },
              { label: "🍚 Arroz (g)", k: "arroz" },
              { label: "🧅 Cebolla (g)", k: "cebolla" },
              { label: "🥩 Lomo (g)", k: "lomo" }
            ].map(it => (
              <div key={it.k} className="bg-[#FAF8F5] p-2 border rounded-lg text-center">
                <span className="text-[10px] font-bold text-stone-500 block">{it.label}</span>
                <input 
                  type="number" 
                  value={pantryInventory[it.k] || 0} 
                  onChange={e => handleUpdatePantry(it.k, parseInt(e.target.value) || 0)} 
                  className="w-full text-center border bg-white p-1 text-xs font-bold rounded mt-1" 
                  id={`pantry_input_${it.k}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic compiled Shopping Checklist */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3" id="shopping_list_panel">
          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingCart className="h-4.2 w-4.2 text-[#5A7C56]" /> Lista de Compras Dinámica
          </h4>
          {shoppingListResult.length === 0 ? (
            <p className="text-xs text-stone-500 py-3 italic">Selecciona comidas en tu Menú a la izquierda.</p>
          ) : (
            <div className="space-y-3 font-medium text-xs">
              {['Vegetales y Frutas', 'Carnes y Proteínas', 'Lácteos', 'Despensa'].map(cat => {
                const items = shoppingListResult.filter(i => i.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1">
                    <p className="text-[10px] font-extrabold text-[#5A7C56] uppercase">{cat}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {items.map((it, idx) => (
                        <div key={idx} className="bg-stone-50 p-2 rounded-lg border flex justify-between items-center text-[11px]" id={`shopping_item_${it.name}`}>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={shoppingCheckedItems[it.name] || false} 
                              onChange={e => setShoppingCheckedItems(p => ({ ...p, [it.name]: e.target.checked }))} 
                              className="rounded text-[#5A7C56] focus:ring-[#5A7C56]" 
                            />
                            <span className={shoppingCheckedItems[it.name] ? 'line-through text-stone-400 font-normal' : 'font-semibold'}>
                              {it.name}
                            </span>
                          </label>
                          <span className="font-extrabold font-mono text-stone-700">{it.quantity} {it.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
