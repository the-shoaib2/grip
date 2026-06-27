import tokensCss from "../../styles/tokens.css?inline";
import type { PickerFeatures } from "./types";
import {
  CONTEXT_CANCEL_ID,
  CONTEXT_PANEL_ID,
  CONTEXT_SAVE_ID,
  HINT_ID,
  HOVER_ID,
  SELECTED_ID,
} from "./constants";
import { buildScopedThemeTokens, PICKER_THEME_SCOPE } from "./pickerTheme";

export function buildPickerStyleSheet(features: PickerFeatures): string {
  const themeTokens = buildScopedThemeTokens(PICKER_THEME_SCOPE, tokensCss);
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
      background:var(--grip-tooltip-bg);
      border:1px solid var(--grip-border);
      box-shadow:0 8px 24px rgba(0,0,0,.28);
      font:11px/1.35 system-ui,sans-serif;
      color:var(--grip-tooltip-fg);
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
      color:var(--grip-accent-fg);
    }
    .grip-chip-tooltip-role{
      font-size:9px;
      color:var(--grip-muted);
      padding:1px 6px;
      border-radius:9999px;
      background:var(--grip-surface-hover);
    }
    .grip-chip-tooltip-text{
      margin:2px 0 0;
      color:var(--grip-fg);
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .grip-chip-tooltip-css{
      margin:4px 0 0;
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      font-size:9px;
      color:var(--grip-muted);
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
    .grip-context-panel{
      position:fixed;
      z-index:2147483647;
    }`;

  return `
    ${themeTokens}
    *{cursor:crosshair!important}
    #${HOVER_ID},#${HINT_ID}{pointer-events:none!important}
    #${CONTEXT_PANEL_ID}{pointer-events:auto!important}
    #${CONTEXT_PANEL_ID} *{cursor:auto!important}
    #${HINT_ID}{
      position:fixed;
      z-index:2147483647;
      padding:4px 8px;
      border-radius:9999px;
      background:var(--grip-shell-bg);
      color:var(--grip-muted);
      font:10px system-ui,sans-serif;
      border:1px solid var(--grip-shell-border);
      pointer-events:none;
    }
    .grip-context-panel{
      width:min(320px,calc(100vw - 16px));
      padding:10px 12px;
      border-radius:16px;
      background:var(--grip-shell-bg);
      border:1px solid var(--grip-shell-border);
      box-shadow:var(--grip-shell-shadow);
      font:12px system-ui,sans-serif;
      color:var(--grip-fg);
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
      color:var(--grip-fg);
    }
    .grip-picker-hint{
      font-size:10px;
      color:var(--grip-muted);
      white-space:nowrap;
    }
    .grip-context-field{
      margin-bottom:8px;
    }
    .grip-context-composer{
      min-height:40px;
      max-height:160px;
      overflow-x:hidden;
      overflow-y:auto;
      scrollbar-width:thin;
      scrollbar-color:var(--grip-scrollbar-thumb) transparent;
      border-radius:12px;
      background:var(--grip-inset-bg);
      padding:8px 10px;
      cursor:text;
      line-height:1.45;
    }
    .grip-context-composer::-webkit-scrollbar{
      width:6px;
      height:6px;
    }
    .grip-context-composer::-webkit-scrollbar-track{
      background:transparent;
    }
    .grip-context-composer::-webkit-scrollbar-thumb{
      background-color:var(--grip-scrollbar-thumb);
      border-radius:9999px;
      border:1px solid transparent;
      background-clip:padding-box;
    }
    .grip-context-composer::-webkit-scrollbar-thumb:hover{
      background-color:var(--grip-scrollbar-thumb-hover);
    }${editorExtras}
    .grip-inline-editor{
      min-height:1.35em;
      max-height:none;
      overflow:visible;
      outline:none;
      white-space:pre-wrap;
      word-break:break-word;
      font:12px/1.45 system-ui,sans-serif;
      color:var(--grip-fg);
      caret-color:var(--grip-fg);
    }
    .grip-inline-editor:empty::before{
      content:attr(data-placeholder);
      color:var(--grip-muted);
      pointer-events:none;
    }
    .grip-inline-chip{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      vertical-align:middle;
      margin:0 2px;
      padding:2px 8px;
      min-height:18px;
      box-sizing:border-box;
      border:none;
      border-radius:9999px;
      background:var(--grip-chip-bg);
      color:var(--grip-chip-fg);
      font-size:10px;
      font-weight:500;
      font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
      line-height:1;
      user-select:all;
      cursor:default;
      white-space:nowrap;
    }
    .grip-inline-chip-active,
    .grip-inline-chip-idle,
    .grip-inline-chip-ready,
    .grip-inline-chip-outdated,
    .grip-inline-chip-missing,
    .grip-inline-chip-processing,
    .grip-inline-chip-failed,
    .grip-inline-chip-pinned,
    .grip-inline-chip-locked,
    .grip-inline-chip-selected{
      background:var(--grip-chip-bg);
      color:var(--grip-chip-fg);
      border:none;
      outline:none;
      box-shadow:none;
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
    #${CONTEXT_CANCEL_ID}{background:var(--grip-surface-hover);color:var(--grip-fg)}
    #${CONTEXT_SAVE_ID}{background:var(--grip-accent);color:var(--grip-on-accent)}
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
