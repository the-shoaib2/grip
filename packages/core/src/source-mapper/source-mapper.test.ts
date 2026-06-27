import { describe, it, expect } from "vitest";
import { normalizeSourcePath } from "./normalize-path.js";
import { expandLineRange } from "./expand-range.js";

describe("normalizeSourcePath", () => {
  it("strips workspace root prefix", () => {
    expect(
      normalizeSourcePath(
        "/home/user/proj/apps/playground/src/App.tsx",
        "/home/user/proj",
      ),
    ).toBe("apps/playground/src/App.tsx");
  });

  it("finds apps segment without root", () => {
    expect(
      normalizeSourcePath("/var/tmp/build/apps/playground/src/App.tsx"),
    ).toBe("apps/playground/src/App.tsx");
  });
});

describe("expandLineRange", () => {
  const lines = [
    "import x from 'y'",
    "",
    "export function Demo() {",
    "  return <button>Hi</button>",
    "}",
    "",
    "export function Other() {",
    "  return null",
    "}",
  ];

  it("expands around anchor line within same function", () => {
    const range = expandLineRange(lines, 4);
    expect(range.start).toBeLessThanOrEqual(3);
    expect(range.end).toBeGreaterThanOrEqual(4);
  });
});
