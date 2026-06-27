import { useState } from "preact/hooks";
import { GitIcon } from "../icons";

interface ChangedFile {
  filename: string;
  additions: number;
  deletions: number;
  diffLines: {
    type: "addition" | "deletion" | "normal";
    oldLine?: number;
    newLine?: number;
    content: string;
  }[];
}

const mockGitChanges: ChangedFile[] = [];


export function SourceControlView() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0); // Default first one open

  return (
    <div className="grip-git-view" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: "100%", minHeight: "22rem" }}>
      <div className="grip-pick-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="grip-label grip-label-plain">Source Control</span>
        <span style={{ fontSize: "10px", color: "var(--grip-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <GitIcon size={12} />
          <span>main</span>
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1, overflowY: "auto" }}>
        {mockGitChanges.length === 0 ? (
          <p className="grip-empty-state" style={{ margin: "auto", textAlign: "center", color: "var(--grip-muted)" }}>No changes detected</p>
        ) : (
          mockGitChanges.map((file, idx) => {
            const isOpen = expandedIdx === idx;
            return (
              <div
                key={file.filename}
                style={{
                  overflow: "hidden",
                  background: "var(--grip-inset-bg)",
                  display: "flex",
                  flexDirection: "column",
                  border: "none",
                  borderRadius: "6px"
                }}
              >
                {/* Accordion Header */}
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
                    transition: "background 0.15s ease"
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

                {/* Accordion Content (Diff) */}
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
                    borderTop: isOpen ? "1px solid var(--grip-border)" : "none"
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      {file.diffLines.map((line, index) => {
                        let bg = "transparent";
                        let color = "var(--grip-fg)";
                        if (line.type === "addition") {
                          bg = "rgba(74, 222, 128, 0.12)";
                          color = "#4ade80";
                        } else if (line.type === "deletion") {
                          bg = "rgba(248, 113, 113, 0.12)";
                          color = "#f87171";
                        }

                        return (
                          <tr key={index} style={{ background: bg }}>
                            <td style={{ width: "24px", color: "var(--grip-muted)", textAlign: "right", paddingRight: "0.5rem", userSelect: "none" }}>
                              {line.oldLine || ""}
                            </td>
                            <td style={{ width: "24px", color: "var(--grip-muted)", textAlign: "right", paddingRight: "0.5rem", userSelect: "none", borderRight: "1px solid var(--grip-border)" }}>
                              {line.newLine || ""}
                            </td>
                            <td style={{ paddingLeft: "0.5rem", whiteSpace: "pre-wrap", wordBreak: "break-all", color: color }}>
                              {line.content}
                            </td>
                          </tr>
                        );
                      })}
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
