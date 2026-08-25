import { useMemo } from 'react';
import { useProgressStore } from '../progress/store';
import { createLLMAdapter } from '../engine/llm/createLLMAdapter';
import type { LLMAdapter } from '../engine/llm/types';

export function useLLMAdapter(): LLMAdapter {
  const provider = useProgressStore((s) => s.state.settings.llmProvider);
  const apiKey = useProgressStore((s) => s.apiKey);
  return useMemo(() => createLLMAdapter(provider, apiKey), [provider, apiKey]);
}
