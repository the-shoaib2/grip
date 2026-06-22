import type { CDPSession } from "puppeteer-core";

export interface FrameInfo {
  id: string;
  url: string;
  name?: string;
  parentId?: string;
}

interface FrameTreeNode {
  frame: { id: string; url: string; name?: string; parentId?: string };
  childFrames?: FrameTreeNode[];
}

export async function getFrameTree(cdp: CDPSession): Promise<FrameInfo[]> {
  const { frameTree } = (await cdp.send("Page.getFrameTree")) as {
    frameTree: FrameTreeNode;
  };
  const frames: FrameInfo[] = [];

  function walk(node: FrameTreeNode, parentId?: string): void {
    frames.push({
      id: node.frame.id,
      url: node.frame.url,
      name: node.frame.name,
      parentId: parentId ?? node.frame.parentId,
    });
    for (const child of node.childFrames ?? []) {
      walk(child, node.frame.id);
    }
  }

  walk(frameTree);
  return frames;
}

export async function getFrameExecutionContextId(
  cdp: CDPSession,
  frameId: string,
): Promise<number | null> {
  const { executionContexts } = (await cdp.send(
    "Runtime.enable",
  )) as unknown as { executionContexts?: never };
  void executionContexts;

  const result = (await cdp.send("Page.createIsolatedWorld", {
    frameId,
    worldName: "grip",
    grantUniveralAccess: true,
  })) as { executionContextId: number };

  return result.executionContextId ?? null;
}

export function findFrameById(
  frames: FrameInfo[],
  frameId: string,
): FrameInfo | undefined {
  return frames.find((f) => f.id === frameId);
}
