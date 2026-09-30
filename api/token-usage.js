import snapshot from "../server/token-usage.snapshot.json" with { type: "json" };
import { createTokenUsageHandler } from "../server/token-usage.js";

export default createTokenUsageHandler({ fallback: snapshot });
