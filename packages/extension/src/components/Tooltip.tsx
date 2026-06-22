import type { ComponentChildren } from "preact";
import { createPortal } from "preact/compat";
import { useCallback, useLayoutEffect, useRef, useState } from "preact/hooks";

interface TooltipProps {
  text: string;
  children: ComponentChildren;
  position?: "top" | "bottom";
  wide?: boolean;
  className?: string;
}

interface TooltipLayout {
  top: number;
  left: number;
}

const VIEWPORT_PAD = 8;
const GAP = 6;
const WIDE_CHAR_THRESHOLD = 24;

function shouldUseWide(text: string, wide?: boolean): boolean {
  return wide === true || text.length > WIDE_CHAR_THRESHOLD;
}

function computeLayout(
  anchor: DOMRect,
  tooltip: DOMRect,
  preferred: "top" | "bottom",
  wide: boolean,
): TooltipLayout {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let placement = preferred;
  const spaceTop = anchor.top - VIEWPORT_PAD;
  const spaceBottom = vh - anchor.bottom - VIEWPORT_PAD;
  const tooltipHeight = tooltip.height || 28;

  if (placement === "top" && spaceTop < tooltipHeight + GAP && spaceBottom > spaceTop) {
    placement = "bottom";
  } else if (
    placement === "bottom" &&
    spaceBottom < tooltipHeight + GAP &&
    spaceTop > spaceBottom
  ) {
    placement = "top";
  }

  let top =
    placement === "top"
      ? anchor.top - GAP - tooltipHeight
      : anchor.bottom + GAP;

  let left: number;
  const tooltipWidth = tooltip.width || Math.min(256, vw - VIEWPORT_PAD * 2);

  if (wide) {
    left = anchor.right - tooltipWidth;
  } else {
    left = anchor.left + anchor.width / 2 - tooltipWidth / 2;
  }

  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - VIEWPORT_PAD - tooltipWidth));
  top = Math.max(VIEWPORT_PAD, Math.min(top, vh - VIEWPORT_PAD - tooltipHeight));

  return { top, left };
}

export function Tooltip({
  text,
  children,
  position = "top",
  wide = false,
  className = "",
}: TooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<TooltipLayout | null>(null);

  const isWide = shouldUseWide(text, wide);

  const reposition = useCallback(() => {
    const anchor = wrapRef.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return;
    setLayout(
      computeLayout(
        anchor.getBoundingClientRect(),
        tooltip.getBoundingClientRect(),
        position,
        isWide,
      ),
    );
  }, [position, isWide]);

  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => {
    setOpen(false);
    setLayout(null);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    const id = requestAnimationFrame(() => reposition());
    return () => cancelAnimationFrame(id);
  }, [open, text, reposition]);

  useLayoutEffect(() => {
    if (!open) return;
    const onReflow = () => reposition();
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, reposition]);

  if (!text) return <>{children}</>;

  const tooltipNode =
    open &&
    createPortal(
      <span
        ref={tooltipRef}
        role="tooltip"
        className={`grip-tooltip grip-tooltip-portal ${isWide ? "grip-tooltip-wide" : ""}`}
        style={{
          top: layout ? `${layout.top}px` : "-9999px",
          left: layout ? `${layout.left}px` : "-9999px",
          opacity: layout ? 1 : 0,
        }}
      >
        {text}
      </span>,
      document.body,
    );

  return (
    <span
      ref={wrapRef}
      className={`grip-tooltip-wrap ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusIn={show}
      onFocusOut={hide}
    >
      {children}
      {tooltipNode}
    </span>
  );
}
