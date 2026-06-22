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
