---
name: Nutri-Score scope safeguards
description: User-defined boundaries for algorithm corrections and independent approval of broader changes.
---

Use the product's explicit Nutri-Score category, never category-name/code heuristics. Do not infer FVL percentages from ingredient names, overwrite manual percentages, or change category defaults automatically.

**Why:** The user explicitly requested these safeguards when correcting the algorithm.

**How to apply:** Preserve category identity and manual nutrition/FVL values whenever correcting scoring rules.

Use exact percentage entry for FVL rather than representative band buttons.

**Why:** The user explicitly chose exact percentage entry to resolve misleading band labels while retaining the existing 0% default.

**How to apply:** Keep manual percentages unchanged across category switches; do not round or substitute band representatives.

Existing saved scores require a separately approved recalculation; an algorithm correction does not authorize bulk recalculation or production-data changes.

**Why:** The user explicitly separated calculator fixes from historical-data changes.

**How to apply:** State the recalculation requirement in delivery and obtain separate approval before acting on stored scores.

The general-food five-FVL-point protein exemption was deliberately left unchanged despite the updated FAQ's general N>=11 formula omitting that exemption. The zero-score Grade A correction was scoped to the explicit general category, preserving cheese and red-meat grade rules.

**Why:** The user explicitly excluded changing the general-food exemption and required other category-specific rules to be preserved.

**How to apply:** Report these differences separately; do not silently broaden a future fats-category or boundary fix into unrelated category changes.
