import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grip — Grab anything on the web",
  description: "Browser element selector, accessibility inspector, and AI agent browser interface",
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
