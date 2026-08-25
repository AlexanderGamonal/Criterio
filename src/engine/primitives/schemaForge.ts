import type { SchemaForgeExercise, SchemaTableSeed } from '../../content/types';
import type { ExerciseResult } from '../../progress/types';
import { runInvariants, type InvariantOutcome } from '../validators/runInvariants';

export interface SchemaForgeEvaluation {
  outcomes: InvariantOutcome[];
  correct: boolean;
}

export function evaluateSchemaForge(exercise: SchemaForgeExercise, schema: SchemaTableSeed[]): SchemaForgeEvaluation {
  const outcomes = runInvariants(schema, exercise.invariants);
  return { outcomes, correct: outcomes.every((o) => o.passed) };
}

export function toExerciseResult(
  exercise: SchemaForgeExercise,
  evaluation: SchemaForgeEvaluation,
  timestamp: number = Date.now(),
): ExerciseResult {
  return {
    exerciseId: exercise.id,
    primitiveType: 'schema-forge',
    concepts: exercise.concepts,
    correct: evaluation.correct,
    detail: evaluation.outcomes,
    timestamp,
  };
}
