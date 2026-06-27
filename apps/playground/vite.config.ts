import path from "node:path";
import { fileURLToPath } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import { readSourceSnippet } from "../../packages/core/src/source-mapper/read-snippet.js";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(rootDir, "../..");
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

function gripSourceMiddleware(): Plugin {
  return {
    name: "grip-source",
    configureServer(server) {
      server.middlewares.use(
        "/__grip/source",
        async (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== "GET") {
            res.statusCode = 405;
            res.end("Method not allowed");
            return;
          }

          try {
            const url = new URL(req.url ?? "", "http://localhost");
            const file = url.searchParams.get("file");
            const line = Number(url.searchParams.get("line") ?? "1");
            if (!file) {
              res.statusCode = 400;
              res.end("Missing file");
              return;
            }

            const snippet = await readSourceSnippet({
              filePath: file,
              line: Number.isFinite(line) ? line : 1,
              workspaceRoot,
            });

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(snippet));
          } catch (err) {
            res.statusCode = 404;
            res.end(err instanceof Error ? err.message : "Source not found");
          }
        },
      );
    },
  };
}

export default defineConfig({
  plugins: [gripDevBanner(), gripSourceMiddleware()],
  resolve: {
    alias: {
      "@grip/core": path.resolve(rootDir, "../../packages/core/src/index.ts"),
      "@grip/devtools": path.resolve(devtoolsDir, "src/index.ts"),
      "@grip/devtools-lib": path.resolve(devtoolsDir, "src/lib/index.ts"),
      "@grip/devtools-floating": path.resolve(devtoolsDir, "src/floating/index.ts"),
      "@grip/devtools-css": path.resolve(devtoolsDir, "src/styles/globals.css"),
      "@": path.resolve(devtoolsDir, "src"),
      "@lib": path.resolve(devtoolsDir, "src/lib/index.ts"),
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
