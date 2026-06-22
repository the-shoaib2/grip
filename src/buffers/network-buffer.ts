import type { CDPSession } from "puppeteer-core";
import type { HarEntry } from "../types.js";

const MAX_ENTRIES = 200;

interface PendingRequest {
  requestId: string;
  url: string;
  method: string;
  startedDateTime: string;
  requestHeaders: Record<string, string>;
}

export class NetworkBuffer {
  private entries: HarEntry[] = [];
  private pending = new Map<string, PendingRequest>();
  private enabled = false;

  async enable(cdp: CDPSession): Promise<void> {
    if (this.enabled) return;
    await cdp.send("Network.enable");

    cdp.on(
      "Network.requestWillBeSent",
      (params: {
        requestId: string;
        request: {
          url: string;
          method: string;
          headers?: Record<string, string>;
        };
        timestamp: number;
      }) => {
        this.pending.set(params.requestId, {
          requestId: params.requestId,
          url: params.request.url,
          method: params.request.method,
          startedDateTime: new Date(params.timestamp * 1000).toISOString(),
          requestHeaders: params.request.headers ?? {},
        });
      },
    );

    cdp.on(
      "Network.responseReceived",
      (params: {
        requestId: string;
        response: {
          status: number;
          statusText: string;
          mimeType: string;
          headers?: Record<string, string>;
        };
        timestamp: number;
      }) => {
        const req = this.pending.get(params.requestId);
        if (!req) return;
        const entry: HarEntry = {
          requestId: params.requestId,
          url: req.url,
          method: req.method,
          status: params.response.status,
          statusText: params.response.statusText,
          mimeType: params.response.mimeType,
          startedDateTime: req.startedDateTime,
          requestHeaders: req.requestHeaders,
          responseHeaders: params.response.headers ?? {},
        };
        this.entries.push(entry);
        this.pending.delete(params.requestId);
        if (this.entries.length > MAX_ENTRIES) this.entries.shift();
      },
    );

    this.enabled = true;
  }

  read(filter?: {
    url?: string;
    method?: string;
    status?: number;
  }): HarEntry[] {
    let result = [...this.entries];
    if (filter?.url) {
      result = result.filter((e) => e.url.includes(filter.url!));
    }
    if (filter?.method) {
      result = result.filter(
        (e) => e.method.toLowerCase() === filter.method!.toLowerCase(),
      );
    }
    if (filter?.status !== undefined) {
      result = result.filter((e) => e.status === filter.status);
    }
    return result;
  }

  clear(): void {
    this.entries = [];
    this.pending.clear();
  }
}
