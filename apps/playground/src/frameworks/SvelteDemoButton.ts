export function mountSvelteDemoButton(container: HTMLElement) {
  const btn = document.createElement("button");
  btn.textContent = "Svelte Button Demo";
  btn.className = "px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 m-2";
  
  // Attach mock Svelte compiler debug properties
  (btn as HTMLButtonElement & { __svelte_meta?: unknown }).__svelte_meta = {
    loc: {
      file: "apps/playground/src/frameworks/SvelteDemoButton.svelte",
      line: 3
    }
  };
  
  container.appendChild(btn);
}
