import type { IncomingMessage, ServerResponse } from "node:http";

export function createTokenUsageHandler(options?: {
  fetchImpl?: typeof fetch;
  now?: () => number;
  fallback?: unknown;
}): (request: IncomingMessage, response: ServerResponse) => Promise<void>;
