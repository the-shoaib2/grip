export function serializeForLLM(snapshot) {
    const parts = [];
    if (snapshot.title)
        parts.push(`title: ${snapshot.title}`);
    if (snapshot.url)
        parts.push(`url: ${snapshot.url}`);
    parts.push("", "accessibility_tree:", snapshot.yaml);
    parts.push("", "refs:", JSON.stringify(snapshot.refs, null, 2));
    return parts.join("\n");
}
export function serializeSnapshotJson(snapshot) {
    return JSON.stringify(snapshot, null, 2);
}
//# sourceMappingURL=serializer.js.map