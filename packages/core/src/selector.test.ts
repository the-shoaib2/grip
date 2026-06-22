import { describe, expect, it } from "vitest";
import { generateXPath } from "./selector.js";

describe("generateXPath", () => {
  it("uses id when present", () => {
    const el = document.createElement("div");
    el.id = "main";
    expect(generateXPath(el)).toBe('//*[@id="main"]');
  });
});
