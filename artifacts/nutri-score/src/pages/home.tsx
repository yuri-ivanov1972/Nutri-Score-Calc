import React from "react";
import { useI18n, Language } from "@/lib/i18n";
import { Calculator } from "@/components/calculator";
import { Leaf } from "lucide-react";

export default function Home() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#80C41C] flex items-center justify-center shadow-inner">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-display font-bold text-lg sm:text-xl text-foreground tracking-tight">
              Nutri-Score
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-secondary text-secondary-foreground text-sm font-semibold py-1.5 px-3 rounded-lg border-none focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none hover:bg-secondary/80 transition-colors"
            >
              <option value="en">EN</option>
              <option value="de">DE</option>
              <option value="fr">FR</option>
              <option value="lv">LV</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8 sm:py-12 relative">
        {/* Decorative background blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-[100%] blur-[80px] -z-10 pointer-events-none" />
        
        <Calculator />
      </main>
    </div>
  );
}
