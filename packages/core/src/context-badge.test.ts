import { describe, it, expect } from "vitest";
import {
  badgeDisplayLabel,
  badgeStateIndicator,
  chipRefToContextBadge,
  computeSourceHash,
  ContextBadgeRegistry,
  duplicateBadge,
  markBadgeOutdatedIfHashChanged,
} from "./context-badge.js";

describe("context-badge", () => {
  it("prefers component name for display label", () => {
    expect(badgeDisplayLabel({ component: "Sidebar", tag: "div" })).toBe("<sidebar>");
  });

  it("computes stable source hash", () => {
    expect(computeSourceHash("hello")).toBe(computeSourceHash("hello"));
    expect(computeSourceHash("hello")).not.toBe(computeSourceHash("world"));
  });

  it("marks badge outdated when source changes", () => {
    const badge = chipRefToContextBadge({
      id: "a",
      tag: "div",
      frameworkContext: { framework: "React", file: "src/A.tsx", line: 1 },
    });
    const withHash = { ...badge, sourceHash: computeSourceHash("v1"), sourceCode: "v1" };
    const next = markBadgeOutdatedIfHashChanged(withHash, "v2");
    expect(next.state).toBe("outdated");
  });

  it("registry loads and duplicates badges", () => {
    const reg = new ContextBadgeRegistry();
    reg.loadFromChipRefs([{ id: "x", tag: "button" }]);
    const badge = reg.get("x")!;
    const dup = duplicateBadge(badge, "y");
    reg.set(dup);
    expect(reg.values()).toHaveLength(2);
    expect(badgeStateIndicator("ready")).toBe("✓");
  });
});
