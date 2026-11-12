import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Apple, Scale, Droplet, Check, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { 
  calculate, 
  kcalToKj, 
  kjToKcal, 
  sodiumMgToSaltG, 
  saltGToSodiumMg,
  ProductCategory,
  NutriscoreResult
} from "@/lib/nutriscore";
import { GradeBadge } from "./grade-badge";

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" ");

export function Calculator() {
  const { t } = useI18n();

  // Inputs
  const [category, setCategory] = useState<ProductCategory>("general");
  const [energyKcal, setEnergyKcal] = useState<string>("");
  const [energyKj, setEnergyKj] = useState<string>("");
  const [sugars, setSugars] = useState<string>("");
  const [satFat, setSatFat] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [fiber, setFiber] = useState<string>("");
  const [totalFat, setTotalFat] = useState<string>("");
  
  // Toggles & Modes
  const [isSodiumMode, setIsSodiumMode] = useState(false);
  const [saltOrSodium, setSaltOrSodium] = useState<string>("");
  const [fvlIndex, setFvlIndex] = useState<number>(0);
  const [hasSweeteners, setHasSweeteners] = useState(false);

  // Result
  const [result, setResult] = useState<NutriscoreResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Computed display for salt hint
  const saltHint = isSodiumMode && saltOrSodium
    ? `≈ ${(sodiumMgToSaltG(parseFloat(saltOrSodium)) || 0).toFixed(2)} g ${t("salt").toLowerCase()}`
    : null;

  // Handlers for coupled inputs
  const handleKcalChange = (val: string) => {
    setEnergyKcal(val);
    if (!val) setEnergyKj("");
    else setEnergyKj(kcalToKj(parseFloat(val)).toString());
  };

  const handleKjChange = (val: string) => {
    setEnergyKj(val);
    if (!val) setEnergyKcal("");
    else setEnergyKcal(kjToKcal(parseFloat(val)).toString());
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value as ProductCategory);
    setResult(null); // Clear result on category change
  };

  const clearForm = () => {
    setCategory("general");
    setEnergyKcal("");
    setEnergyKj("");
    setSugars("");
    setSatFat("");
    setProtein("");
    setFiber("");
    setTotalFat("");
    setSaltOrSodium("");
    setFvlIndex(0);
    setHasSweeteners(false);
    setResult(null);
  };

  const runCalculation = () => {
    // Validate required fields
    if (!energyKj || !sugars || !satFat || !protein || !saltOrSodium || (category === "fats_oils_nuts" && !totalFat)) {
      alert(t("fill_required"));
      return;
    }

    const salt_g = isSodiumMode 
      ? sodiumMgToSaltG(parseFloat(saltOrSodium)) 
      : parseFloat(saltOrSodium);

    const fvlValues = [0, 40, 60, 80];
    
    const res = calculate({
      category,
      energy_kj: parseFloat(energyKj),
      sugars_g: parseFloat(sugars),
      saturated_fat_g: parseFloat(satFat),
      salt_g,
      protein_g: parseFloat(protein),
      fiber_g: parseFloat(fiber) || 0,
      total_fat_g: parseFloat(totalFat) || 0,
      fvl_percent: fvlValues[fvlIndex],
      has_sweeteners: hasSweeteners
    });

    setResult(res);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const FVL_OPTIONS = [
    { label: t("fvl_0"), val: 0 },
    { label: t("fvl_40"), val: 1 },
    { label: t("fvl_60"), val: 2 },
    { label: t("fvl_80"), val: 3 },
  ];

  return (
    <div className="w-full max-w-lg mx-auto pb-24">
      <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden mb-8 transition-all">
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="cat-select" className="text-sm font-semibold text-foreground flex justify-between">
              {t("category_label")}
              <span className="text-muted-foreground text-xs">{t("per_100")}</span>
            </label>
            <select 
              id="cat-select"
              value={category}
              onChange={handleCategoryChange}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border text-foreground hover:border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none font-medium"
            >
              <option value="general">{t("cat_general")}</option>
              <option value="beverage">{t("cat_beverage")}</option>
              <option value="cheese">{t("cat_cheese")}</option>
              <option value="red_meat">{t("cat_red_meat")}</option>
              <option value="fats_oils_nuts">{t("cat_fats_oils_nuts")}</option>
            </select>
          </div>

          {/* Energy */}
          <div className="space-y-2 pt-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> {t("energy")}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <input 
                  aria-label={`${t("energy")} (kcal)`}
                  type="number" min="0" step="1"
                  value={energyKcal}
                  onChange={(e) => handleKcalChange(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">kcal</span>
              </div>
              <div className="relative">
                <input 
                  aria-label={`${t("energy")} (kJ)`}
                  type="number" min="0" step="1"
                  value={energyKj}
                  onChange={(e) => handleKjChange(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">kJ</span>
              </div>
            </div>
          </div>

          {/* Grid for standard nutrients */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label htmlFor="input-sugars" className="text-sm font-semibold text-foreground">{t("sugars")} (g)</label>
              <input 
                id="input-sugars"
                type="number" min="0" step="0.1" value={sugars} onChange={e => setSugars(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                placeholder="0.0"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="input-satfat" className="text-sm font-semibold text-foreground">{t("saturated_fat")} (g)</label>
              <input 
                id="input-satfat"
                type="number" min="0" step="0.1" value={satFat} onChange={e => setSatFat(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                placeholder="0.0"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  {isSodiumMode ? `${t("sodium")} (mg)` : `${t("salt")} (g)`}
                </label>
                <button 
                  onClick={() => {
                    setIsSodiumMode(!isSodiumMode);
                    setSaltOrSodium("");
                  }}
                  className="text-xs text-primary font-medium hover:underline focus:outline-none"
                >
                  {isSodiumMode ? `Use ${t("salt")}` : `Use ${t("sodium")}`}
                </button>
              </div>
              <input 
                aria-label={isSodiumMode ? `${t("sodium")} (mg)` : `${t("salt")} (g)`}
                type="number" min="0" step="0.01" value={saltOrSodium} onChange={e => setSaltOrSodium(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                placeholder="0.0"
              />
              {saltHint && <p className="text-xs text-muted-foreground pl-1">{saltHint}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="input-protein" className="text-sm font-semibold text-foreground">{t("protein")} (g)</label>
              <input 
                id="input-protein"
                type="number" min="0" step="0.1" value={protein} onChange={e => setProtein(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                placeholder="0.0"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="input-fiber" className="text-sm font-semibold text-foreground">{t("fiber")} (g)</label>
              <input 
                id="input-fiber"
                type="number" min="0" step="0.1" value={fiber} onChange={e => setFiber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                placeholder="0.0"
              />
            </div>

            {category === "fats_oils_nuts" && (
              <div className="space-y-2">
                <label htmlFor="input-totalfat" className="text-sm font-semibold text-foreground">{t("total_fat")} (g)</label>
                <input 
                  id="input-totalfat"
                  type="number" min="0" step="0.1" value={totalFat} onChange={e => setTotalFat(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  placeholder="0.0"
                />
              </div>
            )}
          </div>

          {/* FVL */}
          <div className="space-y-3 pt-4 border-t border-border">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Apple className="w-4 h-4 text-green-500" /> {t("fvl")}
            </label>
            {category === "fats_oils_nuts" && (
              <p className="text-xs text-muted-foreground" id="fats-fvl-guidance">
                {t("fats_fvl_guidance")}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FVL_OPTIONS.map((opt, i) => (
                <button
                  key={i}
                  aria-describedby={category === "fats_oils_nuts" ? "fats-fvl-guidance" : undefined}
                  onClick={() => setFvlIndex(i)}
                  className={cn(
                    "py-2 px-1 text-xs sm:text-sm font-medium rounded-lg transition-all border-2",
                    fvlIndex === i 
                      ? "bg-primary/10 border-primary text-primary shadow-sm" 
                      : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:bg-background/80"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sweeteners (Beverages only) */}
          {category === "beverage" && (
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="peer sr-only" 
                  checked={hasSweeteners} 
                  onChange={(e) => setHasSweeteners(e.target.checked)} 
                />
                <div className={cn(
                  "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                  hasSweeteners ? "bg-primary border-primary" : "border-border bg-background group-hover:border-primary/50"
                )}>
                  {hasSweeteners && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm font-medium text-foreground select-none">{t("contains_sweeteners")}</span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="pt-6 flex gap-4">
            <button 
              onClick={clearForm}
              aria-label="Reset form"
              className="px-4 py-3 rounded-xl font-semibold text-muted-foreground bg-secondary hover:bg-secondary/80 hover:text-foreground transition-colors flex items-center gap-2 no-default-active-elevate active:scale-95"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
            </button>
            <button 
              onClick={runCalculation}
              className="flex-1 px-6 py-3 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              {t("calculate")}
            </button>
          </div>

        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div 
            ref={resultRef}
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl shadow-xl border-2 border-primary/20 overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-border bg-primary/5 flex flex-col items-center justify-center space-y-6">
                <GradeBadge grade={result.grade} />
                <div className="text-center">
                  <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-1">{t("score")}</h3>
                  <div className="text-5xl font-black font-display text-foreground" style={{ color: result.hex }}>
                    {result.score}
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-background">
                <h4 className="font-bold text-lg mb-4">{t("score")} Breakdown</h4>
                
                <div className="space-y-6">
                  {/* Negative Points */}
                  <div>
                    <div className="flex justify-between font-semibold text-destructive mb-2 pb-2 border-b border-destructive/20">
                      <span>{t("negative_points")} (N)</span>
                      <span>{result.components.total_negative} {t("pts")}</span>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex justify-between"><span>{t("energy")}</span> <span>{result.components.energy_pts}</span></li>
                      <li className="flex justify-between"><span>{t("sugars")}</span> <span>{result.components.sugars_pts}</span></li>
                      <li className="flex justify-between"><span>{t("saturated_fat")}</span> <span>{result.components.saturated_fat_pts}</span></li>
                      <li className="flex justify-between"><span>{t("salt")}</span> <span>{result.components.salt_pts}</span></li>
                      {result.has_sweeteners && (
                        <li className="flex justify-between"><span>Sweeteners</span> <span>{result.components.sweetener_pts}</span></li>
                      )}
                    </ul>
                  </div>

                  {/* Positive Points */}
                  <div>
                    <div className="flex justify-between font-semibold text-primary mb-2 pb-2 border-b border-primary/20">
                      <span>{t("positive_points")} (P)</span>
                      <span>{result.components.total_positive} {t("pts")}</span>
                    </div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex justify-between">
                        <span>{t("protein")}</span> 
                        <span>{result.components.effective_protein_pts}</span>
                      </li>
                      <li className="flex justify-between"><span>{t("fiber")}</span> <span>{result.components.fiber_pts}</span></li>
                      <li className="flex justify-between"><span>{t("fvl")}</span> <span>{result.components.fvl_pts}</span></li>
                    </ul>
                    {result.components.protein_blocked && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 bg-orange-500/10 p-2 rounded-md font-medium border border-orange-500/20">
                        {t(result.category === "fats_oils_nuts" ? "protein_blocked_fats" : "protein_blocked")}
                      </p>
                    )}
                  </div>

                  {/* Formula */}
                  <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between text-sm font-bold text-foreground">
                    <span>Formula (N - P)</span>
                    <span className="font-mono text-base bg-background px-3 py-1 rounded-md shadow-sm border border-border">
                      {result.components.total_negative} - {result.components.total_positive} = {result.score}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
