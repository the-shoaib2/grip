import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { ComponentChildren } from "preact";
import { PickHistoryContext, usePickHistoryState } from "@/hooks/usePickHistory";
import type { GripRuntime } from "@/runtime/types";

const GripRuntimeContext = createContext<GripRuntime | null>(null);

function PickHistoryProvider({ children }: { children: ComponentChildren }) {
  const runtime = useGripRuntime();
  const value = usePickHistoryState(runtime);
  return <PickHistoryContext.Provider value={value}>{children}</PickHistoryContext.Provider>;
}

export function GripRuntimeProvider({
  runtime,
  children,
}: {
  runtime: GripRuntime;
  children: ComponentChildren;
}) {
  return (
    <GripRuntimeContext.Provider value={runtime}>
      <PickHistoryProvider>{children}</PickHistoryProvider>
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
