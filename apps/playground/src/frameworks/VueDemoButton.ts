export function mountVueDemoButton(container: HTMLElement) {
  const btn = document.createElement("button");
  btn.textContent = "Vue Button Demo";
  btn.className = "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 m-2";
  
  // Attach mock Vue vnode to simulate a Vue development build
  (btn as HTMLButtonElement & { __vnode?: unknown }).__vnode = {
    type: {
      __file: "apps/playground/src/frameworks/VueDemoButton.vue"
    }
  };
  
  container.appendChild(btn);
}
