import type { LLMAdapter } from './types';
import { MockAdapter } from './mockAdapter';
import { GeminiAdapter } from './geminiAdapter';
import { GroqAdapter } from './groqAdapter';

export type LLMProvider = 'mock' | 'gemini' | 'groq';

/**
 * Punto único de selección de proveedor. El resto de la app solo conoce
 * `LLMAdapter`; cambiar de proveedor es cambiar esta función.
 */
export function createLLMAdapter(provider: LLMProvider, apiKey: string | null): LLMAdapter {
  if (provider === 'gemini' && apiKey) return new GeminiAdapter(apiKey);
  if (provider === 'groq' && apiKey) return new GroqAdapter(apiKey);
  return new MockAdapter();
}
