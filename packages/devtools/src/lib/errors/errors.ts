export const GRIP_ERROR = {
  SHELL_UNAVAILABLE: "GRIP_SHELL_UNAVAILABLE",
  BOOTSTRAP_TIMEOUT: "GRIP_BOOTSTRAP_TIMEOUT",
  BOOTSTRAP_FAILED: "GRIP_BOOTSTRAP_FAILED",
  EXTENSION_RELOADED: "GRIP_EXTENSION_RELOADED",
  PAGE_RESTRICTED: "GRIP_PAGE_RESTRICTED",
} as const;

export type GripErrorCode = (typeof GRIP_ERROR)[keyof typeof GRIP_ERROR];

export function gripUserError(message?: string): string {
  if (!message) return "Something went wrong. Try again or refresh this tab.";

  const upper = message.toUpperCase();

  if (upper.includes(GRIP_ERROR.SHELL_UNAVAILABLE)) {
    return "Grip could not connect to this tab. Click Retry or refresh the page.";
  }
  if (upper.includes(GRIP_ERROR.BOOTSTRAP_TIMEOUT)) {
    return "Grip is still loading on this page. Click Retry.";
  }
  if (upper.includes(GRIP_ERROR.BOOTSTRAP_FAILED)) {
    return "Grip failed to load on this page. Check the console, then click Retry.";
  }
  if (upper.includes(GRIP_ERROR.EXTENSION_RELOADED)) {
    return "Grip was reloaded. Click Retry or refresh this tab.";
  }
  if (upper.includes(GRIP_ERROR.PAGE_RESTRICTED)) {
    return "Grip can't run on this page (chrome://, PDF viewer, Web Store, etc.).";
  }

  const lower = message.toLowerCase();

  if (lower.includes("open an http")) return message;

  if (
    lower.includes("could not load file") ||
    lower.includes("receiving end does not exist") ||
    lower.includes("extension context invalidated") ||
    lower.includes("message port closed") ||
    lower.includes("cannot access a chrome://") ||
    lower.includes("cannot access contents of url")
  ) {
    return "Grip was reloaded or this tab needs Grip injected. Click Retry or refresh the page.";
  }

  return message.replace(/assets\/[^\s'"]+/gi, "extension file");
}
