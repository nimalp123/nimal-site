import type { IncomingMessage, ServerResponse } from "node:http";

export function createRayaboyStatsHandler(options?: {
  getCredentials?: () => { baseUrl?: string; apiKey?: string };
  fetchImpl?: typeof fetch;
  now?: () => number;
}): (request: IncomingMessage, response: ServerResponse) => Promise<void>;
