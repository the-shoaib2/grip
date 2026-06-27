export function mountReactDemoButton(container: HTMLElement) {
  const btn = document.createElement("button");
  btn.textContent = "React Button Demo";
  btn.className = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 m-2";
  
  // Attach mock React Fiber properties to simulate a React development build
  (btn as HTMLButtonElement & { __reactFiber$?: unknown }).__reactFiber$ = {
    _debugSource: {
      fileName: "apps/playground/src/frameworks/ReactDemoButton.ts",
      lineNumber: 2
    },
    return: null
  };
  
  container.appendChild(btn);
}
