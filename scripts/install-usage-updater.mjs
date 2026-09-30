import { mkdir, writeFile, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const label = "com.nimalp123.tokenmaxxing";
const target = resolve(homedir(), "Library/LaunchAgents", `${label}.plist`);
const preview = resolve(root, "artifacts", `${label}.plist`);
const service = `gui/${process.getuid()}/${label}`;
const nodeBinary = ["/opt/homebrew/bin/node", "/usr/local/bin/node", process.execPath].find(existsSync);
const escapeXml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

if (process.platform !== "darwin") throw new Error("This updater is for the MacBook's launchd service.");
if (process.argv.includes("--uninstall")) {
  try { execFileSync("/bin/launchctl", ["bootout", service], { stdio: "ignore" }); } catch { /* Already stopped. */ }
  await unlink(target).catch((error) => { if (error.code !== "ENOENT") throw error; });
  console.log("Tokenmaxxing's hourly Mac updater removed.");
  process.exit(0);
}

const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${label}</string>
  <key>ProgramArguments</key><array>
    <string>${escapeXml(nodeBinary)}</string>
    <string>${escapeXml(resolve(root, "scripts/sync-usage.mjs"))}</string>
    <string>--publish</string>
  </array>
  <key>WorkingDirectory</key><string>${escapeXml(root)}</string>
  <key>EnvironmentVariables</key><dict>
    <key>PATH</key><string>${escapeXml(`${dirname(nodeBinary)}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`)}</string>
  </dict>
  <key>StartInterval</key><integer>3600</integer>
  <key>RunAtLoad</key><true/>
  <key>ProcessType</key><string>Background</string>
  <key>StandardOutPath</key><string>${escapeXml(resolve(root, "artifacts/usage-updater.log"))}</string>
  <key>StandardErrorPath</key><string>${escapeXml(resolve(root, "artifacts/usage-updater-error.log"))}</string>
</dict></plist>
`;

await mkdir(dirname(preview), { recursive: true });
await writeFile(preview, plist, { mode: 0o600 });
execFileSync("/usr/bin/plutil", ["-lint", preview], { stdio: "inherit" });
if (process.argv.includes("--prepare")) {
  console.log(`Prepared hourly updater: ${preview}`);
  process.exit(0);
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, plist, { mode: 0o600 });
try { execFileSync("/bin/launchctl", ["bootout", service], { stdio: "ignore" }); } catch { /* First install. */ }
execFileSync("/bin/launchctl", ["bootstrap", `gui/${process.getuid()}`, target], { stdio: "inherit" });
console.log("Installed Tokenmaxxing's hourly updater. It publishes only sanitized usage aggregates while this Mac is awake.");
