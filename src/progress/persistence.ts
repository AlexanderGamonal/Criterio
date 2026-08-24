import { CURRENT_SCHEMA_VERSION, createEmptyState, type PersistedState } from './types';

const STORAGE_KEY = 'criterio:progress';

/**
 * Migraciones tolerantes: cada función recibe el estado en su versión y
 * devuelve el estado en la siguiente versión. Si algo no se puede migrar,
 * se descarta ese fragmento en vez de romper la carga completa.
 */
const migrations: Record<number, (state: any) => any> = {
  // 0 -> 1: no-op de ejemplo para cuando exista una v0 real en el futuro.
};

function migrate(raw: any): PersistedState {
  let state = raw;
  let version = typeof state?.schemaVersion === 'number' ? state.schemaVersion : 0;

  while (version < CURRENT_SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) {
      // No hay ruta de migración conocida: conserva lo reconocible, descarta el resto.
      return coerceToCurrentShape(state);
    }
    try {
      state = step(state);
    } catch {
      return coerceToCurrentShape(state);
    }
    version += 1;
  }

  return coerceToCurrentShape(state);
}

/** Toma lo que se pueda del estado crudo y completa el resto con valores por defecto. */
function coerceToCurrentShape(raw: any): PersistedState {
  const base = createEmptyState();
  if (!raw || typeof raw !== 'object') return base;

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    concepts: raw.concepts && typeof raw.concepts === 'object' ? raw.concepts : base.concepts,
    history: Array.isArray(raw.history) ? raw.history : base.history,
    settings: {
      llmProvider:
        raw.settings?.llmProvider === 'gemini' || raw.settings?.llmProvider === 'groq'
          ? raw.settings.llmProvider
          : base.settings.llmProvider,
    },
  };
}

export function loadState(): PersistedState {
  if (typeof localStorage === 'undefined') return createEmptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyState();
    return migrate(JSON.parse(raw));
  } catch {
    return createEmptyState();
  }
}

export function saveState(state: PersistedState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // almacenamiento lleno o no disponible: se ignora, no rompe la app.
  }
}

// La API key del proveedor LLM se guarda aparte, nunca junto al progreso,
// para que sea trivial de excluir de exports/debug del estado de progreso.
const API_KEY_STORAGE_KEY = 'criterio:llm-api-key';

export function loadApiKey(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function saveApiKey(key: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function clearApiKey(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}
