import type { VideoProvider } from "./types";
import { veoProvider } from "./veo";

/**
 * Provider registry. Add new providers (runway, luma, kling, pika) here.
 * The rest of the app resolves a provider by id via getVideoProvider().
 */
const providers: Record<string, VideoProvider> = {
  veo: veoProvider,
};

export function getVideoProvider(id = "veo"): VideoProvider {
  const p = providers[id];
  if (!p) throw new Error(`Unknown video provider: ${id}`);
  return p;
}

export type { VideoProvider, GenerateVideoInput, GenerateVideoResult } from "./types";
