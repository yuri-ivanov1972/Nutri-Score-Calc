export type ProductCategory =
  | "general"
  | "beverage"
  | "cheese"
  | "red_meat"
  | "fats_oils_nuts";

export interface NutriscoreInput {
  category: ProductCategory;
  energy_kj: number;
  sugars_g: number;
  saturated_fat_g: number;
  salt_g: number;
  protein_g: number;
  fiber_g?: number;
  total_fat_g?: number;
  fvl_percent?: number;
  has_sweeteners?: boolean;
}

export interface NutriscoreComponents {
  energy_pts: number;
  sugars_pts: number;
  saturated_fat_pts: number;
  salt_pts: number;
  sweetener_pts: number;
  total_negative: number;
  protein_pts: number;
  effective_protein_pts: number;
  fiber_pts: number;
  fvl_pts: number;
  total_positive: number;
  protein_blocked: boolean;
  protein_status: string;
}

export interface NutriscoreResult {
  grade: "A" | "B" | "C" | "D" | "E";
  score: number;
  category: ProductCategory;
  components: NutriscoreComponents;
  has_sweeteners: boolean;
  fvl_percent: number;
  color: string;
  hex: string;
}

// --- Negative scoring thresholds ---
const T_ENERGY_GEN = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
const T_SUGARS_GEN = [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51];
const T_SATFAT_GEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const T_SALT_GEN = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0];

const T_ENERGY_BEV = [30, 90, 150, 210, 240, 270, 300, 330, 360, 390];
const T_SUGARS_BEV = [0.5, 2, 3.5, 5, 6, 7, 8, 9, 10, 11];

const T_SATFAT_FAT_ENERGY = [120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200];
const T_SATFAT_RATIO = [10, 16, 22, 28, 34, 40, 46, 52, 58, 64];

// --- Positive scoring thresholds ---
const T_FIBER_GEN = [3.0, 4.1, 5.2, 6.3, 7.4];
const T_PROTEIN_GEN = [2.4, 4.8, 7.2, 9.6, 12, 14, 17];
const T_FVL_GEN = [40, 60, 80];

const T_FIBER_BEV = [3, 4.1, 5.2, 6.3, 7.4];
const T_PROTEIN_BEV = [1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0];
const T_FVL_BEV = [40, 60, 80];

function pts(value: number, thresholds: number[]): number {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) return i;
  }
  return thresholds.length;
}

// Compare the input decimals exactly, including scientific notation. Division
// (and even binary floating-point multiplication) can round a boundary down.
function decimalFraction(value: number): [bigint, bigint] {
  const [mantissa, exponent = "0"] = String(value).toLowerCase().split("e");
  const decimals = mantissa.split(".")[1]?.length ?? 0;
  const scale = decimals - Number(exponent);
  const coefficient = BigInt(mantissa.replace(".", ""));
  return scale >= 0
    ? [coefficient, 10n ** BigInt(scale)]
    : [coefficient * 10n ** BigInt(-scale), 1n];
}

function fatRatioPoints(saturated: number, total?: number): number {
  if (!total || total <= 0) return 0;
  const [satNumerator, satDenominator] = decimalFraction(saturated);
  const [fatNumerator, fatDenominator] = decimalFraction(total);
  // Table 7 uses strict upper bounds, unlike the other nutrient tables.
  return T_SATFAT_RATIO.filter(threshold =>
    satNumerator * 100n * fatDenominator >=
    BigInt(threshold) * fatNumerator * satDenominator
  ).length;
}

const GRADE_COLOR_MAP: Record<string, { color: string; hex: string }> = {
  A: { color: "dark-green", hex: "#1E7E34" },
  B: { color: "light-green", hex: "#80C41C" },
  C: { color: "yellow", hex: "#F5C518" },
  D: { color: "orange", hex: "#E87722" },
  E: { color: "red", hex: "#D32F2F" },
};

