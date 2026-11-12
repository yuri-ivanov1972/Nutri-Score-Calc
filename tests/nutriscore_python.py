"""Run the shared regression fixtures against the standalone Python reference.

Invoked by the Node test suite, receiving JSON fixtures on stdin. Uses only
Python's standard library; the standalone calculator stays dependency-free.
"""
import contextlib
import io
import json
from pathlib import Path
import sys
import unittest
from dataclasses import asdict

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from nutriscore import NutriscoreInput, calculate, _print_result

fixtures = json.load(sys.stdin)


def get_path(value, path):
    for key in path.split("."):
        value = value[key]
    return value


class SharedRegressionTests(unittest.TestCase):
    pass


def fixture_test(fixture):
    def check(self):
        result = calculate(NutriscoreInput(**fixture["input"]))
        data = asdict(result)
        for path, expected in fixture["expected"].items():
            self.assertEqual(get_path(data, path), expected, path)
        c = result.components
        self.assertEqual(c.total_positive, c.effective_protein_pts + c.fiber_pts + c.fvl_pts)
        self.assertEqual(c.effective_protein_pts, 0 if c.protein_blocked else c.protein_pts)
        if c.protein_blocked and result.category == "fats_oils_nuts":
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                _print_result("Fats regression", result)
            self.assertIn("N≥7", output.getvalue())
            self.assertNotIn("N≥11", output.getvalue())
    return check


for index, fixture in enumerate(fixtures):
    setattr(SharedRegressionTests, f"test_{index:04d}", fixture_test(fixture))

suite = unittest.defaultTestLoader.loadTestsFromTestCase(SharedRegressionTests)
outcome = unittest.TextTestRunner(verbosity=1).run(suite)
if not outcome.wasSuccessful():
    sys.exit(1)

# There is no batch API. Verify list processing invokes the same public path.
batch = [asdict(calculate(NutriscoreInput(**fixture["input"]))) for fixture in fixtures]
for fixture, actual in zip(fixtures, batch):
    assert actual == asdict(calculate(NutriscoreInput(**fixture["input"])))
print(json.dumps(batch, ensure_ascii=False))
