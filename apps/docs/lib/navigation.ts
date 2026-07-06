export interface NavItem {
  title: string;
  href: string;
  match?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const docsNavigation: NavGroup[] = [
  {
    title: "Getting started",
    items: [
      { title: "Introduction", href: "/docs/getting-started/intro" },
      { title: "Quick start", href: "/docs/getting-started/quick-start" },
    ],
  },
  {
    title: "MCP",
    items: [
      { title: "Configuration", href: "/docs/mcp/configuration" },
      { title: "Tools reference", href: "/docs/mcp/tools" },
    ],
  },
  {
    title: "Extension",
    items: [{ title: "Chrome extension", href: "/docs/extension" }],
  },
  {
    title: "Packages",
    items: [
      { title: "grip-dev", href: "/docs/packages/core" },
      { title: "@grip/devtools", href: "/docs/packages/devtools" },
      { title: "grip-mcp", href: "/docs/packages/mcp-server" },
    ],
  },
];

export const headerLinks = [
  { title: "Docs", href: "/docs/getting-started/intro", match: "/docs/getting-started" },
  { title: "MCP", href: "/docs/mcp/configuration", match: "/docs/mcp" },
  { title: "Extension", href: "/docs/extension", match: "/docs/extension" },
];
