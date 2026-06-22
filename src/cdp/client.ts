import type { CDPSession, Page } from "puppeteer-core";
import type { RefMap } from "../refs/ref-map.js";
import { log } from "../utils.js";

export type NavigationCallback = () => void;

export interface ChromeTarget {
  id: string;
  type: string;
  title: string;
  url: string;
  webSocketDebuggerUrl: string;
}

export class CdpClient {
  private browser: import("puppeteer-core").Browser | null = null;
  private page: Page | null = null;
  private cdp: CDPSession | null = null;
  private port: number;
  private onNavigate: NavigationCallback | null = null;
  private currentFrameId: string | null = null;

  constructor(port: number) {
    this.port = port;
  }

  setNavigationCallback(cb: NavigationCallback): void {
    this.onNavigate = cb;
  }

  async connect(): Promise<void> {
    const puppeteer = await import("puppeteer-core");
    const browserURL = `http://127.0.0.1:${this.port}`;

    let targets: ChromeTarget[];
    try {
      const res = await fetch(`${browserURL}/json/list`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      targets = (await res.json()) as ChromeTarget[];
    } catch (err) {
      throw new Error(
        `Cannot connect to Chrome on port ${this.port}. Launch Chrome with --remote-debugging-port=${this.port}. (${err})`,
      );
    }

    const pages = targets.filter((t) => t.type === "page");
    if (pages.length === 0) {
      throw new Error(
        `No page targets found on port ${this.port}. Open a tab in Chrome.`,
      );
    }

    const target = pages[pages.length - 1];
    log("info", `Attaching to: ${target.title} (${target.url})`);

    this.browser = await puppeteer.connect({
      browserURL,
      defaultViewport: null,
    });

    const browserPages = await this.browser.pages();
    this.page =
      browserPages.find((p) => p.url() === target.url) ??
      browserPages[browserPages.length - 1] ??
      (await this.browser.newPage());

    this.cdp = await this.page.createCDPSession();

    this.page.on("framenavigated", (frame) => {
      if (frame === this.page?.mainFrame()) {
        log("info", `Navigation detected: ${frame.url()}`);
        this.onNavigate?.();
      }
    });

    await this.cdp.send("Page.enable");
    await this.cdp.send("DOM.enable");
    await this.cdp.send("Runtime.enable");
    await this.cdp.send("Accessibility.enable");

    const { frameTree } = await this.cdp.send("Page.getFrameTree");
    this.currentFrameId = frameTree.frame.id;
  }

  getPage(): Page {
    if (!this.page) throw new Error("Not connected to Chrome");
    return this.page;
  }

  getCdp(): CDPSession {
    if (!this.cdp) throw new Error("Not connected to Chrome");
    return this.cdp;
  }

  getCurrentFrameId(): string | null {
    return this.currentFrameId;
  }

  setCurrentFrameId(frameId: string): void {
    this.currentFrameId = frameId;
  }

  async getUrl(): Promise<string> {
    return this.getPage().url();
  }

  async getTitle(): Promise<string> {
    return this.getPage().title();
  }

  async disconnect(): Promise<void> {
    await this.browser?.disconnect();
    this.browser = null;
    this.page = null;
    this.cdp = null;
  }
}

export function wireNavigationInvalidation(
  client: CdpClient,
  refMap: RefMap,
): void {
  client.setNavigationCallback(() => refMap.invalidate());
}
