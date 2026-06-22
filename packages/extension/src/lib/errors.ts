export function gripUserError(message?: string): string {
  if (!message) return "Something went wrong. Refresh the page and try again.";

  const lower = message.toLowerCase();

  if (
    lower.includes("could not load file") ||
    lower.includes("receiving end does not exist") ||
    lower.includes("extension context invalidated") ||
    lower.includes("message port closed")
  ) {
    return "Refresh this page, then try again.";
  }

  if (lower.includes("open an http")) return message;

  return message.replace(/assets\/[^\s'"]+/gi, "extension file");
}
