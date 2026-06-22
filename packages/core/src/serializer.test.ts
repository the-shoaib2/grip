import { describe, expect, it } from "vitest";
import { serializeForLLM, serializeSnapshotJson } from "./serializer.js";

describe("serializer", () => {
  const snapshot = {
    yaml: "- button ref=e1",
    refs: { e1: { ref: "e1", backendNodeId: 1 } },
    title: "T",
    url: "https://x.com",
  };

  it("serializeForLLM includes tree and refs", () => {
    const out = serializeForLLM(snapshot);
    expect(out).toContain("accessibility_tree:");
    expect(out).toContain("refs:");
  });

  it("serializeSnapshotJson is valid JSON", () => {
    const out = serializeSnapshotJson(snapshot);
    expect(JSON.parse(out).title).toBe("T");
  });
});
