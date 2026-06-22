import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const devtoolsDir = path.resolve(rootDir, "../../packages/devtools");

function gripDevBanner(): Plugin {
  return {
    name: "grip-dev-banner",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        const port = server.config.server.port ?? 5174;
        console.log(`\n  Fixture page:     http://localhost:${port}/`);
        console.log(`  DevTools UI lab:  http://localhost:${port}/devtools.html\n`);
      });
    },
  };
}

export default defineConfig({
  plugins: [gripDevBanner()],
  resolve: {
    alias: {
      "@grip/core": path.resolve(rootDir, "../../packages/core/src/index.ts"),
      "@grip/devtools": path.resolve(devtoolsDir, "src/index.ts"),
      "@grip/devtools-floating": path.resolve(devtoolsDir, "src/floating/index.ts"),
      "@grip/devtools-css": path.resolve(devtoolsDir, "src/styles/globals.css"),
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react/jsx-runtime": "preact/jsx-runtime",
    },
    dedupe: ["preact", "preact/hooks", "preact/compat"],
  },
  css: {
    postcss: "./postcss.config.js",
  },
  server: {
    port: 5174,
    strictPort: true,
    open: "/",
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(rootDir, "index.html"),
        devtools: path.resolve(rootDir, "devtools.html"),
      },
    },
  },
});
