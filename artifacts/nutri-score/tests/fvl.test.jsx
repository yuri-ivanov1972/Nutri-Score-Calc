import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Calculator } from "../src/components/calculator";
import { I18nProvider, useI18n } from "../src/lib/i18n";
import { calculate } from "../src/lib/nutriscore";

vi.mock("../src/lib/nutriscore", async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, calculate: vi.fn(original.calculate) };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "alert").mockImplementation(() => {});
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const enter = (input, value) => fireEvent.change(input, { target: { value: String(value) } });
const fvlInput = () => document.getElementById("fvl-percent");
const categories = ["general", "beverage", "cheese", "red_meat", "fats_oils_nuts"];
const boundaries = [
  [0, 0], [39.99, 0], [40, 0], [40.01, 1],
  [59.99, 1], [60, 1], [60.01, 2],
  [79.99, 2], [80, 2], [80.01, 5], [100, 5],
];

function fillRequired(category) {
  enter(screen.getByRole("combobox"), category);
  for (const input of screen.getAllByRole("spinbutton")) {
    if (input !== fvlInput()) enter(input, 0);
  }
}

describe.each(categories)("FVL percentage entry for %s", (category) => {
  it.each(boundaries)("submits %s unchanged and displays the correct points", (percent, generalPoints) => {
    render(<I18nProvider><Calculator /></I18nProvider>);
    fillRequired(category);
    enter(fvlInput(), percent);
    fireEvent.click(screen.getByRole("button", { name: "Calculate Score" }));

    expect(calculate).toHaveBeenCalledTimes(1);
    expect(calculate.mock.calls[0][0]).toMatchObject({ category, fvl_percent: percent });
    const result = calculate.mock.results[0].value;
    const points = category === "beverage" ? ({ 0: 0, 1: 2, 2: 4, 5: 6 })[generalPoints] : generalPoints;
    expect(result.fvl_percent).toBe(percent);
    expect(result.components.fvl_pts).toBe(points);
    const row = screen.getByText("Fruits, Vegetables, Legumes", { selector: "li span" }).closest("li");
    expect(row.lastElementChild.textContent).toBe(String(points));
    expect(fvlInput().value).toBe(String(percent));
  });
});

it("keeps the 0% default, preserves manual decimals across categories, and resets only on request", () => {
  render(<I18nProvider><Calculator /></I18nProvider>);
  expect(fvlInput().value).toBe("0");
  fillRequired("general");
  fireEvent.click(screen.getByRole("button", { name: "Calculate Score" }));
  expect(calculate.mock.calls[0][0].fvl_percent).toBe(0);
  enter(fvlInput(), "67.125");
  for (const category of categories) {
    enter(screen.getByRole("combobox"), category);
    expect(fvlInput().value).toBe("67.125");
  }
  fireEvent.click(screen.getByRole("button", { name: "Reset form" }));
  expect(fvlInput().value).toBe("0");
  expect(screen.getByRole("combobox").value).toBe("general");
});

it.each(["", "-0.1", "100.01", "not-a-number"])("rejects invalid FVL %j without calculating or silently substituting zero", (value) => {
  render(<I18nProvider><Calculator /></I18nProvider>);
  fillRequired("general");
  enter(fvlInput(), value);
  fireEvent.click(screen.getByRole("button", { name: "Calculate Score" }));
  expect(calculate).not.toHaveBeenCalled();
  expect(screen.getByRole("alert").textContent).toBe("Enter a percentage from 0 to 100.");
  expect(fvlInput().getAttribute("aria-invalid")).toBe("true");
  enter(fvlInput(), "40.01");
  fireEvent.click(screen.getByRole("button", { name: "Calculate Score" }));
  expect(calculate.mock.calls[0][0].fvl_percent).toBe(40.01);
  expect(screen.queryByRole("alert")).toBeNull();
});

function LanguagePicker() {
  const { setLanguage } = useI18n();
  return <select aria-label="Language" onChange={(e) => setLanguage(e.target.value)}>
    {["en", "de", "fr", "et", "lv"].map((lang) => <option key={lang}>{lang}</option>)}
  </select>;
}

it.each(["en", "de", "fr", "et", "lv"])("provides translated guidance and validation in %s without overwriting manual entry", (language) => {
  render(<I18nProvider><LanguagePicker /><Calculator /></I18nProvider>);
  enter(fvlInput(), "60.25");
  enter(screen.getByRole("combobox", { name: "Language" }), language);
  expect(fvlInput().value).toBe("60.25");
  const guidance = document.getElementById("fvl-guidance").textContent;
  expect(guidance).toMatch(/40%/);
  expect(guidance).toMatch(/60%/);
  expect(guidance).toMatch(/80%/);
  expect(fvlInput().labels[0].textContent).toContain("%");
  enter(fvlInput(), "");
  // The calculator has one action button besides Reset form.
  fireEvent.click(screen.getAllByRole("button").at(-1));
  expect(screen.getByRole("alert").textContent).not.toMatch(/fvl_invalid/);
  if (language !== "en") {
    expect(guidance).not.toContain("Enter the actual");
    expect(screen.getByRole("alert").textContent).not.toBe("Enter a percentage from 0 to 100.");
  }
});
