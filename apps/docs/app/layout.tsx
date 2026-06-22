import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Grip — Grab anything on the web",
    template: "%s · Grip Docs",
  },
  description:
    "Browser element selector, accessibility inspector, Chrome extension, and MCP server for AI agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