export function calculate(input: NutriscoreInput): NutriscoreResult {
  const {
    category,
    energy_kj,
    sugars_g,
    saturated_fat_g,
    salt_g,
    protein_g,
    fiber_g = 0,
    total_fat_g,
    fvl_percent = 0,
    has_sweeteners = false,
  } = input;

  const c: NutriscoreComponents = {
    energy_pts: 0,
    sugars_pts: 0,
    saturated_fat_pts: 0,
    salt_pts: 0,
    sweetener_pts: 0,
    total_negative: 0,
    protein_pts: 0,
    effective_protein_pts: 0,
    fiber_pts: 0,
    fvl_pts: 0,
    total_positive: 0,
    protein_blocked: false,
    protein_status: "included",
  };

  // --- Negative points ---
  if (category === "beverage") {
    c.energy_pts = pts(energy_kj, T_ENERGY_BEV);
    c.sugars_pts = pts(sugars_g, T_SUGARS_BEV);
    c.saturated_fat_pts = pts(saturated_fat_g, T_SATFAT_GEN);
    c.salt_pts = pts(salt_g, T_SALT_GEN);
    c.sweetener_pts = has_sweeteners ? 4 : 0;
    c.total_negative =
      c.energy_pts + c.sugars_pts + c.saturated_fat_pts + c.salt_pts + c.sweetener_pts;
  } else if (category === "fats_oils_nuts") {
    const energyFromSat = saturated_fat_g * 37;
    c.energy_pts = pts(energyFromSat, T_SATFAT_FAT_ENERGY);
    c.saturated_fat_pts = fatRatioPoints(saturated_fat_g, total_fat_g);
    c.sugars_pts = pts(sugars_g, T_SUGARS_GEN);
    c.salt_pts = pts(salt_g, T_SALT_GEN);
    c.total_negative = c.energy_pts + c.sugars_pts + c.saturated_fat_pts + c.salt_pts;
  } else {
    c.energy_pts = pts(energy_kj, T_ENERGY_GEN);
    c.sugars_pts = pts(sugars_g, T_SUGARS_GEN);
    c.saturated_fat_pts = pts(saturated_fat_g, T_SATFAT_GEN);
    c.salt_pts = pts(salt_g, T_SALT_GEN);
    c.total_negative = c.energy_pts + c.sugars_pts + c.saturated_fat_pts + c.salt_pts;
  }

  // --- Positive points ---
  if (category === "beverage") {
    c.protein_pts = pts(protein_g, T_PROTEIN_BEV);
    c.fiber_pts = pts(fiber_g, T_FIBER_BEV);
    const fvlRaw = pts(fvl_percent, T_FVL_BEV);
    c.fvl_pts = ([0, 2, 4, 6] as const)[Math.min(fvlRaw, 3)];
  } else if (category === "fats_oils_nuts") {
    c.protein_pts = pts(protein_g, T_PROTEIN_GEN);
    c.fiber_pts = pts(fiber_g, T_FIBER_GEN);
    const fvlRaw = pts(fvl_percent, T_FVL_GEN);
    c.fvl_pts = fvlRaw === 3 ? 5 : fvlRaw;
  } else {
    const proteinRaw = pts(protein_g, T_PROTEIN_GEN);
    if (category === "red_meat") {
      c.protein_pts = Math.min(proteinRaw, 2);
      c.protein_status =
        proteinRaw > 2 ? `capped at 2 (raw was ${proteinRaw})` : "included";
    } else {
      c.protein_pts = proteinRaw;
    }
    c.fiber_pts = pts(fiber_g, T_FIBER_GEN);
    const fvlRaw = pts(fvl_percent, T_FVL_GEN);
    c.fvl_pts = fvlRaw === 3 ? 5 : fvlRaw;
  }

  // --- Category-specific protein blocking rules ---
  let score: number;
  if (category === "beverage") {
    // Special: water / plain drinks automatic A
    if (energy_kj === 0 && sugars_g === 0 && !has_sweeteners) {
      c.effective_protein_pts = c.protein_pts;
      c.total_positive = c.protein_pts + c.fiber_pts + c.fvl_pts;
      return { grade: "A", score: 0, category, components: c, has_sweeteners, fvl_percent, ...GRADE_COLOR_MAP["A"] };
    }
    c.total_positive = c.protein_pts + c.fiber_pts + c.fvl_pts;
    score = c.total_negative - c.total_positive;
  } else if (category === "fats_oils_nuts") {
    c.protein_blocked = c.total_negative >= 7;
    if (c.protein_blocked) c.protein_status = "blocked (N≥7, regardless of FVL)";
    c.total_positive = c.fiber_pts + c.fvl_pts + (c.protein_blocked ? 0 : c.protein_pts);
    score = c.total_negative - c.total_positive;
  } else if (category === "general" || category === "red_meat") {
    if (c.total_negative >= 11 && c.fvl_pts < 5) {
      c.protein_blocked = true;
      c.protein_status = c.protein_status === "included" ? "blocked (N≥11 and FVL<5)" : c.protein_status + " + blocked";
      c.total_positive = c.fiber_pts + c.fvl_pts;
    } else {
      c.total_positive = c.protein_pts + c.fiber_pts + c.fvl_pts;
    }
    score = c.total_negative - c.total_positive;
  } else {
    c.total_positive = c.protein_pts + c.fiber_pts + c.fvl_pts;
    score = c.total_negative - c.total_positive;
  }
  c.effective_protein_pts = c.protein_blocked ? 0 : c.protein_pts;

  // --- Grade thresholds ---
  let grade: "A" | "B" | "C" | "D" | "E";
  if (category === "beverage") {
    if (score <= 2) grade = "B";
    else if (score <= 6) grade = "C";
    else if (score <= 9) grade = "D";
    else grade = "E";
  } else if (category === "fats_oils_nuts") {
    if (score <= -6) grade = "A";
    else if (score <= 2) grade = "B";
    else if (score <= 10) grade = "C";
    else if (score <= 18) grade = "D";
    else grade = "E";
  } else {
    if (category === "general" ? score < 1 : score <= -1) grade = "A";
    else if (score <= 2) grade = "B";
    else if (score <= 10) grade = "C";
    else if (score <= 18) grade = "D";
    else grade = "E";
  }

  return {
    grade,
    score,
    category,
    components: c,
    has_sweeteners,
    fvl_percent,
    ...GRADE_COLOR_MAP[grade],
  };
}

export function kcalToKj(kcal: number): number {
  return Math.round(kcal * 4.184);
}

export function kjToKcal(kj: number): number {
  return Math.round(kj / 4.184);
}

export function sodiumMgToSaltG(sodiumMg: number): number {
  return (sodiumMg * 2.5) / 1000;
}

export function saltGToSodiumMg(saltG: number): number {
  return (saltG / 2.5) * 1000;
}
