// Shared fixtures for the TypeScript and Python public calculate entry points.
// Reference: SPF FAQ updatedAlgo V11 (17 March 2025), tables 7–8.
const base = {
  category: "general", energy_kj: 0, sugars_g: 0, saturated_fat_g: 0,
  salt_g: 0, protein_g: 0, fiber_g: 0, total_fat_g: 100, fvl_percent: 0,
};
export const cases = [];
function add(name, input, expected) {
  cases.push({ name, input: { ...base, ...input }, expected });
}
const fat = { category: "fats_oils_nuts" };

for (const [score, input, grade] of [
  [-1, { fiber_g: 4 }, "A"],
  [0, {}, "A"],
  [1, { salt_g: 0.21 }, "B"],
]) add(`general grade at ${score}`, input, { score, grade });

for (const n of [6, 7, 8, 10, 11]) {
  for (const fvl of [0, 5]) {
    const effective = n < 7 ? 4 : 0;
    add(`fats N=${n}, FVL=${fvl}`, {
      ...fat, salt_g: n * 0.2 + 0.01, protein_g: 10, fiber_g: 4,
      fvl_percent: fvl ? 81 : 0,
    }, {
      "components.total_negative": n,
      "components.protein_pts": 4,
      "components.effective_protein_pts": effective,
      "components.fiber_pts": 1,
      "components.fvl_pts": fvl,
      "components.protein_blocked": n >= 7,
      "components.protein_status": n >= 7 ? "blocked (N≥7, regardless of FVL)" : "included",
      "components.total_positive": effective + 1 + fvl,
      score: n - effective - 1 - fvl,
    });
  }
}

const ratioBounds = [10, 16, 22, 28, 34, 40, 46, 52, 58, 64];
for (const [index, boundary] of ratioBounds.entries()) {
  for (const delta of [-0.000001, 0, 0.000001]) {
    add(`ratio ${boundary}${delta < 0 ? " below" : delta > 0 ? " above" : " exact"}`,
      { ...fat, saturated_fat_g: boundary + delta },
      { "components.saturated_fat_pts": index + (delta >= 0 ? 1 : 0) });
  }
  // Construct exact decimal ratios independently using integer coefficients.
  // 10.1g total makes naive cross-products in binary susceptible to rounding.
  for (const delta of [-1, 0, 1]) {
    const saturated = (boundary * 101000 + delta) / 1000000;
    add(`decimal ratio ${boundary}, offset ${delta}`,
      { ...fat, total_fat_g: 10.1, saturated_fat_g: saturated },
      { "components.saturated_fat_pts": index + (delta >= 0 ? 1 : 0) });
  }
  add(`scientific notation ratio ${boundary}`,
    { ...fat, saturated_fat_g: boundary * 1e-9, total_fat_g: 1e-7 },
    { "components.saturated_fat_pts": index + 1 });
}
for (const total of [undefined, 0, -1]) {
  const input = { ...fat, saturated_fat_g: 5 };
  if (total !== undefined) input.total_fat_g = total;
  else input.total_fat_g = undefined;
  add(`unchanged missing or nonpositive total fat ${total}`, input,
    { "components.saturated_fat_pts": 0 });
}

// Existing <= energy thresholds are deliberately unchanged.
for (let index = 0; index < 10; index++) {
  const energy = (index + 1) * 120;
  for (const delta of [-0.000001, 0, 0.000001]) {
    add(`saturates energy ${energy}, offset ${delta}`, {
      ...fat, energy_kj: 99999, saturated_fat_g: (energy + delta) / 37,
    }, { "components.energy_pts": index + (delta > 0 ? 1 : 0) });
  }
}
add("fats ignores declared energy", { ...fat, energy_kj: 99999 },
  { "components.energy_pts": 0 });

for (const [score, grade] of [
  [-7, "A"], [-6, "A"], [-5, "B"], [0, "B"], [2, "B"],
  [3, "C"], [10, "C"], [11, "D"], [18, "D"], [19, "E"], [20, "E"],
]) {
  add(`fats grade at ${score}`, score < 0 ? {
    ...fat, fiber_g: 8, protein_g: score === -7 ? 5 : score === -6 ? 3 : 0,
  } : { ...fat, salt_g: score ? score * 0.2 + 0.01 : 0 }, { score, grade });
}

