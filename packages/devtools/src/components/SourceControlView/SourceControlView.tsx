import { useState } from "preact/hooks";
import { GitIcon } from "../icons";
import { usePatchHistory } from "../../hooks/usePatchHistory";

export function SourceControlView() {
  const patchHistory = usePatchHistory();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(patchHistory.length ? 0 : null);

  const changes = patchHistory.map((entry) => ({
    filename: entry.filePath.replace(/\\/g, "/"),
    additions: Math.max(1, entry.endLine - entry.startLine + 1),
    deletions: Math.max(1, entry.endLine - entry.startLine + 1),
    summary: entry.summary,
    diffLines: [
      {
        type: "normal" as const,
        content: `${entry.context ? `${entry.context}: ` : ""}${entry.summary || "Applied patch"} (lines ${entry.startLine}-${entry.endLine})`,
      },
    ],
  }));

  return (
    <div className="grip-git-view" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: "100%", minHeight: "22rem" }}>
      <div className="grip-pick-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="grip-label grip-label-plain">Source Control</span>
        <span style={{ fontSize: "10px", color: "var(--grip-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <GitIcon size={12} />
          <span>patches</span>
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1, overflowY: "auto" }}>
        {changes.length === 0 ? (
          <p className="grip-empty-state" style={{ margin: "auto", textAlign: "center", color: "var(--grip-muted)" }}>
            No applied patches yet. Use apply_context_patch MCP tool to record changes.
          </p>
        ) : (
          changes.map((file, idx) => {
            const isOpen = expandedIdx === idx;
            return (
              <div
                key={`${file.filename}-${idx}`}
                style={{
                  overflow: "hidden",
                  background: "var(--grip-inset-bg)",
                  display: "flex",
                  flexDirection: "column",
                  border: "none",
                  borderRadius: "6px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedIdx(isOpen ? null : idx)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "0.3rem 0.5rem",
                    border: "none",
                    background: isOpen ? "var(--grip-accent-soft)" : "transparent",
                    color: isOpen ? "var(--grip-accent-fg)" : "var(--grip-fg)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    transition: "background 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease", fontSize: "8px", display: "inline-block", color: "var(--grip-muted)" }}>
                      ▶
                    </span>
                    <span style={{ fontWeight: "500", color: isOpen ? "var(--grip-accent-fg)" : "var(--grip-fg)", fontSize: "11px" }}>{file.filename}</span>
                  </div>
                  <span style={{ fontSize: "10px", fontFamily: "ui-monospace, monospace" }}>
                    <span style={{ color: "#4ade80", fontWeight: "600" }}>+{file.additions}</span>
                    <span style={{ color: "#f87171", fontWeight: "600", marginLeft: "6px" }}>-{file.deletions}</span>
                  </span>
                </button>

                <div
                  className="grip-git-diff-container grip-scrollbar"
                  style={{
                    background: "var(--grip-inset-bg)",
                    padding: isOpen ? "0.5rem" : "0 0.5rem",
                    overflow: "auto",
                    maxHeight: isOpen ? "15rem" : "0",
                    opacity: isOpen ? 1 : 0,
                    transition: "max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, padding 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: "11px",
                    lineHeight: "1.5",
                    borderTop: isOpen ? "1px solid var(--grip-border)" : "none",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {file.diffLines.map((line, index) => (
                        <tr key={index}>
                          <td style={{ paddingLeft: "0.5rem", whiteSpace: "pre-wrap", wordBreak: "break-all", color: "var(--grip-fg)" }}>
                            {line.content}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
