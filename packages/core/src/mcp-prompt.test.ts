import { describe, expect, it } from "vitest";
import { formatMcpPrompt } from "./mcp-prompt.js";

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
});
