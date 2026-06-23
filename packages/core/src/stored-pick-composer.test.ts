import { describe, expect, it } from "vitest";
import {
  composerStateForStoredPick,
  formatPickIndexLabel,
} from "./stored-pick-composer.js";
import type { StoredPick } from "./types/messages.js";

const pick: StoredPick = {
  id: "pick-1",
  sessionId: "sess-1",
  url: "https://example.com/",
  pageTitle: "Example",
  timestamp: 1,
  label: 'button "Go"',
  tagName: "button",
  css: "#go",
  xpath: "//button",
  role: "button",
  name: "Go",
  rect: { top: 0, left: 0, width: 10, height: 10 },
  shadowDOM: false,
  iframe: "none",
  innerText: "Go",
  comment: "Click [[grip:chip-a]] then wait",
};

describe("stored-pick-composer", () => {
  it("formatPickIndexLabel matches picker session badge", () => {
    expect(formatPickIndexLabel(2, 5)).toBe("[2:5]");
  });

  it("composerStateForStoredPick maps chip tokens to pick metadata", () => {
    const state = composerStateForStoredPick(pick);
    expect(state.chips).toHaveLength(1);
    expect(state.chips[0]?.id).toBe("chip-a");
    expect(state.chips[0]?.css).toBe("#go");
    expect(state.comment).toBe(pick.comment);
  });

  it("composerStateForStoredPick uses pick id when comment has no tokens", () => {
    const plain = { ...pick, comment: "plain note" };
    const state = composerStateForStoredPick(plain);
    expect(state.chips[0]?.id).toBe("pick-1");
    expect(state.comment).toBe("[[grip:pick-1]] plain note");
  });
});
