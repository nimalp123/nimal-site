import snapshot from "../public/data/token-usage.json" with { type: "json" };
import { createTokenUsageHandler } from "../server/token-usage.js";

export default createTokenUsageHandler({ fallback: snapshot });
