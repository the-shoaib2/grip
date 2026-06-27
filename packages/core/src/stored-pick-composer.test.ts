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

  it("composerStateForStoredPick repairs legacy MCP tag-only comments", () => {
    const h1 = { ...pick, id: "h1", tagName: "h1", css: "#title" };
    const btn1 = { ...pick, id: "b1", tagName: "button", css: "#a" };
    const btn2 = { ...pick, id: "b2", tagName: "button", css: "#b" };
    const session = [h1, btn1, btn2];
    const state = composerStateForStoredPick(
      { ...h1, comment: "<h1><button><button>" },
      session,
    );
    expect(state.chips).toHaveLength(3);
    expect(state.chips[0]?.id).toBe("h1");
    expect(state.chips[1]?.id).toBe("b1");
    expect(state.chips[2]?.id).toBe("b2");
    expect(state.comment).toBe("[[grip:h1]][[grip:b1]][[grip:b2]]");
  });

  it("composerStateForStoredPick strips duplicate tag label from plain MCP comment", () => {
    const main = { ...pick, id: "main-1", tagName: "main", comment: "<main>" };
    const state = composerStateForStoredPick(main);
    expect(state.chips).toHaveLength(1);
    expect(state.chips[0]?.tag).toBe("main");
    expect(state.comment).toBe("[[grip:main-1]]");
  });
});
