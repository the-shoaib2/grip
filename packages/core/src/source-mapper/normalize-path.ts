/** Normalize bundler absolute paths to workspace-relative when possible. */
export function normalizeSourcePath(
  filePath: string,
  workspaceRoot?: string,
): string {
  const normalized = filePath.replace(/\\/g, "/");

  if (/^(apps|packages)\//.test(normalized)) {
    return normalized;
  }

  if (workspaceRoot) {
    const root = workspaceRoot.replace(/\\/g, "/").replace(/\/$/, "");
    if (normalized.startsWith(root + "/")) {
      return normalized.slice(root.length + 1);
    }
    if (normalized.startsWith(root)) {
      return normalized.slice(root.length).replace(/^\//, "");
    }
  }

  for (const marker of ["/apps/", "/packages/", "/src/"]) {
    const idx = normalized.indexOf(marker);
    if (idx >= 0) return normalized.slice(idx + 1);
  }

  return normalized;
}

/** Resolve a possibly relative path against workspace root. */
export function resolveSourcePath(
  filePath: string,
  workspaceRoot?: string,
): string {
  const normalized = filePath.replace(/\\/g, "/");
  if (!workspaceRoot) return normalized;
  if (normalized.startsWith("/")) return normalized;

  const root = workspaceRoot.replace(/\\/g, "/").replace(/\/$/, "");
  return `${root}/${normalized}`;
}
