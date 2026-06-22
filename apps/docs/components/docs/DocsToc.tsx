"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TocItem } from "@lib/types";
import { useDocsToc } from "@components/docs/DocsTocContext";

const SCROLL_OFFSET = 24;

function getScrollRoot(): HTMLElement | null {
  return document.querySelector(".docs-main-scroll");
}

function resolveActiveId(items: TocItem[], scrollRoot: HTMLElement): string {
  if (!items.length) return "";

  const rootRect = scrollRoot.getBoundingClientRect();
  let current = items[0].id;

  for (const item of items) {
    const el = document.getElementById(item.id);
    if (!el) continue;
    const top = el.getBoundingClientRect().top - rootRect.top;
    if (top <= SCROLL_OFFSET) {
      current = item.id;
    }
  }

  const atBottom =
    scrollRoot.scrollTop + scrollRoot.clientHeight >= scrollRoot.scrollHeight - 48;
  if (atBottom) {
    current = items[items.length - 1].id;
  }

  return current;
}

export function DocsToc() {
  const { items } = useDocsToc();
  const [activeId, setActiveId] = useState<string>(() => items[0]?.id ?? "");
  const tocRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const scrollingToRef = useRef(false);
  const scrollEndTimerRef = useRef<number | null>(null);

  const setLinkRef = useCallback((id: string, el: HTMLAnchorElement | null) => {
    if (el) linkRefs.current.set(id, el);
    else linkRefs.current.delete(id);
  }, []);

  const syncActive = useCallback(() => {
    if (!items.length || scrollingToRef.current) return;
    const scrollRoot = getScrollRoot();
    if (!scrollRoot) return;
    const next = resolveActiveId(items, scrollRoot);
    setActiveId((prev) => (prev === next ? prev : next));
  }, [items]);

  const scrollTocToActive = useCallback((id: string) => {
    const container = tocRef.current;
    const link = linkRefs.current.get(id);
    if (!container || !link) return;

    const linkTop = link.offsetTop;
    const linkBottom = linkTop + link.offsetHeight;
    const viewTop = container.scrollTop;
    const viewBottom = viewTop + container.clientHeight;

    if (linkTop < viewTop + 8 || linkBottom > viewBottom - 8) {
      link.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, []);

  const scrollToHeading = useCallback((id: string, smooth = true) => {
    const scrollRoot = getScrollRoot();
    const el = document.getElementById(id);
    if (!scrollRoot || !el) return;

    scrollingToRef.current = true;
    setActiveId(id);

    const rootRect = scrollRoot.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const top = scrollRoot.scrollTop + (elRect.top - rootRect.top) - SCROLL_OFFSET;
    scrollRoot.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
    window.history.replaceState(null, "", `#${id}`);

    if (scrollEndTimerRef.current !== null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }
    scrollEndTimerRef.current = window.setTimeout(
      () => {
        scrollingToRef.current = false;
      },
      smooth ? 500 : 50,
    );
  }, []);

  useEffect(() => {
    scrollTocToActive(activeId);
  }, [activeId, scrollTocToActive]);

  useEffect(() => {
    if (!items.length) return;

    setActiveId(items[0].id);

    const scrollRoot = getScrollRoot();
    if (!scrollRoot) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncActive);
    };

    const headingEls = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer =
      headingEls.length > 0
        ? new IntersectionObserver(() => syncActive(), {
            root: scrollRoot,
            rootMargin: `-${SCROLL_OFFSET}px 0px -45% 0px`,
            threshold: [0, 0.1, 0.5, 1],
          })
        : null;

    for (const el of headingEls) observer?.observe(el);

    syncActive();
    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const hash = window.location.hash.slice(1);
    if (hash && items.some((item) => item.id === hash)) {
      requestAnimationFrame(() => scrollToHeading(hash, false));
    }

    return () => {
      observer?.disconnect();
      scrollRoot.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      if (scrollEndTimerRef.current !== null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, [items, syncActive, scrollToHeading]);

  if (!items.length) return null;

  return (
    <div ref={tocRef} className="docs-toc-inner">
      <p className="docs-toc-label">On this page</p>
      <ul className="docs-toc-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? "docs-toc-item docs-toc-item-nested" : "docs-toc-item"}
          >
            <a
              ref={(el) => setLinkRef(item.id, el)}
              href={`#${item.id}`}
              className={activeId === item.id ? "docs-toc-link docs-toc-link-active" : "docs-toc-link"}
              onClick={(e) => {
                e.preventDefault();
                scrollToHeading(item.id);
              }}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
