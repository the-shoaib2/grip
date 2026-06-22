import { useGripRuntime } from "../../runtime/context";
import { GripMainView } from "../GripMainView";

export function GripPopupView() {
  const runtime = useGripRuntime();

  const openPanel = () => {
    void runtime
      .sendMessage({ type: "TOGGLE_GRIP_TRAY" })
      .catch(() => {
        /* ignore */
      })
      .finally(() => runtime.closeWindow?.());
  };

  return (
    <GripMainView
      closeOnPickSuccess
      onOpenPanel={openPanel}
    />
  );
}
