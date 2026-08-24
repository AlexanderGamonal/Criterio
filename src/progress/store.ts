import { create } from 'zustand';
import { loadState, saveState } from './persistence';
import type { PersistedState } from './types';

interface ProgressStore {
  state: PersistedState;
  /** Reemplaza el estado completo (usado por el motor de progreso en la Fase 2). */
  setState: (updater: (prev: PersistedState) => PersistedState) => void;
}

export const useProgressStore = create<ProgressStore>((set) => ({
  state: loadState(),
  setState: (updater) =>
    set((prev) => {
      const next = updater(prev.state);
      saveState(next);
      return { state: next };
    }),
}));
