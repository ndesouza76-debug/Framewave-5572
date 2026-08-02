import { createGateway } from "ai";

/** Self-hosted AI gateway (used for prompt enhancement / auto-titling). */
export const gateway = createGateway({
  baseURL: process.env.AI_GATEWAY_BASE_URL,
  apiKey: process.env.AI_GATEWAY_API_KEY,
});
