/** Lightweight interactions for the fixture page (no framework). */

const dialog = document.getElementById("pg-dialog") as HTMLDialogElement | null;
const openModal = document.getElementById("pg-open-modal");
const closeModal = document.getElementById("pg-dialog-close");

openModal?.addEventListener("click", () => dialog?.showModal());
closeModal?.addEventListener("click", () => dialog?.close());

document.querySelectorAll(".pg-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".pg-tab").forEach((t) => {
      t.setAttribute("aria-selected", "false");
    });
    tab.setAttribute("aria-selected", "true");
  });
});

document.querySelectorAll(".pg-nav-item").forEach((link) => {
  link.addEventListener("click", (e) => {
    document.querySelectorAll(".pg-nav-item").forEach((l) => l.classList.remove("pg-nav-active"));
    (e.currentTarget as HTMLElement).classList.add("pg-nav-active");
  });
});

/** Hint when the extension FAB is missing (stale build or Grip not loaded). */
window.setTimeout(() => {
  if (document.getElementById("__grip_tray__")) return;

  const hint = document.createElement("div");
  hint.id = "grip-extension-hint";
  hint.textContent =
    "Grip FAB not detected — load packages/extension/dist in Chrome and reload the extension after each build.";
  Object.assign(hint.style, {
    position: "fixed",
    bottom: "16px",
    left: "16px",
    right: "16px",
    maxWidth: "36rem",
    margin: "0 auto",
    padding: "10px 14px",
    borderRadius: "8px",
    background: "#1e3a5f",
    color: "#e8f0fe",
    font: "13px system-ui, sans-serif",
    zIndex: "2147483644",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
  });
  document.body.appendChild(hint);
}, 4000);
