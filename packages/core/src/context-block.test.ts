import { describe, it, expect } from "vitest";
import {
  buildContextBlocksFromSession,
  formatContextEnginePrompt,
  parseInstructions,
} from "./context-block.js";
import type { StoredPick } from "./types/messages.js";

const basePick = (overrides: Partial<StoredPick> = {}): StoredPick => ({
  id: "pick-1",
  sessionId: "sess-1",
  url: "http://localhost",
  pageTitle: "Test",
  timestamp: 1,
  label: "button",
  tagName: "button",
  css: "button.demo",
  xpath: "//button",
  role: "button",
  name: "",
  rect: { top: 0, left: 0, width: 10, height: 10 },
  shadowDOM: false,
  iframe: "none",
  innerText: "Click",
  frameworkContext: {
    framework: "React",
    file: "apps/playground/src/Button.tsx",
    line: 12,
    componentName: "DemoButton",
  },
  ...overrides,
});

describe("parseInstructions", () => {
  it("parses bullet lines", () => {
    expect(parseInstructions("- Remove shadow\n- Add blur")).toEqual([
      "Remove shadow",
      "Add blur",
    ]);
  });

  it("parses semicolon-separated single line", () => {
    expect(parseInstructions("Remove shadow; Add blur")).toEqual([
      "Remove shadow",
      "Add blur",
    ]);
  });
});

describe("formatContextEnginePrompt", () => {
  it("formats a single context block", () => {
    const pick = basePick({ comment: "Make it blue" });
    const blocks = buildContextBlocksFromSession(pick, [pick]);
    const out = formatContextEnginePrompt(blocks);
    expect(out).toContain("Component: DemoButton");
    expect(out).toContain("File: apps/playground/src/Button.tsx");
    expect(out).toContain("Lines: 12-12");
    expect(out).toContain("* Make it blue");
  });

  it("emits separate blocks per chip", () => {
    const pickA = basePick({ id: "a", comment: "[[grip:a]] [[grip:b]] Fix both" });
    const pickB = basePick({
      id: "b",
      frameworkContext: {
        framework: "React",
        file: "apps/playground/src/Card.tsx",
        line: 4,
        componentName: "Card",
      },
    });
    const blocks = buildContextBlocksFromSession(pickA, [pickA, pickB]);
    expect(blocks).toHaveLength(2);
    const out = formatContextEnginePrompt(blocks);
    expect(out).toContain("DemoButton");
    expect(out).toContain("Card");
    expect(out.split("---")).toHaveLength(2);
  });
});
