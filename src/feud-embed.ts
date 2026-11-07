export const GAME_DESTINATIONS = {
  production: "https://s2gk84v4.insforge.site/",
  staging: "https://f7w576rx.insforge.site/",
};

export const LEGACY_GAME_ORIGIN = "https://feud-night-nimz.boundlessnova2.chatgpt.site";
const PERSONAL_SITE_ORIGINS = ["https://www.nimalp123.com", "https://nimalp123.com"];

type SavedSeat = { code: string; playerId: string; token: string };
type MigratedSeat = Pick<SavedSeat, "code" | "playerId">;
type RelayEvent = Pick<MessageEvent, "origin" | "source" | "data">;
type RelayOptions = {
  gameWindow: Window;
  gameOrigin: string;
  legacyWindow: Window;
  requestedCode: string | null;
  isMigrated: (seat: MigratedSeat) => boolean;
  markMigrated: (seat: MigratedSeat) => void;
  closeProbe: () => void;
};

export function requestedGameRoom(search: string): string | null {
  const code = new URLSearchParams(search).get("room")?.toUpperCase() ?? "";
  return /^[A-Z0-9]{6}$/.test(code) ? code : null;
}

export function gameDestination(environment: keyof typeof GAME_DESTINATIONS, search: string): URL {
  const url = new URL(GAME_DESTINATIONS[environment]);
  const code = requestedGameRoom(search);
  if (code) url.searchParams.set("room", code);
  return url;
}

function savedSeat(value: unknown): SavedSeat | null {
  if (!value || typeof value !== "object") return null;
  const seat = value as Partial<SavedSeat>;
  if (typeof seat.code !== "string" || !/^[A-Z0-9]{6}$/.test(seat.code)
    || typeof seat.playerId !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(seat.playerId)
    || typeof seat.token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(seat.token)) return null;
  return { code: seat.code, playerId: seat.playerId, token: seat.token };
}

export function legacySeatRelay(options: RelayOptions) {
  let ready = false;
  let pending: SavedSeat | null = null;
  let finished = false;

  function dispose() {
    if (finished) return;
    finished = true;
    pending = null;
    options.closeProbe();
  }

  function forward() {
    if (ready && pending) {
      options.gameWindow.postMessage({ type: "feud:restore-seat", session: pending }, options.gameOrigin);
    }
  }

  function receive(event: RelayEvent) {
    if (finished || !event.data || typeof event.data !== "object") return;
    if (event.source === options.legacyWindow && event.origin === LEGACY_GAME_ORIGIN && event.data.type === "feud:legacy-seat") {
      if (event.data.session === null) {
        dispose();
        return;
      }
      const seat = savedSeat(event.data.session);
      if (!seat || (options.requestedCode && seat.code !== options.requestedCode)) return;
      try {
        if (options.isMigrated({ code: seat.code, playerId: seat.playerId })) {
          dispose();
          return;
        }
      } catch {
        // A browser that blocks storage can still restore a seat on this page.
      }
      pending = seat;
      forward();
      return;
    }
    if (event.source !== options.gameWindow || event.origin !== options.gameOrigin) return;
    if (event.data.type === "feud:seat-ready") {
      ready = true;
      forward();
    } else if (event.data.type === "feud:seat-received" && pending
      && pending.code === event.data.code && pending.playerId === event.data.playerId) {
      try {
        options.markMigrated({ code: pending.code, playerId: pending.playerId });
      } catch {
        // The current transfer still completes when the browser blocks storage.
      }
      dispose();
    }
  }

  return { receive, dispose };
}

function migratedSeatKey(seat: MigratedSeat): string {
  return `feud-night-migrated-seat:${seat.code}:${seat.playerId}`;
}

function mountGame() {
  const game = document.getElementById("game") as HTMLIFrameElement;
  const directLink = document.getElementById("direct-game") as HTMLAnchorElement;
  const environment = document.body.dataset.environment === "staging" ? "staging" : "production";
  const destination = gameDestination(environment, window.location.search);
  directLink.href = destination.href;

  if (environment === "production" && PERSONAL_SITE_ORIGINS.includes(window.location.origin) && game.contentWindow) {
    const probe = document.createElement("iframe");
    probe.hidden = true;
    probe.title = "Restore your saved Feud Night seat";
    document.body.append(probe);
    const probeUrl = new URL(LEGACY_GAME_ORIGIN);
    probeUrl.searchParams.set("seat_migration", "1");
    const code = requestedGameRoom(window.location.search);
    if (code) probeUrl.searchParams.set("room", code);
    let timeout: number;
    const relay = legacySeatRelay({
      gameWindow: game.contentWindow,
      gameOrigin: destination.origin,
      legacyWindow: probe.contentWindow!,
      requestedCode: code,
      isMigrated: (seat) => window.localStorage.getItem(migratedSeatKey(seat)) === "1",
      markMigrated: (seat) => window.localStorage.setItem(migratedSeatKey(seat), "1"),
      closeProbe() {
        window.clearTimeout(timeout);
        window.removeEventListener("message", relay.receive);
        window.removeEventListener("pagehide", relay.dispose);
        probe.remove();
      },
    });
    window.addEventListener("message", relay.receive);
    window.addEventListener("pagehide", relay.dispose, { once: true });
    timeout = window.setTimeout(relay.dispose, 30_000);
    probe.src = probeUrl.href;
  }
  game.src = destination.href;
}

if (typeof document !== "undefined") mountGame();
