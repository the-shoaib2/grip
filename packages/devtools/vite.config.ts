import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@grip/core": path.resolve(rootDir, "../core/src/index.ts"),
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
      external: ["preact", "preact/hooks", "preact/jsx-runtime", "zustand", "@grip/core"],
      output: {
        assetFileNames: "devtools.[ext]",
      },
    },
  },
});
