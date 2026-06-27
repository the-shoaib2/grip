import { useState } from "preact/hooks";

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

const mockGitChanges: ChangedFile[] = [
  {
    filename: "SvelteDemoButton.ts",
    additions: 1,
    deletions: 1,
    diffLines: [
      { type: "normal", oldLine: 4, newLine: 4, content: "  btn.className = \"px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 m-2\";" },
      { type: "normal", oldLine: 5, newLine: 5, content: "  " },
      { type: "normal", oldLine: 6, newLine: 6, content: "  // Attach mock Svelte compiler debug properties" },
      { type: "deletion", oldLine: 7, content: "-  (btn as any).__svelte_meta = {" },
      { type: "addition", newLine: 7, content: "+  (btn as HTMLButtonElement & { __svelte_meta?: unknown }).__svelte_meta = {" },
      { type: "normal", oldLine: 8, newLine: 8, content: "    loc: {" },
      { type: "normal", oldLine: 9, newLine: 9, content: "      file: \"apps/playground/src/frameworks/SvelteDemoButton.svelte\"," },
      { type: "normal", oldLine: 10, newLine: 10, content: "      line: 3" },
    ]
  },
  {
    filename: "ContextField.tsx",
    additions: 2,
    deletions: 2,
    diffLines: [
      { type: "normal", oldLine: 10, newLine: 10, content: "  isEditorEmpty," },
      { type: "normal", oldLine: 11, newLine: 11, content: "  selectChipElement," },
      { type: "normal", oldLine: 12, newLine: 12, content: "  serializeEditor," },
      { type: "normal", oldLine: 13, newLine: 13, content: "  setEditorFromComment," },
      { type: "normal", oldLine: 14, newLine: 14, content: "  type InlineChipRef," },
      { type: "deletion", oldLine: 15, content: "-} from \"../../lib\";" },
      { type: "addition", newLine: 15, content: "+} from \"@lib\";" },
      { type: "normal", oldLine: 16, newLine: 16, content: "" },
      { type: "normal", oldLine: 107, newLine: 107, content: "    const onKeyDown = (e: KeyboardEvent) => {" },
      { type: "normal", oldLine: 108, newLine: 108, content: "      handleEditorKeydown(editor, e, () => onInput());" },
      { type: "normal", oldLine: 109, newLine: 109, content: "    };" },
      { type: "normal", oldLine: 110, newLine: 110, content: "" },
      { type: "deletion", oldLine: 111, content: "-    const unbindTooltip = bindChipTooltipRoot(editor, (chip) => chipMetaFromElement(chip));" },
      { type: "addition", newLine: 111, content: "+    const unbindTooltip = bindChipTooltipRoot(editor, (chip: HTMLElement) => chipMetaFromElement(chip));" },
      { type: "normal", oldLine: 112, newLine: 112, content: "    const unbindClipboard = bindEditorClipboard(editor);" },
    ]
  },
  {
    filename: "ComponentGallery.tsx",
    additions: 4,
    deletions: 4,
    diffLines: [
      { type: "normal", oldLine: 19, newLine: 19, content: "import { useState } from \"preact/hooks\";" },
      { type: "deletion", oldLine: 20, content: "-import { CommentFieldLabDemo } from \"./CommentFieldLabDemo\";" },
      { type: "deletion", oldLine: 21, content: "-import { CommentFieldSection } from \"./CommentFieldSection\";" },
      { type: "addition", newLine: 20, content: "+import { ContextFieldLabDemo } from \"./ContextFieldLabDemo\";" },
      { type: "addition", newLine: 21, content: "+import { ContextFieldSection } from \"./ContextFieldSection\";" },
      { type: "normal", oldLine: 22, newLine: 22, content: "import { ContextEditorHostLabDemo } from \"./ContextEditorHostLabDemo\";" },
      { type: "normal", oldLine: 78, newLine: 78, content: "      <section class=\"lab-block lab-context-editor-block\">" },
      { type: "normal", oldLine: 79, newLine: 79, content: "        <h3 class=\"lab-block-title\">Context editor panel</h3>" },
      { type: "deletion", oldLine: 80, content: "-        <CommentFieldSection pick={editorPick} onClose={onCloseEditor} />" },
      { type: "addition", newLine: 80, content: "+        <ContextFieldSection pick={editorPick} onClose={onCloseEditor} />" },
      { type: "normal", oldLine: 81, newLine: 81, content: "      </section>" },
      { type: "normal", oldLine: 82, newLine: 82, content: "      <section class=\"lab-block\">" },
      { type: "normal", oldLine: 83, newLine: 83, content: "        <h3 class=\"lab-block-title\">Comment field</h3>" },
      { type: "deletion", oldLine: 84, content: "-        <CommentFieldLabDemo />" },
      { type: "addition", newLine: 84, content: "+        <ContextFieldLabDemo />" },
      { type: "normal", oldLine: 85, newLine: 85, content: "      </section>" },
    ]
  }
];

export function SourceControlView() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0); // Default first one open

  const totalAdditions = mockGitChanges.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = mockGitChanges.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <div className="grip-git-view" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: "100%", minHeight: "22rem" }}>
      <div className="grip-pick-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="grip-label grip-label-plain">Source Control</span>
        <span style={{ fontSize: "10px", color: "var(--grip-muted)" }}>
          {mockGitChanges.length} files changed · <span style={{ color: "#4ade80", fontWeight: "600" }}>+{totalAdditions}</span> <span style={{ color: "#f87171", fontWeight: "600" }}>-{totalDeletions}</span>
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", flex: 1, overflowY: "auto" }}>
        {mockGitChanges.map((file, idx) => {
          const isOpen = expandedIdx === idx;
          return (
            <div
              key={file.filename}
              style={{
                overflow: "hidden",
                background: "var(--grip-surface)",
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
                  <span style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease", fontSize: "8px", display: "inline-block" }}>
                    ▶
                  </span>
                  <span style={{ fontWeight: "600" }}>{file.filename}</span>
                </div>
                <span style={{ fontSize: "10px" }}>
                  <span style={{ color: "#4ade80" }}>+{file.additions}</span>
                  <span style={{ color: "#f87171", marginLeft: "6px" }}>-{file.deletions}</span>
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
        })}
      </div>
    </div>
  );
}
