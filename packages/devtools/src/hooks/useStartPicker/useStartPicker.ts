import { useCallback, useState } from "preact/hooks";
import { gripUserError } from "@/lib/errors";
import type { GripRuntime } from "@/runtime/types";

interface StartPickerOptions {
  closeOnSuccess?: boolean;
}

export function useStartPicker(runtime: GripRuntime) {
  const [pickError, setPickError] = useState<string | null>(null);

  const startPicker = useCallback(
    (options?: StartPickerOptions) => {
      setPickError(null);
      return runtime
        .sendMessage<{ ok?: boolean; error?: string }>({ type: "START_PICKER" })
        .then((res) => {
          if (res?.ok === false) {
            setPickError(gripUserError(res.error));
            return false;
          }
          if (options?.closeOnSuccess) {
            runtime.closeWindow?.();
          }
          return true;
        })
        .catch((err: Error) => {
          setPickError(gripUserError(err.message));
          return false;
        });
    },
    [runtime],
  );

  const stopPicker = useCallback(() => {
    setPickError(null);
    return runtime
      .sendMessage<{ ok?: boolean; error?: string }>({ type: "STOP_PICKER" })
      .then((res) => {
        if (res?.ok === false) {
          setPickError(gripUserError(res.error));
          return false;
        }
        return true;
      })
      .catch((err: Error) => {
        setPickError(gripUserError(err.message));
        return false;
      });
  }, [runtime]);

  return {
    pickError,
    startPicker,
    stopPicker,
    clearPickError: () => setPickError(null),
  };
}
