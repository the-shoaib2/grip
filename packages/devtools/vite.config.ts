import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@devtools": path.resolve(rootDir, "./src"),
      "grip-dev": path.resolve(rootDir, "../core/src/index.ts"),
      "@lib": path.resolve(rootDir, "./src/lib/index.ts"),
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: {
        index: path.resolve(rootDir, "src/index.ts"),
        floating: path.resolve(rootDir, "src/floating/index.ts"),
        lib: path.resolve(rootDir, "src/lib/index.ts"),
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ["preact", "preact/hooks", "preact/jsx-runtime", "zustand", "grip-dev"],
      output: {
        assetFileNames: "devtools.[ext]",
      },
    },
  },
});
