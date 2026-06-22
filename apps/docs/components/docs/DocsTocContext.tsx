"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TocItem } from "@lib/types";

interface DocsTocContextValue {
  items: TocItem[];
  setItems: (items: TocItem[]) => void;
}

const DocsTocContext = createContext<DocsTocContextValue | null>(null);

export function DocsTocProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TocItem[]>([]);
  const value = useMemo(() => ({ items, setItems }), [items]);

  return <DocsTocContext.Provider value={value}>{children}</DocsTocContext.Provider>;
}

export function useDocsToc() {
  const ctx = useContext(DocsTocContext);
  if (!ctx) {
    throw new Error("useDocsToc must be used within DocsTocProvider");
  }
  return ctx;
}

export function DocsTocRegistration({ items }: { items: TocItem[] }) {
  const { setItems } = useDocsToc();

  useEffect(() => {
    setItems(items);
    return () => setItems([]);
  }, [items, setItems]);

  return null;
}
