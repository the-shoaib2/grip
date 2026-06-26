/** Remove duplicate session ids while preserving first occurrence order. */
export function dedupeSessionOrder(order: string[]): string[] {
  return order.filter((id, idx) => order.indexOf(id) === idx);
}

/** Append a session id to order when it is not already present. */
export function appendSessionToOrder(order: string[], sessionId: string): string[] {
  return order.includes(sessionId) ? order : [...order, sessionId];
}

/** Remove a session id from order. */
export function removeSessionFromOrder(order: string[], sessionId: string): string[] {
  return order.filter((id) => id !== sessionId);
}

/**
 * Merge stored session order with session ids discovered from pick history.
 * Dedupes stored order, appends missing discovered ids, falls back to discovered ids.
 */
export function mergeSessionOrder(storedOrder: string[], discoveredIds: string[]): string[] {
  const deduped = dedupeSessionOrder(storedOrder);
  const merged = deduped.concat(discoveredIds.filter((id) => !deduped.includes(id)));
  return merged.length ? merged : discoveredIds;
}

/**
 * Reconcile session order after picks are removed: keep existing order entries that
 * still have picks, then append newly discovered session ids.
 */
export function reconcileSessionOrderAfterPickDelete(
  sessionOrder: string[],
  discoveredIds: string[],
): string[] {
  const keepOrder = sessionOrder.filter((id) => discoveredIds.includes(id));
  return keepOrder.concat(discoveredIds.filter((id) => !keepOrder.includes(id)));
}

/** Pick the next active session after deleting one (last in trimmed order, or new id). */
export function nextSessionIdAfterDelete(
  trimmedOrder: string[],
  createNew: () => string,
): string {
  return trimmedOrder[trimmedOrder.length - 1] ?? createNew();
}
