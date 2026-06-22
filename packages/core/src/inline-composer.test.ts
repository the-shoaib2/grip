import { describe, expect, it } from "vitest";
import {
  chipDisplayLabel,
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
});
