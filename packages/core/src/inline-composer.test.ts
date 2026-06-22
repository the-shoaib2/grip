import { describe, expect, it } from "vitest";
import {
  chipDisplayLabel,
  formatChipForClipboard,
  formatInlineCommentForMcp,
  gripChipToken,
  parseInlineComment,
  serializeInlineComment,
} from "./inline-composer.js";

describe("inline-composer", () => {
  it("round-trips text and chip tokens", () => {
    const parts = [
      { type: "chip" as const, id: "a1" },
      { type: "text" as const, value: " make bigger " },
      { type: "chip" as const, id: "b2" },
    ];
    const serialized = serializeInlineComment(parts);
    expect(serialized).toBe("[[grip:a1]] make bigger [[grip:b2]]");
    expect(parseInlineComment(serialized)).toEqual(parts);
  });

  it("formats chip labels for MCP", () => {
    const text = `[[grip:1]] resize [[grip:2]]`;
    expect(formatInlineCommentForMcp(text, { "1": "button", "2": "h1" })).toBe(
      "<button> resize <h1>",
    );
  });

  it("renders display labels with angle brackets", () => {
    expect(chipDisplayLabel("button")).toBe("<button>");
    expect(chipDisplayLabel("<p>")).toBe("<p>");
  });

  it("formats chip element metadata for clipboard", () => {
    const out = formatChipForClipboard({
      tag: "button",
      role: "button",
      css: "#submit",
      text: "Save",
      name: "Save changes",
      xpath: "//button[@id='submit']",
      rect: { top: 10, left: 20, width: 80, height: 32 },
      shadowDOM: false,
      iframe: "none",
    });
    expect(out).toContain("Element: <button> · role: button");
    expect(out).toContain('Text: "Save"');
    expect(out).toContain("CSS selector: #submit");
    expect(out).toContain("XPath: //button[@id='submit']");
    expect(out).toContain("A11y name: \"Save changes\"");
  });
});
