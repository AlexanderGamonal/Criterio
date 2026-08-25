import type {
  ClientArenaEndingNode,
  ClientArenaExercise,
  ClientArenaMarkerDelta,
  ClientArenaNode,
} from '../../content/types';
import type { EvaluationResult } from '../llm/types';
import type { ExerciseResult } from '../../progress/types';

export interface ClientArenaMarkers {
  budget: number;
  trust: number;
  techDebt: number;
}

export function getNode(exercise: ClientArenaExercise, nodeId: string): ClientArenaNode {
  const node = exercise.nodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`Nodo de diálogo no encontrado: "${nodeId}".`);
  return node;
}

export function applyMarkerDeltas(markers: ClientArenaMarkers, delta: ClientArenaMarkerDelta): ClientArenaMarkers {
  return {
    budget: markers.budget + (delta.budget ?? 0),
    trust: markers.trust + (delta.trust ?? 0),
    techDebt: markers.techDebt + (delta.techDebt ?? 0),
  };
}

function isEndingNode(node: ClientArenaNode): node is ClientArenaEndingNode {
  return node.type === 'ending';
}

function conditionMatches(condition: NonNullable<ClientArenaEndingNode['condition']>, markers: ClientArenaMarkers): boolean {
  const value = markers[condition.metric];
  return condition.operator === 'gte' ? value >= condition.value : value <= condition.value;
}

/**
 * Elige el desenlace según los marcadores acumulados: el primer nodo `ending`
 * cuya condición se cumple, o el que no tiene condición como caída por defecto.
 */
export function resolveEnding(exercise: ClientArenaExercise, markers: ClientArenaMarkers): ClientArenaEndingNode {
  const endings = exercise.nodes.filter(isEndingNode);
  const matched = endings.find((e) => e.condition && conditionMatches(e.condition, markers));
  if (matched) return matched;

  const fallback = endings.find((e) => !e.condition);
  if (fallback) return fallback;
  if (endings.length > 0) return endings[0];

  throw new Error('El ejercicio de ClientArena no define ningún nodo de desenlace.');
}

const MASTERY_THRESHOLD = 0.6;

export function toExerciseResult(
  exercise: ClientArenaExercise,
  evaluation: EvaluationResult,
  timestamp: number = Date.now(),
): ExerciseResult {
  const totalScore = evaluation.scores.reduce((sum, s) => sum + s.score, 0);
  const totalMax = evaluation.scores.reduce((sum, s) => sum + s.maxScore, 0);
  const ratio = totalMax > 0 ? totalScore / totalMax : 0;

  return {
    exerciseId: exercise.id,
    primitiveType: 'client-arena',
    concepts: exercise.concepts,
    correct: ratio >= MASTERY_THRESHOLD,
    detail: evaluation,
    timestamp,
  };
}
