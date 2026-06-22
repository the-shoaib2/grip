import { describe, expect, it } from "vitest";
import { createRefMap } from "./ref-map.js";
import { serializeForLLM } from "./serializer.js";

describe("RefMap", () => {
  it("assigns and retrieves refs", () => {
    const map = createRefMap();
    const ref = map.assign(42, { role: "button", name: "Go" });
    expect(ref).toBe("e1");
    expect(map.require(ref).backendNodeId).toBe(42);
  });

  it("invalidates refs on navigation", () => {
    const map = createRefMap();
    const ref = map.assign(1);
    map.invalidate();
    expect(map.get(ref)).toBeUndefined();
  });
});

describe("serializeForLLM", () => {
  it("formats snapshot for agents", () => {
    const out = serializeForLLM({
      yaml: "- button ref=e1",
      refs: { e1: { ref: "e1", backendNodeId: 1, role: "button" } },
      title: "Test",
      url: "https://example.com",
    });
    expect(out).toContain("title: Test");
    expect(out).toContain("accessibility_tree:");
    expect(out).toContain("ref=e1");
  });
});
