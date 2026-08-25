import type { TradeoffMatrixExercise } from '../../content/types';
import type { ExerciseResult } from '../../progress/types';

export interface TradeoffMatrixSubmission {
  selectedOptionId: string;
  selectedJustificationIds: string[];
}

export interface TradeoffMatrixEvaluation {
  optionCorrect: boolean;
  justificationsCorrect: boolean;
  /** El par decisión+justificación se evalúa junto: ambos deben ser correctos. */
  correct: boolean;
}

export function evaluateTradeoffMatrix(
  exercise: TradeoffMatrixExercise,
  submission: TradeoffMatrixSubmission,
): TradeoffMatrixEvaluation {
  const option = exercise.options.find((o) => o.id === submission.selectedOptionId);
  const optionCorrect = option?.isCorrect ?? false;

  const justificationById = new Map(exercise.justifications.map((j) => [j.id, j]));
  const rightCount = submission.selectedJustificationIds.length === exercise.requiredJustificationCount;
  const allCorrectKind = submission.selectedJustificationIds.every(
    (id) => justificationById.get(id)?.kind === 'correct',
  );

  const justificationsCorrect = rightCount && allCorrectKind;

  // Elegir la opción correcta por razones equivocadas es un error de concepto:
  // no consolida, aunque la decisión en sí haya sido acertada.
  return { optionCorrect, justificationsCorrect, correct: optionCorrect && justificationsCorrect };
}

export function toExerciseResult(
  exercise: TradeoffMatrixExercise,
  evaluation: TradeoffMatrixEvaluation,
  timestamp: number = Date.now(),
): ExerciseResult {
  return {
    exerciseId: exercise.id,
    primitiveType: 'tradeoff-matrix',
    concepts: exercise.concepts,
    correct: evaluation.correct,
    partial: evaluation.optionCorrect && !evaluation.justificationsCorrect,
    detail: evaluation,
    timestamp,
  };
}
