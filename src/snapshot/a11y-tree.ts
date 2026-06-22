import type { CDPSession } from "puppeteer-core";
import type { RefMap } from "../refs/ref-map.js";

interface AXNode {
  nodeId: string;
  ignored?: boolean;
  role?: { value: string };
  name?: { value: string };
  description?: { value: string };
  value?: { value: string };
  properties?: Array<{ name: string; value: { value: unknown } }>;
  childIds?: string[];
  backendDOMNodeId?: number;
}

export async function buildA11ySnapshot(
  cdp: CDPSession,
  refMap: RefMap,
  frameId?: string,
): Promise<string> {
  const params: Record<string, unknown> = {};
  if (frameId) params.frameId = frameId;

  const { nodes } = (await cdp.send(
    "Accessibility.getFullAXTree",
    params,
  )) as { nodes: AXNode[] };

  refMap.clear();

  const byId = new Map<string, AXNode>();
  for (const n of nodes) byId.set(n.nodeId, n);

  const childSet = new Set<string>();
  for (const n of nodes) {
    for (const c of n.childIds ?? []) childSet.add(c);
  }
  const roots = nodes.filter((n) => !childSet.has(n.nodeId));
  if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0]);

  const lines: string[] = [];
  const visited = new Set<string>();

  function props(node: AXNode): string {
    const parts: string[] = [];
    for (const p of node.properties ?? []) {
      if (p.value?.value !== undefined && p.value.value !== false) {
        parts.push(`${p.name}=${JSON.stringify(p.value.value)}`);
      }
    }
    return parts.length ? ` [${parts.join(", ")}]` : "";
  }

  function walk(nodeId: string, depth: number): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = byId.get(nodeId);
    if (!node) return;

    if (!node.ignored) {
      const role = node.role?.value ?? "generic";
      const name = node.name?.value ?? "";
      let ref = "";
      if (node.backendDOMNodeId) {
        const r = refMap.assign(node.backendDOMNodeId, {
          role,
          name,
          frameId,
        });
        ref = ` ref=${r}`;
      }

      const indent = "  ".repeat(depth);
      const label = name ? ` "${name}"` : "";
      lines.push(`${indent}- ${role}${label}${ref}${props(node)}`);
    }

    const nextDepth = node.ignored ? depth : depth + 1;
    for (const childId of node.childIds ?? []) {
      walk(childId, nextDepth);
    }
  }

  for (const root of roots) walk(root.nodeId, 0);
  return lines.join("\n");
}
