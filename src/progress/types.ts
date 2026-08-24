import type { ConceptId, PrimitiveType } from '../content/types';

// ---------------------------------------------------------------------------
// Resultado de un ejercicio
// ---------------------------------------------------------------------------

export interface ExerciseResult {
  exerciseId: string;
  primitiveType: PrimitiveType;
  concepts: ConceptId[];
  correct: boolean;
  /** Fallo parcial: p.ej. BugHunt con lugar correcto pero causa equivocada. */
  partial?: boolean;
  /** Detalle libre para feedback en UI (mensajes de invariantes, rúbrica, etc). */
  detail?: unknown;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Maestría por concepto
// ---------------------------------------------------------------------------

export type MasteryLevel = 'nuevo' | 'practicando' | 'consolidado';

export interface ConceptProgress {
  conceptId: ConceptId;
  level: MasteryLevel;
  /** Tipos de primitiva distintos en los que se acertó desde el último reinicio. */
  distinctPrimitivesPassed: PrimitiveType[];
  lastPracticedAt: number | null;
  /** Repaso espaciado tipo SM-2 simplificado. */
  spacedRepetition: {
    /** Índice en la secuencia de intervalos [1, 3, 7, 16, ...] días. */
    intervalIndex: number;
    dueAt: number | null;
    recentFailures: number;
  };
}

// ---------------------------------------------------------------------------
// Estado persistido
// ---------------------------------------------------------------------------

export const CURRENT_SCHEMA_VERSION = 1;

export interface PersistedState {
  schemaVersion: number;
  concepts: Record<ConceptId, ConceptProgress>;
  /** Historial acotado de resultados, para depuración y estadísticas simples. */
  history: ExerciseResult[];
  /** Config de usuario: proveedor LLM elegido, no la API key (esa va aparte). */
  settings: {
    llmProvider: 'mock' | 'gemini' | 'groq';
  };
}

export function createEmptyState(): PersistedState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    concepts: {},
    history: [],
    settings: { llmProvider: 'mock' },
  };
}
