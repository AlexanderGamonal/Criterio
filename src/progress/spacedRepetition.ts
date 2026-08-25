import type { ConceptProgress, PersistedState } from './types';

const DEFAULT_MIN_ITEMS = 3;
const DEFAULT_MAX_ITEMS = 5;

/**
 * Selecciona los conceptos para el bloque de repaso al abrir sesión.
 * Solo conceptos en 'practicando' con repaso vencido (dueAt <= now) son elegibles.
 * Prioriza fallos recientes y luego más días sin tocarse.
 */
export function selectReviewItems(
  state: PersistedState,
  now: number = Date.now(),
  maxItems: number = DEFAULT_MAX_ITEMS,
): ConceptProgress[] {
  const due = Object.values(state.concepts).filter(
    (c) => c.level === 'practicando' && c.spacedRepetition.dueAt !== null && c.spacedRepetition.dueAt <= now,
  );

  due.sort((a, b) => {
    if (b.spacedRepetition.recentFailures !== a.spacedRepetition.recentFailures) {
      return b.spacedRepetition.recentFailures - a.spacedRepetition.recentFailures;
    }
    const aLast = a.lastPracticedAt ?? 0;
    const bLast = b.lastPracticedAt ?? 0;
    return aLast - bLast; // más antiguo primero (más días sin tocarse)
  });

  return due.slice(0, maxItems);
}

export function hasDueReview(state: PersistedState, now: number = Date.now()): boolean {
  return selectReviewItems(state, now, DEFAULT_MIN_ITEMS).length > 0;
}