for (const category of ["cheese", "red_meat"]) {
  for (const [score, input, grade] of [
    [-1, { fiber_g: 4 }, "A"], [0, {}, "B"], [1, { salt_g: 0.21 }, "B"],
  ]) add(`${category} grade unchanged ${score}`, { category, ...input }, { score, grade });
}
for (const category of ["general", "red_meat", "cheese"]) {
  for (const fvl of [0, 5]) {
    const blocked = category !== "cheese" && fvl === 0;
    const raw = category === "red_meat" ? 2 : 7;
    add(`${category} preserved protein rule FVL=${fvl}`, {
      category, salt_g: 2.21, protein_g: 20, fvl_percent: fvl ? 81 : 0,
    }, {
      "components.total_negative": 11,
      "components.protein_pts": raw,
      "components.protein_blocked": blocked,
      "components.effective_protein_pts": blocked ? 0 : raw,
      "components.total_positive": fvl + (blocked ? 0 : raw),
      score: 11 - fvl - (blocked ? 0 : raw),
    });
  }
}
add("red meat protein cap at low N", { category: "red_meat", protein_g: 20 },
  { score: -2, "components.protein_pts": 2, "components.protein_status": "capped at 2 (raw was 7)" });
add("water remains automatic A", { category: "beverage" }, { score: 0, grade: "A" });
add("nonwater beverage score zero is B", { category: "beverage", energy_kj: 1 },
  { score: 0, grade: "B" });
add("beverage sweeteners remain four points", { category: "beverage", has_sweeteners: true },
  { score: 4, grade: "C", "components.sweetener_pts": 4 });
for (const [score, grade] of [[2, "B"], [3, "C"], [6, "C"], [7, "D"], [9, "D"], [10, "E"]]) {
  add(`beverage grade boundary ${score}`, { category: "beverage", energy_kj: 1, salt_g: score * 0.2 + 0.01 },
    { score, grade });
}
add("beverage positives unchanged", {
  category: "beverage", energy_kj: 180, sugars_g: 10.6, protein_g: 2, fiber_g: 4, fvl_percent: 81,
}, { "components.total_negative": 12, "components.protein_pts": 3,
  "components.fiber_pts": 1, "components.fvl_pts": 6, score: 2, grade: "B" });

// Preserve inclusive thresholds for ALL unrelated tables.
const tables = [
  ["energy_kj", "energy_pts", [335,670,1005,1340,1675,2010,2345,2680,3015,3350]],
  ["sugars_g", "sugars_pts", [3.4,6.8,10,14,17,20,24,27,31,34,37,41,44,48,51]],
  ["saturated_fat_g", "saturated_fat_pts", [1,2,3,4,5,6,7,8,9,10]],
  ["salt_g", "salt_pts", [0.2,0.4,0.6,0.8,1,1.2,1.4,1.6,1.8,2,2.2,2.4,2.6,2.8,3,3.2,3.4,3.6,3.8,4]],
  ["fiber_g", "fiber_pts", [3,4.1,5.2,6.3,7.4]],
  ["protein_g", "protein_pts", [2.4,4.8,7.2,9.6,12,14,17]],
];
for (const [field, component, thresholds] of tables) {
  for (const [index, threshold] of thresholds.entries()) {
    for (const delta of [-0.000001, 0, 0.000001]) {
      add(`general inclusive ${field} ${threshold}, offset ${delta}`,
        { [field]: threshold + delta },
        { [`components.${component}`]: index + (delta > 0 ? 1 : 0) });
    }
  }
}
for (const [field, component, thresholds] of [
  ["energy_kj", "energy_pts", [30,90,150,210,240,270,300,330,360,390]],
  ["sugars_g", "sugars_pts", [0.5,2,3.5,5,6,7,8,9,10,11]],
  ["protein_g", "protein_pts", [1.2,1.5,1.8,2.1,2.4,2.7,3]],
]) {
  for (const [index, threshold] of thresholds.entries()) {
    for (const delta of [-0.000001, 0, 0.000001]) {
      add(`beverage inclusive ${field} ${threshold}, offset ${delta}`,
        { category: "beverage", energy_kj: 1, [field]: threshold + delta },
        { [`components.${component}`]: index + (delta > 0 ? 1 : 0) });
    }
  }
}
for (const category of ["general", "beverage", "fats_oils_nuts"]) {
  for (const [index, threshold] of [40,60,80].entries()) {
    for (const delta of [-0.000001, 0, 0.000001]) {
      const raw = index + (delta > 0 ? 1 : 0);
      add(`${category} preserved FVL ${threshold}, offset ${delta}`,
        { category, fvl_percent: threshold + delta },
        { "components.fvl_pts": category === "beverage" ? [0,2,4,6][raw] : [0,1,2,5][raw] });
    }
  }
}
