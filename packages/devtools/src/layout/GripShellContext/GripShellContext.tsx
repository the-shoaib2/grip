import { createContext, type RefObject } from "preact";
import { useContext } from "preact/hooks";

export const GripShellRefContext = createContext<RefObject<HTMLDivElement> | null>(null);

export function useGripShellRef(): RefObject<HTMLDivElement> | null {
  return useContext(GripShellRefContext);
}
