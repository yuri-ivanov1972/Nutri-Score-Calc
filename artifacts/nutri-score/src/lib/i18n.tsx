import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "de" | "fr" | "lv" | "et";

type TranslationDictionary = {
  [key: string]: string;
};

const translations: Record<Language, TranslationDictionary> = {
  en: {
    app_title: "Nutri-Score Calculator",
    category_label: "Product Category",
    cat_general: "General (snacks, meals, bread)",
    cat_beverage: "Beverages",
    cat_cheese: "Cheese",
    cat_red_meat: "Red Meat",
    cat_fats_oils_nuts: "Fats, Oils & Nuts",
    energy: "Energy",
    salt: "Salt",
    sodium: "Sodium",
    sugars: "Sugars",
    saturated_fat: "Saturated Fat",
    protein: "Protein",
    fiber: "Dietary Fiber",
    total_fat: "Total Fat",
    fvl: "Fruits, Vegetables, Legumes",
    fvl_0: "None (0%)",
    fvl_40: "> 40%",
    fvl_60: "> 60%",
    fvl_80: "> 80%",
    contains_sweeteners: "Contains artificial sweeteners",
    calculate: "Calculate Score",
    clear: "Clear",
    score: "Score",
    negative_points: "Negative Points",
    positive_points: "Positive Points",
    protein_blocked: "Protein blocked (N≥11 and low FVL)",
    fill_required: "Please fill all required fields",
    per_100: "per 100g / 100ml",
    pts: "pts",
    calculator: "Calculator",
  },
  de: {
    app_title: "Nutri-Score Rechner",
    category_label: "Produktkategorie",
    cat_general: "Allgemein (Snacks, Brot, Mahlzeiten)",
    cat_beverage: "Getränke",
    cat_cheese: "Käse",
    cat_red_meat: "Rotes Fleisch",
    cat_fats_oils_nuts: "Fette, Öle & Nüsse",
    energy: "Energie",
    salt: "Salz",
    sodium: "Natrium",
    sugars: "Zucker",
    saturated_fat: "Gesättigte Fettsäuren",
    protein: "Eiweiß",
    fiber: "Ballaststoffe",
    total_fat: "Gesamtfett",
    fvl: "Obst, Gemüse, Hülsenfrüchte",
    fvl_0: "Keine (0%)",
    fvl_40: "> 40%",
    fvl_60: "> 60%",
    fvl_80: "> 80%",
    contains_sweeteners: "Enthält künstliche Süßstoffe",
    calculate: "Score Berechnen",
    clear: "Löschen",
    score: "Punktzahl",
    negative_points: "Negative Punkte",
    positive_points: "Positive Punkte",
    protein_blocked: "Eiweiß blockiert (N≥11 und wenig OGH)",
    fill_required: "Bitte alle Pflichtfelder ausfüllen",
    per_100: "pro 100g / 100ml",
    pts: "Pkt",
    calculator: "Rechner",
  },
  fr: {
    app_title: "Calculateur Nutri-Score",
    category_label: "Catégorie de produit",
    cat_general: "Général (snacks, repas, pain)",
    cat_beverage: "Boissons",
    cat_cheese: "Fromages",
    cat_red_meat: "Viande rouge",
    cat_fats_oils_nuts: "Matières grasses et noix",
    energy: "Énergie",
    salt: "Sel",
    sodium: "Sodium",
    sugars: "Sucres",
    saturated_fat: "Acides gras saturés",
    protein: "Protéines",
    fiber: "Fibres alimentaires",
    total_fat: "Lipides totaux",
    fvl: "Fruits, Légumes, Légumineuses",
    fvl_0: "Aucun (0%)",
    fvl_40: "> 40%",
    fvl_60: "> 60%",
    fvl_80: "> 80%",
    contains_sweeteners: "Contient des édulcorants",
    calculate: "Calculer le score",
    clear: "Effacer",
    score: "Score",
    negative_points: "Points Négatifs",
    positive_points: "Points Positifs",
    protein_blocked: "Protéines ignorées (N≥11 et FLL faibles)",
    fill_required: "Veuillez remplir tous les champs requis",
    per_100: "pour 100g / 100ml",
    pts: "pts",
    calculator: "Calculateur",
  },
  et: {
    app_title: "Nutri-Score Kalkulaator",
    category_label: "Tootekategooria",
    cat_general: "Üldine (suupisted, toidud, leib)",
    cat_beverage: "Joogid",
    cat_cheese: "Juust",
    cat_red_meat: "Punane liha",
    cat_fats_oils_nuts: "Rasvad, õlid ja pähklid",
    energy: "Energia",
    salt: "Sool",
    sodium: "Naatrium",
    sugars: "Suhkrud",
    saturated_fat: "Küllastunud rasvhapped",
    protein: "Valk",
    fiber: "Toidukiud",
    total_fat: "Kogu rasv",
    fvl: "Puuviljad, köögiviljad, kaunviljad",
    fvl_0: "Puudub (0%)",
    fvl_40: "> 40%",
    fvl_60: "> 60%",
    fvl_80: "> 80%",
    contains_sweeteners: "Sisaldab kunstlikke magusaineid",
    calculate: "Arvuta skoor",
    clear: "Tühjenda",
    score: "Skoor",
    negative_points: "Negatiivsed punktid",
    positive_points: "Positiivsed punktid",
    protein_blocked: "Valk blokeeritud (N≥11 ja vähe PVK)",
    fill_required: "Palun täitke kõik kohustuslikud väljad",
    per_100: "100g / 100ml kohta",
    pts: "p",
    calculator: "Kalkulaator",
  },
  lv: {
    app_title: "Nutri-Score Kalkulators",
    category_label: "Produkta kategorija",
    cat_general: "Vispārīgi (uzkodas, maltītes, maize)",
    cat_beverage: "Dzērieni",
    cat_cheese: "Siers",
    cat_red_meat: "Sarkanā gaļa",
    cat_fats_oils_nuts: "Tauki, eļļas un rieksti",
    energy: "Enerģija",
    salt: "Sāls",
    sodium: "Nātrijs",
    sugars: "Cukuri",
    saturated_fat: "Piesātinātie tauki",
    protein: "Olbaltumvielas",
    fiber: "Šķiedrvielas",
    total_fat: "Kopējie tauki",
    fvl: "Augļi, Dārzeņi, Pākšaugi",
    fvl_0: "Nekas (0%)",
    fvl_40: "> 40%",
    fvl_60: "> 60%",
    fvl_80: "> 80%",
    contains_sweeteners: "Satur mākslīgos saldinātājus",
    calculate: "Aprēķināt",
    clear: "Notīrīt",
    score: "Rezultāts",
    negative_points: "Negatīvie punkti",
    positive_points: "Pozitīvie punkti",
    protein_blocked: "Olbaltumvielas bloķētas (N≥11 un maz augļu)",
    fill_required: "Lūdzu, aizpildiet visus obligātos laukus",
    per_100: "uz 100g / 100ml",
    pts: "p",
    calculator: "Kalkulators",
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("de");

  useEffect(() => {
    document.title = translations[language].app_title;
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
