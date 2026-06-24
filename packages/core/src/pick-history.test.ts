import { describe, expect, it } from "vitest";
import {
  appendPickHistory,
  clearPicksForSession,
  groupPicksBySession,
  pickLabel,
  picksForSession,
  removePickFromHistory,
  lastPickInSession,
  toStoredPick,
  updatePickInHistory,
} from "./pick-history.js";

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

  it("clearPicksForSession keeps other sessions on same page", () => {
    const url = "https://x.com/page";
    const a = toStoredPick(base, url, "P", "sess-1");
    const b = toStoredPick({ ...base, css: "div > button" }, url, "P", "sess-2");
    const history = [a, b];
    const next = clearPicksForSession(history, url, "sess-1");
    expect(next).toHaveLength(1);
    expect(next[0].sessionId).toBe("sess-2");
    expect(picksForSession(next, url, "sess-1")).toHaveLength(0);
  });

  it("updatePickInHistory patches comment by id", () => {
    const stored = toStoredPick(base, "https://x.com", "P", "sess-1");
    const next = updatePickInHistory([stored], stored.id, { comment: "note" });
    expect(next[0].comment).toBe("note");
  });

  it("removePickFromHistory drops pick by id", () => {
    const a = toStoredPick(base, "https://x.com", "P", "sess-1");
    const b = toStoredPick({ ...base, css: "div > button" }, "https://x.com", "P", "sess-1");
    const next = removePickFromHistory([a, b], a.id);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe(b.id);
  });

  it("lastPickInSession returns newest pick in session on page", () => {
    const url = "https://x.com/page";
    const a = { ...toStoredPick(base, url, "P", "sess-1"), timestamp: 1000 };
    const b = {
      ...toStoredPick({ ...base, css: "div > button" }, url, "P", "sess-1"),
      timestamp: 2000,
    };
    const other = toStoredPick({ ...base, css: "nav" }, url, "P", "sess-2");
    expect(lastPickInSession([a, b, other], url, "sess-1")?.id).toBe(b.id);
    expect(lastPickInSession([a], url, "sess-1")?.id).toBe(a.id);
    expect(lastPickInSession([a, b, other], url, "sess-2")?.id).toBe(other.id);
  });

  it("groupPicksBySession groups page picks in stable creation order", () => {
    const url = "https://x.com/page";
    const old = { ...toStoredPick(base, url, "P", "sess-old"), timestamp: 1000 };
    const newer = {
      ...toStoredPick({ ...base, css: "div > button" }, url, "P", "sess-new"),
      timestamp: 2000,
    };
    const groups = groupPicksBySession([old, newer], url);
    expect(groups).toHaveLength(2);
    expect(groups[0].sessionId).toBe("sess-old");
    expect(groups[1].sessionId).toBe("sess-new");
  });
});
