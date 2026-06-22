import type { CdpClient } from "./cdp/client.js";
import { LogBuffer } from "./buffers/log-buffer.js";
import { NetworkBuffer } from "./buffers/network-buffer.js";
import { RefMap } from "./refs/ref-map.js";

export class GripContext {
  readonly client: CdpClient;
  readonly refMap: RefMap;
  readonly logBuffer: LogBuffer;
  readonly networkBuffer: NetworkBuffer;
  private lastSnapshotAt = 0;

  constructor(client: CdpClient) {
    this.client = client;
    this.refMap = new RefMap();
    this.logBuffer = new LogBuffer();
    this.networkBuffer = new NetworkBuffer();
  }

  async init(): Promise<void> {
    const cdp = this.client.getCdp();
    await this.logBuffer.enable(cdp);
    await this.networkBuffer.enable(cdp);
  }

  checkSnapshotDebounce(): void {
    const now = Date.now();
    if (now - this.lastSnapshotAt < 500) {
      throw new Error("Snapshot rate limited. Wait 500ms between snapshots.");
    }
    this.lastSnapshotAt = now;
  }
}
