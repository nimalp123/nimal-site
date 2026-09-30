import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { createRayaboyStatsHandler } from "./server/rayaboy-stats.js";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "RAYABOY_");
  const handler = createRayaboyStatsHandler({
    getCredentials: () => ({
      baseUrl: env.RAYABOY_INSFORGE_URL,
      apiKey: env.RAYABOY_INSFORGE_API_KEY,
    }),
  });
  return {
    plugins: [
      react(),
      {
        name: "rayaboy-counter-api",
        configureServer(server) {
          server.middlewares.use("/api/rayaboy-stats", handler);
        },
        configurePreviewServer(server) {
          server.middlewares.use("/api/rayaboy-stats", handler);
        },
      },
    ],
  };
});
