"""
Nutri-Score 2.0 (2024) Calculator
==================================
Standalone reference implementation of the Nutri-Score 2024 algorithm.
Covers all 5 product categories. No third-party dependencies required.

Categories
----------
- general       : Snacks, bread, meals, dairy (except cheese), etc.
- beverage      : All drinks (water, juice, soft drinks, milk, etc.)
- cheese        : All cheeses
- red_meat      : Red and processed meats
- fats_oils_nuts: Oils, butter, margarine, nuts, seeds

All nutrient values are per 100 g (solid) or per 100 ml (liquid).

Usage
-----
    python nutriscore.py            # runs built-in examples
    import nutriscore; nutriscore.calculate(input)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional
from fractions import Fraction

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

ProductCategory = Literal["general", "beverage", "cheese", "red_meat", "fats_oils_nuts"]


@dataclass
class NutriscoreInput:
    """Nutrition data for a single product (all values per 100 g / 100 ml)."""

    category: ProductCategory
    energy_kj: float
    sugars_g: float
    saturated_fat_g: float
    salt_g: float
    protein_g: float
    fiber_g: float = 0.0
    total_fat_g: Optional[float] = None   # required for fats_oils_nuts
    fvl_percent: float = 0.0              # Fruits / Vegetables / Legumes %
    has_sweeteners: bool = False          # beverages only


@dataclass
class NutriscoreComponents:
    """Point breakdown for each nutrient component."""

    energy_pts: int = 0
    sugars_pts: int = 0
    saturated_fat_pts: int = 0
    salt_pts: int = 0
    sweetener_pts: int = 0
    total_negative: int = 0

    protein_pts: int = 0
    effective_protein_pts: int = 0
    fiber_pts: int = 0
    fvl_pts: int = 0
    total_positive: int = 0

    protein_blocked: bool = False
    protein_status: str = "included"


@dataclass
class NutriscoreResult:
    """Full result returned by calculate()."""

    grade: Literal["A", "B", "C", "D", "E"]
    score: int
    category: ProductCategory
    components: NutriscoreComponents
    has_sweeteners: bool
    fvl_percent: float
    color: str   # descriptive color name
    hex: str     # CSS hex color


# ---------------------------------------------------------------------------
# Threshold tables  (source: Nutri-Score 2024 official specification)
# ---------------------------------------------------------------------------

# --- Negative (N) thresholds ------------------------------------------------

T_ENERGY_GEN     = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]
T_SUGARS_GEN     = [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51]
T_SATFAT_GEN     = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
T_SALT_GEN       = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0,
                    2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0]

T_ENERGY_BEV     = [30, 90, 150, 210, 240, 270, 300, 330, 360, 390]
T_SUGARS_BEV     = [0.5, 2, 3.5, 5, 6, 7, 8, 9, 10, 11]

# Fats/oils/nuts use saturated-fat energy and saturated/total-fat ratio
T_SATFAT_FAT_ENERGY = [120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200]
T_SATFAT_RATIO      = [10, 16, 22, 28, 34, 40, 46, 52, 58, 64]

# --- Positive (P) thresholds ------------------------------------------------

T_FIBER_GEN      = [3.0, 4.1, 5.2, 6.3, 7.4]
T_PROTEIN_GEN    = [2.4, 4.8, 7.2, 9.6, 12, 14, 17]
T_FVL_GEN        = [40, 60, 80]

T_FIBER_BEV      = [3.0, 4.1, 5.2, 6.3, 7.4]
T_PROTEIN_BEV    = [1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0]
T_FVL_BEV        = [40, 60, 80]

# Grade-color mapping
_GRADE_COLORS = {
    "A": ("dark-green",  "#1E7E34"),
    "B": ("light-green", "#80C41C"),
    "C": ("yellow",      "#F5C518"),
    "D": ("orange",      "#E87722"),
    "E": ("red",         "#D32F2F"),
}


# ---------------------------------------------------------------------------
# Core helpers
# ---------------------------------------------------------------------------

def _pts(value: float, thresholds: list) -> int:
    """Return the point score for *value* given a list of upper-bound thresholds.

    Returns 0 if value ≤ thresholds[0], up to len(thresholds) if value exceeds
    every threshold — matching the TypeScript reference exactly.
    """
    for i, t in enumerate(thresholds):
        if value <= t:
            return i
    return len(thresholds)


def _fat_ratio_points(saturated: float, total: Optional[float]) -> int:
    """Table 7 strict bounds; compare input decimals without division rounding."""
    if not total or total <= 0:
        return 0
    return sum(
        Fraction(str(saturated)) * 100 >= threshold * Fraction(str(total))
        for threshold in T_SATFAT_RATIO
    )


# ---------------------------------------------------------------------------
# Main calculation
# ---------------------------------------------------------------------------

def calculate(inp: NutriscoreInput) -> NutriscoreResult:
    """Compute Nutri-Score 2024 for the given product.

    Parameters
    ----------
    inp : NutriscoreInput
        Nutrient values per 100 g / 100 ml.

    Returns
    -------
    NutriscoreResult
        Grade (A–E), numeric score, component breakdown, and display metadata.
    """
    cat = inp.category
    c = NutriscoreComponents()

    # -----------------------------------------------------------------------
    # Negative points
    # -----------------------------------------------------------------------
    if cat == "beverage":
        c.energy_pts       = _pts(inp.energy_kj,       T_ENERGY_BEV)
        c.sugars_pts       = _pts(inp.sugars_g,        T_SUGARS_BEV)
        c.saturated_fat_pts = _pts(inp.saturated_fat_g, T_SATFAT_GEN)
        c.salt_pts         = _pts(inp.salt_g,          T_SALT_GEN)
        c.sweetener_pts    = 4 if inp.has_sweeteners else 0
        c.total_negative   = (c.energy_pts + c.sugars_pts
                               + c.saturated_fat_pts + c.salt_pts
                               + c.sweetener_pts)

    elif cat == "fats_oils_nuts":
        # Energy component = energy from saturated fat (1 g fat ≈ 37 kJ)
        energy_from_sat    = inp.saturated_fat_g * 37
        c.energy_pts       = _pts(energy_from_sat, T_SATFAT_FAT_ENERGY)
        # Saturated-fat component = saturated/total fat ratio (%)
        c.saturated_fat_pts = _fat_ratio_points(inp.saturated_fat_g, inp.total_fat_g)
        c.sugars_pts        = _pts(inp.sugars_g,  T_SUGARS_GEN)
        c.salt_pts          = _pts(inp.salt_g,    T_SALT_GEN)
        c.total_negative    = (c.energy_pts + c.sugars_pts
                                + c.saturated_fat_pts + c.salt_pts)

    else:
        # general / cheese / red_meat
        c.energy_pts        = _pts(inp.energy_kj,       T_ENERGY_GEN)
        c.sugars_pts        = _pts(inp.sugars_g,        T_SUGARS_GEN)
        c.saturated_fat_pts = _pts(inp.saturated_fat_g, T_SATFAT_GEN)
        c.salt_pts          = _pts(inp.salt_g,          T_SALT_GEN)
        c.total_negative    = (c.energy_pts + c.sugars_pts
                                + c.saturated_fat_pts + c.salt_pts)

    # -----------------------------------------------------------------------
    # Positive points
    # -----------------------------------------------------------------------
    if cat == "beverage":
        c.protein_pts = _pts(inp.protein_g, T_PROTEIN_BEV)
        c.fiber_pts   = _pts(inp.fiber_g,   T_FIBER_BEV)
        fvl_raw       = _pts(inp.fvl_percent, T_FVL_BEV)
        # FVL mapped non-linearly: 0→0, 1→2, 2→4, 3→6
        c.fvl_pts     = [0, 2, 4, 6][min(fvl_raw, 3)]

    elif cat == "fats_oils_nuts":
        c.protein_pts = _pts(inp.protein_g,   T_PROTEIN_GEN)
        c.fiber_pts   = _pts(inp.fiber_g,     T_FIBER_GEN)
        fvl_raw       = _pts(inp.fvl_percent, T_FVL_GEN)
        # FVL cap: raw 3 → 5 pts (not 3) for fats category
        c.fvl_pts     = 5 if fvl_raw == 3 else fvl_raw

    else:
        # general / cheese / red_meat
        protein_raw = _pts(inp.protein_g, T_PROTEIN_GEN)

        if cat == "red_meat":
            # Red meat: protein contribution capped at 2 pts
            c.protein_pts  = min(protein_raw, 2)
            c.protein_status = (f"capped at 2 (raw was {protein_raw})"
                                if protein_raw > 2 else "included")
        else:
            c.protein_pts = protein_raw

        c.fiber_pts = _pts(inp.fiber_g,     T_FIBER_GEN)
        fvl_raw     = _pts(inp.fvl_percent, T_FVL_GEN)
        c.fvl_pts   = 5 if fvl_raw == 3 else fvl_raw

    # -----------------------------------------------------------------------
    # Final score (category-specific protein blocking)
    # -----------------------------------------------------------------------
    if cat == "beverage":
        # Water / plain unsweetened drinks → automatic A
        if inp.energy_kj == 0 and inp.sugars_g == 0 and not inp.has_sweeteners:
            c.effective_protein_pts = c.protein_pts
            c.total_positive = c.protein_pts + c.fiber_pts + c.fvl_pts
            color, hex_ = _GRADE_COLORS["A"]
            return NutriscoreResult(
                grade="A", score=0, category=cat,
                components=c,
                has_sweeteners=inp.has_sweeteners,
                fvl_percent=inp.fvl_percent,
                color=color, hex=hex_,
            )
        c.total_positive = c.protein_pts + c.fiber_pts + c.fvl_pts
        score = c.total_negative - c.total_positive

    elif cat == "fats_oils_nuts":
        c.protein_blocked = c.total_negative >= 7
        if c.protein_blocked:
            c.protein_status = "blocked (N≥7, regardless of FVL)"
        c.total_positive = c.fiber_pts + c.fvl_pts + (0 if c.protein_blocked else c.protein_pts)
        score = c.total_negative - c.total_positive

    elif cat in ("general", "red_meat"):
        # Protein blocking: if N ≥ 11 and FVL < 5 pts, protein is excluded
        if c.total_negative >= 11 and c.fvl_pts < 5:
            c.protein_blocked = True
            c.protein_status  = (
                "blocked (N≥11 and FVL<5)"
                if c.protein_status == "included"
                else c.protein_status + " + blocked"
            )
            c.total_positive = c.fiber_pts + c.fvl_pts
        else:
            c.total_positive = c.protein_pts + c.fiber_pts + c.fvl_pts
        score = c.total_negative - c.total_positive

    else:
        # Cheese: no protein blocking
        c.total_positive = c.protein_pts + c.fiber_pts + c.fvl_pts
        score = c.total_negative - c.total_positive

    c.effective_protein_pts = 0 if c.protein_blocked else c.protein_pts

    # -----------------------------------------------------------------------
    # Grade thresholds
    # -----------------------------------------------------------------------
    if cat == "beverage":
        # Beverages cannot achieve grade A through scoring (only via auto-A above)
        if   score <= 2:  grade = "B"
        elif score <= 6:  grade = "C"
        elif score <= 9:  grade = "D"
        else:             grade = "E"

    elif cat == "fats_oils_nuts":
        if   score <= -6: grade = "A"
        elif score <= 2:  grade = "B"
        elif score <= 10: grade = "C"
        elif score <= 18: grade = "D"
        else:             grade = "E"

    else:
        # The requested zero-score correction applies only to general foods.
        if   (score < 1 if cat == "general" else score <= -1): grade = "A"
        elif score <= 2:  grade = "B"
        elif score <= 10: grade = "C"
        elif score <= 18: grade = "D"
        else:             grade = "E"

    color, hex_ = _GRADE_COLORS[grade]
    return NutriscoreResult(
        grade=grade, score=score, category=cat,
        components=c,
        has_sweeteners=inp.has_sweeteners,
        fvl_percent=inp.fvl_percent,
        color=color, hex=hex_,
    )


# ---------------------------------------------------------------------------
# Unit-conversion helpers
# ---------------------------------------------------------------------------

def kcal_to_kj(kcal: float) -> float:
    """Convert kilocalories to kilojoules (1 kcal = 4.184 kJ)."""
    return round(kcal * 4.184)


def kj_to_kcal(kj: float) -> float:
    """Convert kilojoules to kilocalories."""
    return round(kj / 4.184)


def sodium_mg_to_salt_g(sodium_mg: float) -> float:
    """Convert sodium (mg) to salt (g).  Salt = Sodium × 2.5 / 1000."""
    return (sodium_mg * 2.5) / 1000


def salt_g_to_sodium_mg(salt_g: float) -> float:
    """Convert salt (g) to sodium (mg)."""
    return (salt_g / 2.5) * 1000


# ---------------------------------------------------------------------------
# Pretty-print helper
# ---------------------------------------------------------------------------

def _print_result(label: str, result: NutriscoreResult) -> None:
    c = result.components
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    print(f"  Grade : {result.grade}   Score : {result.score:+d}   ({result.color})")
    print(f"  Category : {result.category}")
    print(f"  --- Negative points ({c.total_negative} total) ---")
    print(f"    Energy        : {c.energy_pts} pts")
    print(f"    Sugars        : {c.sugars_pts} pts")
    print(f"    Saturated fat : {c.saturated_fat_pts} pts")
    print(f"    Salt          : {c.salt_pts} pts")
    if c.sweetener_pts:
        print(f"    Sweeteners    : {c.sweetener_pts} pts")
    print(f"  --- Positive points ({c.total_positive} total) ---")
    print(f"    Protein  : {c.effective_protein_pts} effective pts (raw {c.protein_pts})  [{c.protein_status}]")
    print(f"    Fiber    : {c.fiber_pts} pts")
    print(f"    FVL      : {c.fvl_pts} pts  (FVL {result.fvl_percent}%)")
    if c.protein_blocked:
        print(f"  Protein {c.protein_status}")


# ---------------------------------------------------------------------------
# Examples
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Nutri-Score 2024 — reference examples")

    # 1. General food — a fairly healthy wholegrain bread
    _print_result(
        "General: Wholegrain Bread",
        calculate(NutriscoreInput(
            category="general",
            energy_kj=kcal_to_kj(247),  # 247 kcal → kJ
            sugars_g=3.5,
            saturated_fat_g=0.6,
            salt_g=0.9,
            protein_g=9.0,
            fiber_g=6.0,
            fvl_percent=0,
        ))
    )

    # 2. Beverage — a typical sugary soft drink
    _print_result(
        "Beverage: Sugary Cola",
        calculate(NutriscoreInput(
            category="beverage",
            energy_kj=180,
            sugars_g=10.6,
            saturated_fat_g=0,
            salt_g=0,
            protein_g=0,
            fiber_g=0,
            fvl_percent=0,
            has_sweeteners=False,
        ))
    )

    # 3. Beverage — plain still water (auto-A rule)
    _print_result(
        "Beverage: Plain Water (auto-A)",
        calculate(NutriscoreInput(
            category="beverage",
            energy_kj=0,
            sugars_g=0,
            saturated_fat_g=0,
            salt_g=0,
            protein_g=0,
        ))
    )

    # 4. Fats/oils/nuts — olive oil
    _print_result(
        "Fats/Oils/Nuts: Olive Oil",
        calculate(NutriscoreInput(
            category="fats_oils_nuts",
            energy_kj=3389,
            sugars_g=0,
            saturated_fat_g=14,
            salt_g=0,
            protein_g=0,
            fiber_g=0,
            total_fat_g=100,
            fvl_percent=0,
        ))
    )

    # 5. Red meat — beef mince (20 % fat)
    _print_result(
        "Red Meat: Beef Mince (20% fat)",
        calculate(NutriscoreInput(
            category="red_meat",
            energy_kj=1100,
            sugars_g=0,
            saturated_fat_g=8.0,
            salt_g=sodium_mg_to_salt_g(75),  # 75 mg sodium → salt g
            protein_g=17.0,
            fiber_g=0,
            fvl_percent=0,
        ))
    )

    # 6. Cheese — mature cheddar
    _print_result(
        "Cheese: Mature Cheddar",
        calculate(NutriscoreInput(
            category="cheese",
            energy_kj=1725,
            sugars_g=0.1,
            saturated_fat_g=21.0,
            salt_g=1.8,
            protein_g=25.0,
            fiber_g=0,
            fvl_percent=0,
        ))
    )

    print(f"\n{'='*60}")
    print("  Unit conversion helpers")
    print(f"{'='*60}")
    print(f"  250 kcal → {kcal_to_kj(250)} kJ")
    print(f"  1046 kJ  → {kj_to_kcal(1046)} kcal")
    print(f"  500 mg sodium → {sodium_mg_to_salt_g(500):.3f} g salt")
    print(f"  1.5 g salt    → {salt_g_to_sodium_mg(1.5):.0f} mg sodium")
    print()
