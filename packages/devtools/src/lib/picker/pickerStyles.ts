import type { PickerFeatures } from "./types";
import {
  COMMENT_ID,
  HINT_ID,
  HOVER_ID,
  SELECTED_ID,
} from "./constants";

export function buildPickerStyleSheet(features: PickerFeatures): string {
  const dragHeader = features.panelDrag
    ? `
    .grip-picker-header{
      cursor:grab;
      user-select:none;
      touch-action:none;
    }
    .grip-picker-header.grip-picker-dragging{cursor:grabbing}`
    : "";

  const selectedLayer = features.pendingHighlights
    ? `
    #${SELECTED_ID}{pointer-events:none!important}
    #${SELECTED_ID} .grip-selected{
      position:fixed;
      z-index:2147483645;
      box-sizing:border-box;
      border:1px dashed rgba(59,130,246,0.45);
      border-radius:0;
      background:rgba(59,130,246,0.04);
      pointer-events:none;
    }
    #${SELECTED_ID} .grip-selected-active{
      position:fixed;
      z-index:2147483646;
      box-sizing:border-box;
      border:1px dashed rgba(59,130,246,0.45);
      border-radius:0;
      background:rgba(59,130,246,0.04);
      pointer-events:none;
    }`
    : "";

  const chipTooltip = features.panelDrag
    ? `
    .grip-chip-tooltip{
      position:fixed;
      z-index:2147483647;
      pointer-events:none;
      max-width:min(240px,calc(100vw - 16px));
      padding:8px 10px;
      border-radius:10px;
      background:#18181b;
      border:1px solid #3f3f46;
      box-shadow:0 8px 24px rgba(0,0,0,.38);
      font:11px/1.35 system-ui,sans-serif;
      color:#fafafa;
    }
    .grip-chip-tooltip-head{
      display:flex;
      align-items:center;
      gap:6px;
      margin-bottom:2px;
    }
    .grip-chip-tooltip-tag{
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      font-size:10px;
      color:#93c5fd;
    }
    .grip-chip-tooltip-role{
      font-size:9px;
      color:#a1a1aa;
      padding:1px 6px;
      border-radius:9999px;
      background:#27272a;
    }
    .grip-chip-tooltip-text{
      margin:2px 0 0;
      color:#d4d4d8;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .grip-chip-tooltip-css{
      margin:4px 0 0;
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      font-size:9px;
      color:#71717a;
      overflow-wrap:anywhere;
      word-break:break-all;
    }`
    : "";

  const editorExtras = features.composerPromptSnapshot
    ? `
    .grip-context-inline{
      line-height:1.45;
      word-break:break-word;
    }
    .grip-inline-editor{
      user-select:text;
      -webkit-user-select:text;
    }`
    : "";

  const panelPosition = features.panelDrag
    ? ""
    : `
    .grip-picker-panel{
      position:fixed;
      z-index:2147483647;
    }`;

  return `
    *{cursor:crosshair!important}
    #${HOVER_ID},#${HINT_ID}{pointer-events:none!important}
    #${COMMENT_ID}{pointer-events:auto!important}
    #${COMMENT_ID} *{cursor:auto!important}
    .grip-picker-panel{
      width:min(320px,calc(100vw - 16px));
      padding:10px 12px;
      border-radius:16px;
      background:#18181b;
      border:1px solid #3f3f46;
      box-shadow:0 12px 40px rgba(0,0,0,.45);
      font:12px system-ui,sans-serif;
      color:#fafafa;
    }${panelPosition}
    .grip-picker-header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      margin-bottom:8px;
    }${dragHeader}
    .grip-picker-session{
      font-size:11px;
      font-weight:600;
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      color:#e4e4e7;
    }
    .grip-picker-hint{
      font-size:10px;
      color:#71717a;
      white-space:nowrap;
    }
    .grip-context-field{
      margin-bottom:8px;
    }
    .grip-context-composer{
      min-height:40px;
      max-height:160px;
      overflow-y:auto;
      border-radius:12px;
      background:#09090b;
      padding:8px 10px;
      cursor:text;
      line-height:1.45;
    }${editorExtras}
    .grip-inline-editor{
      min-height:1.35em;
      max-height:96px;
      overflow-y:auto;
      outline:none;
      white-space:pre-wrap;
      word-break:break-word;
      font:12px/1.45 system-ui,sans-serif;
      color:#fafafa;
      caret-color:#fafafa;
    }
    .grip-inline-editor:empty::before{
      content:attr(data-placeholder);
      color:#71717a;
      pointer-events:none;
    }
    .grip-inline-chip{
      display:inline-flex;
      align-items:center;
      vertical-align:baseline;
      margin:0 2px;
      padding:1px 8px;
      border-radius:9999px;
      border:none;
      background:#2d3748;
      color:#cbd5e1;
      font-size:10px;
      font-weight:500;
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      line-height:1.35;
      user-select:all;
      cursor:default;
      white-space:nowrap;
    }
    .grip-inline-chip-active{
      background:rgba(37,99,235,0.22);
      color:#f8fafc;
    }${chipTooltip}
    .grip-picker-actions{
      display:flex;
      gap:6px;
      justify-content:flex-end;
      flex-wrap:wrap;
    }
    .grip-picker-actions button{
      border-radius:9999px;
      border:none;
      padding:6px 12px;
      font-size:11px;
      cursor:pointer;
    }
    #__grip_comment_cancel__{background:#27272a;color:#d4d4d8}
    #__grip_comment_save__{background:#2563eb;color:#fff}
    ${selectedLayer}
    #${HOVER_ID}{
      position:fixed;
      z-index:2147483646;
      box-sizing:border-box;
      border:1px dashed #3b82f6;
      border-radius:0;
      background:rgba(59,130,246,0.06);
      box-shadow:none;
      pointer-events:none;
      transition:top 40ms,left 40ms,width 40ms,height 40ms;
    }
  `;
}
