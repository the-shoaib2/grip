import { serializeForLLM } from "./serializer.js";
export async function buildSnapshot(cdp, refMap, frameId) {
    const params = {};
    if (frameId)
        params.frameId = frameId;
    await cdp.send("Accessibility.enable");
    const { nodes } = (await cdp.send("Accessibility.getFullAXTree", params));
    refMap.clear();
    const byId = new Map();
    for (const n of nodes)
        byId.set(n.nodeId, n);
    const childSet = new Set();
    for (const n of nodes) {
        for (const c of n.childIds ?? [])
            childSet.add(c);
    }
    const roots = nodes.filter((n) => !childSet.has(n.nodeId));
    if (roots.length === 0 && nodes.length > 0)
        roots.push(nodes[0]);
    const lines = [];
    const visited = new Set();
    function props(node) {
        const parts = [];
        for (const p of node.properties ?? []) {
            if (p.value?.value !== undefined && p.value.value !== false) {
                parts.push(`${p.name}=${JSON.stringify(p.value.value)}`);
            }
        }
        return parts.length ? ` [${parts.join(", ")}]` : "";
    }
    function walk(nodeId, depth) {
        if (visited.has(nodeId))
            return;
        visited.add(nodeId);
        const node = byId.get(nodeId);
        if (!node)
            return;
        if (!node.ignored) {
            const role = node.role?.value ?? "generic";
            const name = node.name?.value ?? "";
            let ref = "";
            if (node.backendDOMNodeId) {
                const r = refMap.assign(node.backendDOMNodeId, { role, name, frameId });
                ref = ` ref=${r}`;
            }
            const indent = "  ".repeat(depth);
            const label = name ? ` "${name}"` : "";
            lines.push(`${indent}- ${role}${label}${ref}${props(node)}`);
        }
        const nextDepth = node.ignored ? depth : depth + 1;
        for (const childId of node.childIds ?? [])
            walk(childId, nextDepth);
    }
    for (const root of roots)
        walk(root.nodeId, 0);
    const yaml = lines.join("\n");
    return { yaml, refs: refMap.getAll() };
}
export async function buildSnapshotForLLM(cdp, refMap, meta) {
    const snapshot = await buildSnapshot(cdp, refMap, meta?.frameId);
    return serializeForLLM({ ...snapshot, ...meta });
}
//# sourceMappingURL=snapshot.js.map