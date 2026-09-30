#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { dirname } from "node:path";
import {
  buildPublicUsage, serializeUsage, publishPublicUsage, USAGE_VERSION, USAGE_TIMEZONE,
} from "./usage-utils.mjs";

function options(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (argument === "--publish") result.publish = true;
    else if (argument === "--input" || argument === "--output") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw new Error("Missing usage command option");
      result[argument.slice(2)] = value;
    } else throw new Error("Unknown usage command option");
  }
  if (!result.output && !result.publish) throw new Error("Choose --output or --publish");
  return result;
}

function githubApi(endpoint, { method, body }) {
  const args = ["api", "--method", method, endpoint, "-H", "Accept: application/vnd.github+json"];
  if (body) args.push("--input", "-");
  const result = spawnSync("gh", args, {
    encoding: "utf8", input: body ? JSON.stringify(body) : undefined,
    maxBuffer: 4 * 1024 * 1024, timeout: 30_000,
  });
  if (result.status !== 0) {
    const status = Number(result.stderr?.match(/HTTP (\d{3})/)?.[1]);
    if ([404, 409, 422].includes(status)) return { status };
    throw new Error("GitHub usage update failed");
  }
  let data;
  try { data = JSON.parse(result.stdout); }
  catch { throw new Error("GitHub usage response was invalid"); }
  return { status: method === "PUT" ? 200 : 200, data };
}

async function main() {
  const config = options(process.argv.slice(2));
  let raw;
  if (config.input) {
    try { raw = await readFile(config.input, "utf8"); }
    catch { throw new Error("Usage input could not be read"); }
  } else {
    const result = spawnSync("npx", [
      "--yes", `ccusage@${USAGE_VERSION}`, "daily", "--json", "--by-agent", "--timezone", USAGE_TIMEZONE,
    ], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 180_000 });
    if (result.status !== 0) throw new Error("Local usage collection failed");
    raw = result.stdout;
  }
  let input;
  try { input = JSON.parse(raw); }
  catch { throw new Error("Usage input was not valid JSON"); }
  const snapshot = buildPublicUsage(input);
  if (config.output) {
    await mkdir(dirname(config.output), { recursive: true });
    const temporary = `${config.output}.tmp-${process.pid}`;
    await writeFile(temporary, serializeUsage(snapshot), { mode: 0o644 });
    await rename(temporary, config.output);
  }
  const published = config.publish ? await publishPublicUsage(snapshot, { api: githubApi }) : undefined;
  const action = published ? (published.changed ? "Published" : "Already current") : "Saved";
  console.log(`${action}: ${snapshot.daily.length} days · ${snapshot.totals.totalTokens.toLocaleString("en-US")} tokens · $${snapshot.totals.totalCost.toFixed(2)} API-equivalent usage`);
}

main().catch((error) => {
  // Our explicit messages are safe. Never forward subprocess output or source data.
  const safe = new Set([
    "Missing usage command option", "Unknown usage command option", "Choose --output or --publish",
    "Usage input could not be read", "Local usage collection failed", "Usage input was not valid JSON",
    "Invalid usage data", "GitHub usage update failed", "GitHub usage response was invalid",
    "Public usage repository check failed", "Public usage snapshot could not be read",
    "Public usage snapshot is invalid", "Public usage snapshot could not be published",
  ]);
  console.error(safe.has(error.message) ? error.message : "Usage sync failed");
  process.exitCode = 1;
});
