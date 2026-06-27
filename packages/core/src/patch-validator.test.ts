import { describe, it, expect } from "vitest";
import {
  isBlockedPatchPath,
  parseContextEnginePatches,
} from "./patch-validator.js";

describe("isBlockedPatchPath", () => {
  it("blocks env files", () => {
    expect(isBlockedPatchPath(".env")).toBe(true);
    expect(isBlockedPatchPath("src/.env.local")).toBe(true);
  });

  it("allows source files", () => {
    expect(isBlockedPatchPath("src/components/Button.tsx")).toBe(false);
  });
});

describe("parseContextEnginePatches", () => {
  it("parses structured agent response", () => {
    const text = `Status: SUCCESS

Context: DemoButton

File: src/Button.tsx

Changes:
- Change color to blue

Patch: { startLine: 3, endLine: 5, replacementCode: return <button className="blue">Hi</button> }

Summary: Made button blue`;

    const patches = parseContextEnginePatches(text);
    expect(patches).toHaveLength(1);
    expect(patches[0]?.status).toBe("SUCCESS");
    expect(patches[0]?.file).toBe("src/Button.tsx");
    expect(patches[0]?.patch.startLine).toBe(3);
    expect(patches[0]?.patch.replacementCode).toContain("blue");
  });
});
