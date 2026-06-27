import { describe, expect, it } from "vitest";
import { formatPickLogLines, pickLogLabel } from "./pick-log.js";

describe("formatPickLogLines", () => {
  it("includes framework file and line", () => {
    const lines = formatPickLogLines({
      tagName: "button",
      css: "#submit",
      xpath: "//button[1]",
      role: "button",
      name: "Submit",
      innerText: "Save",
      rect: { top: 0, left: 0, width: 80, height: 32 },
      shadowDOM: false,
      iframe: "none",
      frameworkContext: {
        framework: "React",
        file: "/repo/apps/playground/src/App.tsx",
        line: 42,
        componentName: "SubmitButton",
      },
    });

    expect(lines).toContain("Element: <button>");
    expect(lines).toContain("Component: SubmitButton");
    expect(lines).toContain("Source: apps/playground/src/App.tsx:42");
    expect(lines).toContain("CSS: #submit");
  });

  it("appends source snippet when provided", () => {
    const lines = formatPickLogLines(
      {
        tagName: "div",
        css: ".card",
        xpath: "//div[1]",
        role: "div",
        name: "",
        innerText: "",
        rect: { top: 0, left: 0, width: 100, height: 100 },
        shadowDOM: false,
        iframe: "none",
        frameworkContext: {
          framework: "React",
          file: "apps/playground/src/Card.tsx",
          line: 10,
        },
      },
      {
        sourceCode: "export function Card() {",
        lineRange: { start: 8, end: 12 },
      },
    );

    expect(lines.some((l) => l.includes("// apps/playground/src/Card.tsx:8-12"))).toBe(true);
    expect(lines).toContain("export function Card() {");
  });
});

describe("pickLogLabel", () => {
  it("includes component name when present", () => {
    expect(
      pickLogLabel({
        tagName: "span",
        css: "",
        xpath: "",
        role: "span",
        name: "",
        innerText: "",
        rect: { top: 0, left: 0, width: 0, height: 0 },
        shadowDOM: false,
        iframe: "none",
        frameworkContext: { framework: "Vue", componentName: "Badge" },
      }),
    ).toBe("Grip · <span> · Badge");
  });
});
