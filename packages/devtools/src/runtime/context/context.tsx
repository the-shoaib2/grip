import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { ComponentChildren } from "preact";
import type { GripRuntime } from "../types";

const GripRuntimeContext = createContext<GripRuntime | null>(null);

export function GripRuntimeProvider({
  runtime,
  children,
}: {
  runtime: GripRuntime;
  children: ComponentChildren;
}) {
  return (
    <GripRuntimeContext.Provider value={runtime}>
      {children}
    </GripRuntimeContext.Provider>
  );
}

export function useGripRuntime(): GripRuntime {
  const runtime = useContext(GripRuntimeContext);
  if (!runtime) {
    throw new Error("useGripRuntime must be used within GripRuntimeProvider");
  }
  return runtime;
}
