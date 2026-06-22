import { describe, expect, it } from "vitest";
import { appendPickHistory, pickLabel, toStoredPick } from "./pick-history.js";

describe("pick-history", () => {
  const base = {
    tagName: "span",
    css: "div > span",
    xpath: "/span[1]",
    role: "span",
    name: "",
    innerText: "Hello",
    rect: { top: 0, left: 0, width: 10, height: 10 },
    shadowDOM: false,
    iframe: "none",
  };

  it("builds short labels", () => {
    expect(pickLabel(base)).toBe('span "Hello"');
  });

  it("stores picks with id", () => {
    const stored = toStoredPick(base, "https://x.com", "Page", "sess-1");
    expect(stored.id).toBeTruthy();
    expect(stored.label).toContain("span");
  });

  it("dedupes by css and url", () => {
    const a = toStoredPick(base, "https://x.com", "P", "sess-1");
    const b = toStoredPick({ ...base, innerText: "Hi" }, "https://x.com", "P", "sess-1");
    const next = appendPickHistory([a], b);
    expect(next).toHaveLength(1);
    expect(next[0].innerText).toBe("Hi");
  });
});
