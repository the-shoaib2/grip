import { render } from "preact";
import { useCallback, useState } from "preact/hooks";
import type { GripRuntime } from "../../runtime/types";
import { GripRuntimeProvider } from "../../runtime/context";
import { usePageContextEditor } from "../../hooks/usePageContextEditor";
import { GripPanelView } from "../../views/GripPanelView";
import { FloatingShell } from "../FloatingShell";
import devtoolsCss from "../../styles/globals.css?inline";
import floatingCss from "../floating.css?inline";

export const TRAY_ID = "__grip_tray__";

const HOST_STYLE: Partial<CSSStyleDeclaration> = {
  position: "fixed",
  bottom: "12px",
  right: "12px",
  zIndex: "2147483645",
  pointerEvents: "none",
  font: "12px system-ui, sans-serif",
};

export interface FloatingGripController {
  toggle(): void;
  setOpen(open: boolean): void;
  isOpen(): boolean;
}

let toggleOpen: (() => void) | null = null;
let setOpenExternal: ((open: boolean) => void) | null = null;
let openRef = false;

function FloatingTray() {
  const [open, setOpen] = useState(false);
  const openPageContextEditor = usePageContextEditor();

  const syncOpen = useCallback((next: boolean) => {
    openRef = next;
    setOpen(next);
  }, []);

  toggleOpen = () => syncOpen(!openRef);
  setOpenExternal = syncOpen;

  const onToggle = useCallback(() => {
    syncOpen(!openRef);
  }, [syncOpen]);

  return (
    <FloatingShell open={open} onToggle={onToggle}>
      <GripPanelView
        layout="floating"
        onMinimize={() => syncOpen(false)}
        onContextEditRequest={(pick, meta) => openPageContextEditor(pick, meta)}
      />
    </FloatingShell>
  );
}

function FloatingApp() {
  return (
    <GripRuntimeProvider runtime={chromeRuntimeForMount!}>
      <FloatingTray />
    </GripRuntimeProvider>
  );
}

let chromeRuntimeForMount: GripRuntime | null = null;
let mountedRuntime: GripRuntime | null = null;

export function isGripTrayMounted(): boolean {
  const host = document.getElementById(TRAY_ID);
  const mountPoint = host?.shadowRoot?.querySelector("[data-grip-mount]");
  return Boolean(mountPoint?.childElementCount);
}

export function mountFloatingGrip(runtime: GripRuntime): FloatingGripController {
  chromeRuntimeForMount = runtime;

  let host = document.getElementById(TRAY_ID) as HTMLDivElement | null;
  if (!host) {
    host = document.createElement("div");
    host.id = TRAY_ID;
    Object.assign(host.style, HOST_STYLE);
    document.documentElement.appendChild(host);
  } else {
    Object.assign(host.style, HOST_STYLE);
  }

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });

  if (!shadow.querySelector("[data-grip-styles]")) {
    const style = document.createElement("style");
    style.setAttribute("data-grip-styles", "true");
    shadow.appendChild(style);
  }

  const styleEl = shadow.querySelector<HTMLStyleElement>("[data-grip-styles]")!;
  styleEl.textContent = `${devtoolsCss}\n${floatingCss}`;

  let mountPoint = shadow.querySelector<HTMLDivElement>("[data-grip-mount]");
  if (!mountPoint) {
    mountPoint = document.createElement("div");
    mountPoint.setAttribute("data-grip-mount", "true");
    shadow.appendChild(mountPoint);
  }

  const needsRender = !mountPoint.childElementCount || mountedRuntime !== runtime;
  if (needsRender) {
    try {
      render(<FloatingApp />, mountPoint);
      mountedRuntime = runtime;
    } catch (err) {
      console.error("[Grip] Failed to mount floating panel:", err);
    }
  }

  return {
    toggle() {
      toggleOpen?.();
    },
    setOpen(next: boolean) {
      setOpenExternal?.(next);
    },
    isOpen() {
      return openRef;
    },
  };
}
