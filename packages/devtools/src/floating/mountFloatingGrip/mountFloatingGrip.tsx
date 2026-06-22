import { render } from "preact";
import { useCallback, useState } from "preact/hooks";
import type { GripRuntime } from "../../runtime/types";
import { GripRuntimeProvider } from "../../runtime/context";
import { GripPanelView } from "../../views/GripPanelView";
import { FloatingShell } from "../FloatingShell";
import devtoolsCss from "../../styles/globals.css?inline";
import floatingCss from "../floating.css?inline";

export const TRAY_ID = "__grip_tray__";

export interface FloatingGripController {
  toggle(): void;
  setOpen(open: boolean): void;
  isOpen(): boolean;
}

let toggleOpen: (() => void) | null = null;
let setOpenExternal: ((open: boolean) => void) | null = null;
let openRef = false;

function FloatingApp() {
  const [open, setOpen] = useState(false);

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
    <GripRuntimeProvider runtime={chromeRuntimeForMount!}>
      <FloatingShell open={open} onToggle={onToggle}>
        <GripPanelView layout="floating" />
      </FloatingShell>
    </GripRuntimeProvider>
  );
}

let chromeRuntimeForMount: GripRuntime | null = null;

export function mountFloatingGrip(runtime: GripRuntime): FloatingGripController {
  chromeRuntimeForMount = runtime;

  let host = document.getElementById(TRAY_ID) as HTMLDivElement | null;
  if (!host) {
    host = document.createElement("div");
    host.id = TRAY_ID;
    document.documentElement.appendChild(host);
  }

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });

  if (!shadow.querySelector("[data-grip-styles]")) {
    const style = document.createElement("style");
    style.setAttribute("data-grip-styles", "true");
    style.textContent = `${devtoolsCss}\n${floatingCss}`;
    shadow.appendChild(style);
  }

  let mountPoint = shadow.querySelector<HTMLDivElement>("[data-grip-mount]");
  if (!mountPoint) {
    mountPoint = document.createElement("div");
    mountPoint.setAttribute("data-grip-mount", "true");
    shadow.appendChild(mountPoint);
    render(<FloatingApp />, mountPoint);
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
