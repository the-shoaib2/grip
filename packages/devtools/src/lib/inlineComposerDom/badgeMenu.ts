const MENU_ID = "__grip_badge_menu__";

export interface BadgeMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  separator?: boolean;
}

export interface BadgeMenuOptions {
  x: number;
  y: number;
  items: BadgeMenuItem[];
  onSelect: (itemId: string) => void;
}

export function hideBadgeMenu(): void {
  document.getElementById(MENU_ID)?.remove();
}

export function showBadgeMenu(options: BadgeMenuOptions): void {
  hideBadgeMenu();

  const menu = document.createElement("div");
  menu.id = MENU_ID;
  menu.className = "grip-badge-menu";
  menu.setAttribute("role", "menu");

  for (const item of options.items) {
    if (item.separator) {
      const sep = document.createElement("div");
      sep.className = "grip-badge-menu-sep";
      menu.appendChild(sep);
      continue;
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "grip-badge-menu-item";
    btn.textContent = item.label;
    btn.disabled = Boolean(item.disabled);
    btn.dataset.action = item.id;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideBadgeMenu();
      options.onSelect(item.id);
    });
    menu.appendChild(btn);
  }

  document.documentElement.appendChild(menu);

  const pad = 8;
  const rect = menu.getBoundingClientRect();
  let left = options.x;
  let top = options.y;
  left = Math.min(left, window.innerWidth - rect.width - pad);
  top = Math.min(top, window.innerHeight - rect.height - pad);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  const onDoc = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) {
      hideBadgeMenu();
      document.removeEventListener("mousedown", onDoc, true);
    }
  };
  document.addEventListener("mousedown", onDoc, true);
}

export const DEFAULT_BADGE_MENU_ITEMS: BadgeMenuItem[] = [
  { id: "remove", label: "Remove" },
  { id: "copy", label: "Copy Context" },
  { id: "duplicate", label: "Duplicate Context" },
  { id: "replace", label: "Replace Context" },
  { separator: true, id: "_", label: "" },
  { id: "inspect", label: "Inspect Context" },
  { id: "openSourceFile", label: "Open Source File" },
  { id: "refresh", label: "Refresh Context" },
  { separator: true, id: "__", label: "" },
  { id: "group", label: "Group Selected" },
  { id: "ungroup", label: "Ungroup" },
  { id: "pin", label: "Pin" },
  { id: "lock", label: "Lock" },
];
