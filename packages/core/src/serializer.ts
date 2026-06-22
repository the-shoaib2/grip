import type { A11ySnapshot } from "./types/a11y.js";

export function serializeForLLM(snapshot: A11ySnapshot): string {
  const parts: string[] = [];
  if (snapshot.title) parts.push(`title: ${snapshot.title}`);
  if (snapshot.url) parts.push(`url: ${snapshot.url}`);
  parts.push("", "accessibility_tree:", snapshot.yaml);
  parts.push("", "refs:", JSON.stringify(snapshot.refs, null, 2));
  return parts.join("\n");
}

export function serializeSnapshotJson(snapshot: A11ySnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}
