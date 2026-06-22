import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [crx({ manifest })],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
      "@grip/core": path.resolve(rootDir, "../core/src/index.ts"),
      "@grip/devtools-lib": path.resolve(rootDir, "../devtools/src/lib/index.ts"),
      "@grip/devtools-floating": path.resolve(
        rootDir,
        "../devtools/src/floating/index.ts",
      ),
      "@grip/devtools": path.resolve(rootDir, "../devtools/src/index.ts"),
      "@grip/devtools-css": path.resolve(
        rootDir,
        "../devtools/src/styles/globals.css",
      ),
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
    dedupe: ["preact", "preact/hooks", "preact/compat"],
  },
  css: {
    postcss: "./postcss.config.js",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    /** Content scripts run on arbitrary origins; default modulepreload uses `/assets/...` and breaks bootstrap. */
    modulePreload: false,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
