import type { StoredPick } from "@grip/core";
import {
  CopyButton,
  ElementTagBadge,
  FieldRow,
  GripBrand,
  GripMcpChip,
  HistoryIcon,
  McpIcon,
  MinusIcon,
  MousePointerClickIcon,
  PickErrorBanner,
  PlusIcon,
  SelectDropdown,
  SessionLabel,
  Tooltip,
  UndoIcon,
  usePickHistory,
} from "@grip/devtools";
import { useState } from "preact/hooks";
import { CommentFieldLabDemo } from "./CommentFieldLabDemo";
import { CommentFieldSection } from "./CommentFieldSection";
import { ContextEditorHostLabDemo } from "./ContextEditorHostLabDemo";
import { DialogLabDemo } from "./DialogLabDemo";
import { LogsLabDemo } from "./LogsLabDemo";
import { PickHistoryLabDemo } from "./PickHistoryLabDemo";
import { ToolbarLabDemo } from "./ToolbarLabDemo";

export function ComponentGallery({
  editorPick,
  onContextEditRequest,
  onCloseEditor,
}: {
  editorPick: StoredPick | null;
  onContextEditRequest: (
    pick: StoredPick,
    meta: { pickIndex: number; pickCount: number },
  ) => void;
  onCloseEditor: () => void;
}) {
  const [mcpConnected, setMcpConnected] = useState(true);
  const { history } = usePickHistory();

  return (
    <div class="lab-gallery">
      <section class="lab-block">
        <h3 class="lab-block-title">Brand &amp; status</h3>
        <div class="lab-row lab-row-tight">
          <GripBrand />
          <SessionLabel pickCount={history.length || 1} current />
          <GripMcpChip connected={mcpConnected} onConfigure={() => setMcpConnected(true)} />
          <button type="button" class="lab-nav-btn" onClick={() => setMcpConnected((on) => !on)}>
            Toggle MCP
          </button>
        </div>
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Session toolbar</h3>
        <ToolbarLabDemo />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Pick error banner</h3>
        <PickErrorBanner message="Could not reach the page picker." onRetry={() => {}} />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Confirm dialog</h3>
        <DialogLabDemo />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Session &amp; pick history</h3>
        <PickHistoryLabDemo onContextEditRequest={onContextEditRequest} />
      </section>

      <section class="lab-block lab-context-editor-block">
        <h3 class="lab-block-title">Context editor panel</h3>
        <CommentFieldSection pick={editorPick} onClose={onCloseEditor} />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Comment field</h3>
        <CommentFieldLabDemo />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Context editor host</h3>
        <ContextEditorHostLabDemo />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Console log panel</h3>
        <LogsLabDemo />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Controls &amp; fields</h3>
        <div class="lab-row">
          <SelectDropdown
            label="Copy as"
            value="mcp"
            options={[
              { value: "mcp", label: "Prompt" },
              { value: "css", label: "CSS" },
            ]}
            onChange={() => {}}
          />
          <CopyButton label="Copy" text="sample prompt" />
          <CopyButton label="Copy" text="sample prompt" variant="ghost" size="icon" tooltip="Copy icon" />
        </div>
        <div class="lab-row lab-row-tight">
          <ElementTagBadge tagName="button" role="button" />
          <ElementTagBadge tagName="input" role="searchbox" />
          <Tooltip text="Tooltip on hover">
            <span class="grip-chip grip-chip-ok">MCP</span>
          </Tooltip>
        </div>
        <FieldRow label="CSS" value="#grip-target" />
        <FieldRow label="XPath" value="//button[@id='grip-target']" />
      </section>

      <section class="lab-block">
        <h3 class="lab-block-title">Icons</h3>
        <div class="lab-icon-grid">
          <HistoryIcon size={16} />
          <McpIcon size={16} />
          <MinusIcon size={16} />
          <MousePointerClickIcon size={16} />
          <PlusIcon size={16} />
          <UndoIcon size={16} />
        </div>
      </section>
    </div>
  );
}
