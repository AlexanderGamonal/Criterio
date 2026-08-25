import type { ConceptProgress, PersistedState } from './types';

const DEFAULT_MIN_ITEMS = 3;

/**
 * Selecciona los conceptos para el bloque de repaso al abrir sesión.
 * Solo conceptos en 'practicando' con repaso vencido (dueAt <= now) son elegibles.
 * Prioriza fallos recientes y luego más días sin tocarse.
 * `maxItems` por defecto viene de settings.dailyReviewSize (configurable, spec: 3-5 ítems).
 */
export function selectReviewItems(
  state: PersistedState,
  now: number = Date.now(),
  maxItems: number = state.settings.dailyReviewSize,
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
