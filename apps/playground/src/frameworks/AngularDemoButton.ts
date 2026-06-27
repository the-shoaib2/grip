export function mountAngularDemoButton(container: HTMLElement) {
  const btn = document.createElement("button");
  btn.textContent = "Angular Button Demo";
  btn.className = "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 m-2";
  
  // Attach mock Angular debug property
  (btn as HTMLButtonElement & { __ngContext__?: unknown }).__ngContext__ = [1, 2, 3];
  btn.setAttribute("ng-reflect-file", "apps/playground/src/frameworks/AngularDemoButton.html");
  
  container.appendChild(btn);
}
