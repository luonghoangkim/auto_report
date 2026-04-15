/**
 * AI Provider Factory
 *
 * Reads AI_PROVIDER env variable and returns the correct provider.
 * Default: "deterministic" (no paid key needed).
 *
 * To switch providers: set AI_PROVIDER=mock | openai | gemini in .env.local
 */

import type { AIProvider } from "./types";
import { DeterministicProvider } from "./providers/deterministic";
import { MockProvider } from "./providers/mock";

let _instance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (_instance) return _instance;

  const providerName = (process.env.AI_PROVIDER ?? "deterministic").toLowerCase();

  switch (providerName) {
    case "mock":
      _instance = new MockProvider();
      break;

    case "deterministic":
    default:
      _instance = new DeterministicProvider();
      break;
  }

  console.log(`[AI] Using provider: ${_instance.name}`);
  return _instance;
}

// Reset for testing
export function resetAIProvider() {
  _instance = null;
}
