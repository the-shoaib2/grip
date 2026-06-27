import { describe, expect, it } from "vitest";
import { formatAllMcpPrompts, formatMcpPrompt } from "./mcp-prompt.js";

describe("formatMcpPrompt", () => {
  it("includes element details and MCP workflow", () => {
    const out = formatMcpPrompt({
      tagName: "button",
      css: "#go",
      xpath: "//button[1]",
      role: "button",
      name: "Go",
      innerText: "Click me",
      rect: { top: 0, left: 0, width: 100, height: 40 },
      shadowDOM: false,
      iframe: "none",
    });
    expect(out).toContain("Element: button · role: button");
    expect(out).toContain("snapshot()");
    expect(out).toContain("CSS selector: #go");
  });

  it("includes context comment when provided", () => {
    const out = formatMcpPrompt({
      tagName: "button",
      css: "#go",
      xpath: "//button[1]",
      role: "button",
      name: "Go",
      innerText: "Click me",
      rect: { top: 0, left: 0, width: 100, height: 40 },
      shadowDOM: false,
      iframe: "none",
      comment: "Submit the login form",
    });
    expect(out).toContain("Context: Submit the login form");
  });

  it("includes framework source when available", () => {
    const out = formatMcpPrompt({
      tagName: "button",
      css: "#go",
      xpath: "//button[1]",
      role: "button",
      name: "Go",
      innerText: "Click me",
      rect: { top: 0, left: 0, width: 100, height: 40 },
      shadowDOM: false,
      iframe: "none",
      frameworkContext: {
        framework: "React",
        file: "apps/playground/src/App.tsx",
        line: 12,
        componentName: "GoButton",
      },
    });
    expect(out).toContain("Component: GoButton");
    expect(out).toContain("Source: apps/playground/src/App.tsx:12");
  });
});

describe("formatAllMcpPrompts", () => {
  const pick = {
    tagName: "button",
    css: "#go",
    xpath: "//button[1]",
    role: "button",
    name: "Go",
    innerText: "Click me",
    rect: { top: 0, left: 0, width: 100, height: 40 },
    shadowDOM: false,
    iframe: "none",
  };

  it("includes session header for multiple picks", () => {
    const out = formatAllMcpPrompts([pick, pick]);
    expect(out).toContain("## Grip session · 2 elements");
  });

  it("includes session id in header when provided", () => {
    const out = formatAllMcpPrompts([pick], { sessionId: "sess-abc" });
    expect(out).toContain("## Grip session `sess-abc` · 1 element");
  });
});
