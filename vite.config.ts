import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { createRayaboyStatsHandler } from "./server/rayaboy-stats.js";
import { createTokenUsageHandler } from "./server/token-usage.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

function tokenmaxxingPage(request: IncomingMessage, _response: ServerResponse, next: () => void) {
  request.url = request.url?.replace(/^\/tokenmaxxing\/?(?=\?|$)/, "/tokenmaxxing/index.html");
  next();
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "RAYABOY_");
  const handler = createRayaboyStatsHandler({
    getCredentials: () => ({
      baseUrl: env.RAYABOY_INSFORGE_URL,
      apiKey: env.RAYABOY_INSFORGE_API_KEY,
    }),
  });
  const usageHandler = createTokenUsageHandler({
    fallback: JSON.parse(readFileSync(new URL("./server/token-usage.snapshot.json", import.meta.url), "utf8")),
  });
  return {
    build: {
      rolldownOptions: {
        input: {
          main: resolve(import.meta.dirname, "index.html"),
          tokenmaxxing: resolve(import.meta.dirname, "tokenmaxxing/index.html"),
        },
      },
    },
    plugins: [
      react(),
      {
        name: "rayaboy-counter-api",
        configureServer(server) {
          server.middlewares.use("/api/rayaboy-stats", handler);
          server.middlewares.use("/data/token-usage.json", usageHandler);
          server.middlewares.use("/api/token-usage", usageHandler);
          server.middlewares.use(tokenmaxxingPage);
        },
        configurePreviewServer(server) {
          server.middlewares.use("/api/rayaboy-stats", handler);
          server.middlewares.use("/data/token-usage.json", usageHandler);
          server.middlewares.use("/api/token-usage", usageHandler);
          server.middlewares.use(tokenmaxxingPage);
        },
      },
    ],
  };
});
