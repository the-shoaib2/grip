import { describe, expect, it } from "vitest";
import {
  appendSessionToOrder,
  dedupeSessionOrder,
  mergeSessionOrder,
  nextSessionIdAfterDelete,
  reconcileSessionOrderAfterPickDelete,
  removeSessionFromOrder,
} from "./session-order.js";

describe("session-order", () => {
  it("dedupeSessionOrder preserves first occurrence", () => {
    expect(dedupeSessionOrder(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });

  it("appendSessionToOrder appends only when missing", () => {
    expect(appendSessionToOrder(["a"], "b")).toEqual(["a", "b"]);
    expect(appendSessionToOrder(["a", "b"], "b")).toEqual(["a", "b"]);
  });

  it("removeSessionFromOrder drops matching ids", () => {
    expect(removeSessionFromOrder(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("mergeSessionOrder merges stored order with discovered ids", () => {
    expect(mergeSessionOrder(["s2", "s1", "s2"], ["s1", "s3"])).toEqual(["s2", "s1", "s3"]);
    expect(mergeSessionOrder([], ["s1"])).toEqual(["s1"]);
  });

  it("reconcileSessionOrderAfterPickDelete keeps order for surviving sessions", () => {
    expect(reconcileSessionOrderAfterPickDelete(["s1", "s2", "s3"], ["s2", "s4"])).toEqual([
      "s2",
      "s4",
    ]);
  });

  it("nextSessionIdAfterDelete uses last trimmed id or creates new", () => {
    expect(nextSessionIdAfterDelete(["a", "b"], () => "new")).toBe("b");
    expect(nextSessionIdAfterDelete([], () => "new")).toBe("new");
  });
});
