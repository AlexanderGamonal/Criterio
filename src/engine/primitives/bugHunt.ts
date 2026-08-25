import type { BugHuntExercise } from '../../content/types';
import type { ExerciseResult } from '../../progress/types';

export interface BugHuntSubmission {
  selectedElementId: string;
  selectedCauseId: string;
}

export interface BugHuntEvaluation {
  placeCorrect: boolean;
  causeCorrect: boolean;
  correct: boolean;
}

export function evaluateBugHunt(exercise: BugHuntExercise, submission: BugHuntSubmission): BugHuntEvaluation {
  const placeCorrect = submission.selectedElementId === exercise.correctCulpritId;
  const causeCorrect = exercise.causeOptions.find((c) => c.id === submission.selectedCauseId)?.isCorrect ?? false;
  return { placeCorrect, causeCorrect, correct: placeCorrect && causeCorrect };
}

export function toExerciseResult(
  exercise: BugHuntExercise,
  evaluation: BugHuntEvaluation,
  timestamp: number = Date.now(),
): ExerciseResult {
  return {
    exerciseId: exercise.id,
    primitiveType: 'bug-hunt',
    concepts: exercise.concepts,
    correct: evaluation.correct,
    // lugar correcto, causa equivocada: fallo parcial con feedback específico.
    partial: evaluation.placeCorrect && !evaluation.causeCorrect,
    detail: evaluation,
    timestamp,
  };
}
