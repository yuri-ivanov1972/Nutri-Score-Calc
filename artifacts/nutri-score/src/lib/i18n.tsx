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
    protein_blocked_fats: "Protein excluded because N≥7, even with 5 FVL points.",
    fats_fvl_guidance: "For fats, oils, nuts and seeds, oils from the entire edible part of qualifying fruits, vegetables or legumes count toward FVL, including olive, avocado and soybean oils. Grapeseed oil does not qualify. Nuts and seeds do not count merely because they belong to this category. Use the actual ingredient percentage; no percentage is inferred.",
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
    protein_blocked_fats: "Eiweiß ausgeschlossen, weil N≥7, auch bei 5 OGH-Punkten.",
    fats_fvl_guidance: "Bei Fetten, Ölen, Nüssen und Samen zählen Öle aus dem gesamten essbaren Teil geeigneter Obst-, Gemüse- oder Hülsenfruchtzutaten zum OGH-Anteil, darunter Oliven-, Avocado- und Sojaöl. Traubenkernöl zählt nicht. Nüsse und Samen zählen nicht allein aufgrund ihrer Kategorie. Verwenden Sie den tatsächlichen Zutatenanteil; es wird kein Anteil automatisch abgeleitet.",
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
    protein_blocked_fats: "Protéines exclues car N≥7, même avec 5 points FLL.",
    fats_fvl_guidance: "Pour les matières grasses, huiles, fruits à coque et graines, les huiles issues de la totalité de la partie comestible des ingrédients FLL admissibles comptent, notamment les huiles d’olive, d’avocat et de soja. L’huile de pépins de raisin ne compte pas. Les fruits à coque et graines ne comptent pas du seul fait de leur catégorie. Utilisez le pourcentage réel des ingrédients ; aucun pourcentage n’est déduit automatiquement.",
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
    protein_blocked_fats: "Valk jäetakse arvestamata, sest N≥7, ka 5 PVK-punkti korral.",
    fats_fvl_guidance: "Rasvade, õlide, pähklite ja seemnete kategoorias arvestatakse sobivate puuviljade, köögiviljade ja kaunviljade kogu söödavast osast saadud õlisid, sealhulgas oliivi-, avokaado- ja sojaõli. Viinamarjaseemneõli ei arvestata. Pähkleid ja seemneid ei arvestata üksnes nende kategooriasse kuulumise tõttu. Kasutage koostisosade tegelikku protsenti; protsenti ei tuletata automaatselt.",
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
    protein_blocked_fats: "Olbaltumvielas netiek ieskaitītas, jo N≥7, arī ar 5 augļu, dārzeņu un pākšaugu punktiem.",
    fats_fvl_guidance: "Tauku, eļļu, riekstu un sēklu kategorijā ieskaita eļļas no atbilstošu augļu, dārzeņu un pākšaugu visas ēdamās daļas, tostarp olīvu, avokado un sojas eļļu. Vīnogu kauliņu eļļu neieskaita. Riekstus un sēklas neieskaita tikai tāpēc, ka tie pieder šai kategorijai. Izmantojiet faktisko sastāvdaļu procentuālo daudzumu; tas netiek noteikts automātiski.",
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
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    document.title = translations[language].app_title;
    document.documentElement.lang = language;
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
