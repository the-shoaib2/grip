import { useEffect, useState } from "preact/hooks";
import type { GripRuntime } from "../../runtime/types";

const PICKER_ACTIVE_KEY = "pickerActive";

export function usePickerActive(runtime: GripRuntime): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    void runtime.sessionGet(PICKER_ACTIVE_KEY).then((data) => {
      setActive(Boolean(data[PICKER_ACTIVE_KEY]));
    });

    return runtime.onStorageChanged((changes, area) => {
      if (area === "session" && PICKER_ACTIVE_KEY in changes) {
        setActive(Boolean(changes[PICKER_ACTIVE_KEY]?.newValue));
      }
    });
  }, [runtime]);

  return active;
}
