import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { calculate } from "../artifacts/nutri-score/src/lib/nutriscore.ts";
import { cases } from "./nutriscore-cases.mjs";

const getPath = (value, path) => path.split(".").reduce((v, key) => v[key], value);

for (const fixture of cases) {
  test(fixture.name, () => {
    const original = structuredClone(fixture.input);
    const result = calculate(fixture.input);
    for (const [path, expected] of Object.entries(fixture.expected)) {
      assert.equal(getPath(result, path), expected, path);
    }
    const c = result.components;
    assert.equal(c.total_positive, c.effective_protein_pts + c.fiber_pts + c.fvl_pts);
    assert.equal(c.effective_protein_pts, c.protein_blocked ? 0 : c.protein_pts);
    if (!(result.category === "beverage" && result.grade === "A")) {
      assert.equal(result.score, c.total_negative - c.total_positive);
    }
    assert.deepEqual(fixture.input, original, "Manual input/category must not be mutated");
  });
}

test("Python regressions, TS/Python full-result parity, and list/individual parity", () => {
  const python = spawnSync("python", [new URL("./nutriscore_python.py", import.meta.url).pathname], {
    input: JSON.stringify(cases), encoding: "utf8", maxBuffer: 5 * 1024 * 1024,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  });
  assert.equal(python.status, 0, python.stderr);
  console.log(python.stderr.trim());
  const batch = cases.map(fixture => calculate(fixture.input));
  assert.deepEqual(batch, JSON.parse(python.stdout));
  cases.forEach((fixture, index) => assert.deepEqual(calculate(fixture.input), batch[index]));
});

test("all five translations include fats-specific explanation and oil guidance", () => {
  const source = readFileSync(new URL("../artifacts/nutri-score/src/lib/i18n.tsx", import.meta.url), "utf8");
  assert.equal((source.match(/protein_blocked_fats: "/g) ?? []).length, 5);
  assert.equal((source.match(/fats_fvl_guidance: "/g) ?? []).length, 5);
  const ui = readFileSync(new URL("../artifacts/nutri-score/src/components/calculator.tsx", import.meta.url), "utf8");
  assert.match(ui, /result\.category === "fats_oils_nuts" \? "protein_blocked_fats" : "protein_blocked"/);
  assert.match(ui, /result\.components\.effective_protein_pts/);
  assert.match(ui, /category === "fats_oils_nuts" && \([\s\S]*?t\("fats_fvl_guidance"\)/);
  assert.match(ui, /fvl_percent: fvlValue/, "Submit the exact manually entered FVL percentage");
});
