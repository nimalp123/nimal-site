import { useEffect, useState } from "react";

type Counter = { registeredUsers: number; updatedAt: string };

export default function LiveUserCount() {
  const [counter, setCounter] = useState<Counter | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let stopped = false;
    let pending: AbortController | null = null;
    async function refresh() {
      if (document.hidden || pending || stopped) return;
      const controller = new AbortController();
      pending = controller;
      try {
        const response = await fetch("/api/rayaboy-stats", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Counter unavailable");
        const data: Counter = await response.json();
        if (
          !Number.isSafeInteger(data.registeredUsers) ||
          data.registeredUsers < 0 ||
          !Number.isFinite(Date.parse(data.updatedAt))
        )
          throw new Error("Counter unavailable");
        if (!stopped) {
          setCounter(data);
          setUnavailable(false);
        }
      } catch {
        if (!stopped && !controller.signal.aborted) setUnavailable(true);
      } finally {
        pending = null;
      }
    }
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    const onVisibility = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      pending?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const timestamp =
    counter &&
    new Date(counter.updatedAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  return (
    <div className="rb-live-users" aria-live="polite" aria-atomic="true">
      <div>
        <strong>
          {counter ? counter.registeredUsers.toLocaleString("en-US") : "—"}
        </strong>
        <span>registered accounts</span>
      </div>
      <div className="rb-live-status">
        <span className={`mono ${unavailable ? "rb-counter-unavailable" : ""}`}>
          {!unavailable && counter && <i aria-hidden="true" />}
          {unavailable
            ? "UPDATE UNAVAILABLE"
            : counter
              ? "LIVE FROM RAYABOY"
              : "CONNECTING"}
        </span>
        {counter && (
          <time dateTime={counter.updatedAt}>Updated {timestamp}</time>
        )}
      </div>
    </div>
  );
}
