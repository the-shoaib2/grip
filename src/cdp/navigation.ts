export function onNavigation(refMap: { invalidate: () => void }): void {
  refMap.invalidate();
}
