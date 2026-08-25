import { create } from 'zustand';
import { clearApiKey, loadApiKey, loadState, saveApiKey, saveState } from './persistence';
import type { PersistedState } from './types';
import type { LLMProvider } from '../engine/llm/createLLMAdapter';

interface ProgressStore {
  state: PersistedState;
  apiKey: string | null;
  /** Reemplaza el estado completo (usado por el motor de progreso). */
  setState: (updater: (prev: PersistedState) => PersistedState) => void;
  setLlmProvider: (provider: LLMProvider) => void;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

export const useProgressStore = create<ProgressStore>((set) => ({
  state: loadState(),
  apiKey: loadApiKey(),
  setState: (updater) =>
    set((prev) => {
      const next = updater(prev.state);
      saveState(next);
      return { state: next };
    }),
  setLlmProvider: (provider) =>
    set((prev) => {
      const next = { ...prev.state, settings: { ...prev.state.settings, llmProvider: provider } };
      saveState(next);
      return { state: next };
    }),
  setApiKey: (key) => {
    saveApiKey(key);
    set({ apiKey: key });
  },
  clearApiKey: () => {
    clearApiKey();
    set({ apiKey: null });
  },
}));
