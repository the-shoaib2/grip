import type { Metadata } from "next";
import { DotGothic16 } from "next/font/google";
import "./globals.css";

const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dotted",
  display: "swap",
});

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
    <html lang="en" className={`${dotGothic.variable}`}>
      <body>{children}</body>
    </html>
  );
}

