import type { ClientArenaRubricCriterion } from '../../content/types';

export interface EvaluationRequest {
  /** Línea del cliente que provocó la respuesta del usuario. */
  clientLine: string;
  /** Respuesta escrita libre del usuario. */
  userResponse: string;
  rubric: ClientArenaRubricCriterion[];
  /** Contexto narrativo adicional (incidente de negocio, cifras, etc). */
  context?: string;
}

export interface RubricScore {
  criterionId: string;
  score: number;
  /** máximo teórico según el peso del criterio, para normalizar en UI. */
  maxScore: number;
}

export interface EvaluationResult {
  scores: RubricScore[];
  strengths: string[];
  gaps: string[];
  /** Réplica del cliente en su propia voz, reaccionando a la respuesta. */
  clientReply: string;
  /** true si el resultado viene de MockAdapter en vez de un LLM real. */
  isMock: boolean;
}

export interface LLMAdapter {
  evaluate(input: EvaluationRequest): Promise<EvaluationResult>;
}
