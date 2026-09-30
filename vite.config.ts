import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { createRayaboyStatsHandler } from "./server/rayaboy-stats.js";
import { createTokenUsageHandler } from "./server/token-usage.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const schoolArtifacts = JSON.parse(readFileSync(new URL("./src/data/school-artifacts.json", import.meta.url), "utf8")) as {
  course: string;
  slug: string;
}[];
const pageFiles: Record<string, string> = {
  "/tokenmaxxing": "tokenmaxxing/index.html",
  "/school": "school/index.html",
  "/school/math104": "school/math104/index.html",
  "/school/math128a": "school/math128a/index.html",
  "/school/stat133": "school/stat133/index.html",
};
for (const artifact of schoolArtifacts) {
  if (!["math104", "math128a", "stat133"].includes(artifact.course) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artifact.slug)) {
    throw new Error("Invalid school artifact route");
  }
  const route = `/school/${artifact.course}/${artifact.slug}`;
  if (pageFiles[route]) throw new Error("Duplicate school artifact route");
  pageFiles[route] = `${route.slice(1)}/index.html`;
}

function standalonePages(request: IncomingMessage, response: ServerResponse, next: () => void) {
  const queryIndex = request.url?.indexOf("?") ?? -1;
  const pathname = (queryIndex < 0 ? request.url : request.url?.slice(0, queryIndex))?.replace(/\/$/, "");
  const page = pathname ? pageFiles[pathname] : undefined;
  if (pathname === "/school" || pathname?.startsWith("/school/")) {
    response.setHeader("X-Robots-Tag", "noindex, nofollow, nosnippet");
  }
  if (page) request.url = `/${page}${queryIndex < 0 ? "" : request.url!.slice(queryIndex)}`;
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
          ...Object.fromEntries(Object.entries(pageFiles).map(([route, file]) => [route.slice(1).replaceAll("/", "-"), resolve(import.meta.dirname, file)])),
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
          server.middlewares.use(standalonePages);
        },
        configurePreviewServer(server) {
          server.middlewares.use("/api/rayaboy-stats", handler);
          server.middlewares.use("/data/token-usage.json", usageHandler);
          server.middlewares.use("/api/token-usage", usageHandler);
          server.middlewares.use(standalonePages);
        },
      },
    ],
  };
});
