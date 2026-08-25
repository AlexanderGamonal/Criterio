import type { TimelineExercise, TimelineOperation } from '../../content/types';
import type { ExerciseResult } from '../../progress/types';

export type TimelineState = Record<string, number | string>;

export interface TimelineStep {
  operationId: string;
  stateAfter: TimelineState;
}

function applyOperation(state: TimelineState, op: TimelineOperation): TimelineState {
  if (op.effect.kind !== 'write') return state;

  const { key, value, mode = 'set' } = op.effect;
  if (mode === 'delta') {
    const current = Number(state[key] ?? 0);
    const delta = Number(value ?? 0);
    return { ...state, [key]: current + delta };
  }
  return { ...state, [key]: value ?? state[key] };
}

/** Simula la ejecución de las operaciones en el orden dado, devolviendo cada paso para animar. */
export function simulateTimelineSteps(exercise: TimelineExercise, order: string[]): TimelineStep[] {
  const byId = new Map(exercise.operations.map((op) => [op.id, op]));
  let state = { ...exercise.initialState };
  const steps: TimelineStep[] = [];

  for (const opId of order) {
    const op = byId.get(opId);
    if (!op) continue;
    state = applyOperation(state, op);
    steps.push({ operationId: opId, stateAfter: state });
  }

  return steps;
}

export function simulateTimeline(exercise: TimelineExercise, order: string[]): TimelineState {
  const steps = simulateTimelineSteps(exercise, order);
  return steps.length > 0 ? steps[steps.length - 1].stateAfter : { ...exercise.initialState };
}

function statesMatch(a: TimelineState, b: TimelineState): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (String(a[key]) !== String(b[key])) return false;
  }
  return true;
}

export interface TimelineSubmission {
  order: string[];
  predictedFinalState: TimelineState;
}

export interface TimelineEvaluation {
  actualFinalState: TimelineState;
  correct: boolean;
}

export function evaluateTimeline(exercise: TimelineExercise, submission: TimelineSubmission): TimelineEvaluation {
  const actualFinalState = simulateTimeline(exercise, submission.order);
  return { actualFinalState, correct: statesMatch(actualFinalState, submission.predictedFinalState) };
}

export function toExerciseResult(
  exercise: TimelineExercise,
  evaluation: TimelineEvaluation,
  timestamp: number = Date.now(),
): ExerciseResult {
  return {
    exerciseId: exercise.id,
    primitiveType: 'timeline',
    concepts: exercise.concepts,
    correct: evaluation.correct,
    detail: evaluation,
    timestamp,
  };
}
