import React from "react";
import { useI18n, Language } from "@/lib/i18n";
import { Calculator } from "@/components/calculator";
export default function Home() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Nutri-Score" className="h-[72px] w-auto" />
            <h1 className="font-display font-bold text-xl text-foreground tracking-tight leading-tight m-0">
              {t("calculator")}
            </h1>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            aria-label="Language"
            className="bg-secondary text-secondary-foreground text-sm font-semibold py-1.5 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer appearance-none hover:bg-secondary/80 transition-colors"
          >
            <option value="en">EN</option>
            <option value="de">DE</option>
            <option value="fr">FR</option>
            <option value="lv">LV</option>
            <option value="et">ET</option>
          </select>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 sm:py-12">
        <Calculator />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-4">
        <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>The calculator is created by ABCDE Open Food Data Lab</span>
          <a
            href="https://world.openfoodfacts.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            world.openfoodfacts.org
          </a>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-5 text-xs text-muted-foreground leading-relaxed">
          Calculate Nutri-Score 2.0 (2024) free online. Enter your product's nutrition values —
          energy, sugars, saturated fat, salt, protein, and fibre — and instantly receive a grade
          from A (best quality) to E (worst quality). Supports all categories:
          general foods, beverages, cheese, red meat, and fats &amp; oils.
        </div>
      </footer>
    </div>
  );
}
