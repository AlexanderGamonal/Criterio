import type { ConceptProgress, MasteryLevel, PersistedState } from './types';
import type { ExerciseResult } from './types';

export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 16] as const;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_HISTORY = 200;

function emptyConceptProgress(conceptId: string): ConceptProgress {
  return {
    conceptId,
    level: 'nuevo',
    distinctPrimitivesPassed: [],
    lastPracticedAt: null,
    spacedRepetition: { intervalIndex: 0, dueAt: null, recentFailures: 0 },
  };
}

function nextLevelOnFailure(level: MasteryLevel): MasteryLevel {
  if (level === 'consolidado') return 'practicando';
  if (level === 'practicando') return 'nuevo';
  return 'nuevo';
}

/**
 * Aplica un único resultado de ejercicio a un único concepto.
 * Reglas (ver spec):
 *  - nuevo -> practicando: con el primer acierto.
 *  - practicando -> consolidado: solo tras acertar en dos primitivas distintas.
 *    Repetir la misma primitiva no consolida.
 *  - un fallo baja un nivel y reinicia el contador de primitivas distintas.
 */
export function applyResultToConcept(
  prev: ConceptProgress | undefined,
  result: ExerciseResult,
  now: number,
): ConceptProgress {
  const current = prev ?? emptyConceptProgress(result.concepts[0]);
  const wasSuccess = result.correct;

  let level = current.level;
  let distinctPrimitivesPassed = current.distinctPrimitivesPassed;
  let recentFailures = current.spacedRepetition.recentFailures;
  let intervalIndex = current.spacedRepetition.intervalIndex;
  let dueAt = current.spacedRepetition.dueAt;

  if (wasSuccess) {
    if (level === 'nuevo') {
      level = 'practicando';
      distinctPrimitivesPassed = [result.primitiveType];
    } else if (level === 'practicando') {
      const distinctSet = new Set([...distinctPrimitivesPassed, result.primitiveType]);
      distinctPrimitivesPassed = Array.from(distinctSet);
      if (distinctSet.size >= 2) {
        level = 'consolidado';
      }
    }
    // level === 'consolidado' ya consolidado: un acierto adicional solo refuerza el repaso.
    dueAt = now + REVIEW_INTERVALS_DAYS[intervalIndex] * DAY_MS;
    intervalIndex = Math.min(intervalIndex + 1, REVIEW_INTERVALS_DAYS.length - 1);
    recentFailures = 0;
  } else {
    level = nextLevelOnFailure(level);
    distinctPrimitivesPassed = [];
    recentFailures += 1;
    intervalIndex = 0;
    dueAt = now + REVIEW_INTERVALS_DAYS[0] * DAY_MS;
  }

  return {
    conceptId: current.conceptId || result.concepts[0],
    level,
    distinctPrimitivesPassed,
    lastPracticedAt: now,
    spacedRepetition: { intervalIndex, dueAt, recentFailures },
  };
}

/** Aplica un resultado de ejercicio a todos los conceptos que ejercita, y anexa al historial. */
export function applyExerciseResult(
  state: PersistedState,
  result: ExerciseResult,
  now: number = Date.now(),
): PersistedState {
  const concepts = { ...state.concepts };
  for (const conceptId of result.concepts) {
    concepts[conceptId] = applyResultToConcept(concepts[conceptId], { ...result, concepts: [conceptId] }, now);
  }

  const history = [...state.history, result].slice(-MAX_HISTORY);

  return { ...state, concepts, history };
}
