import type { EvaluationResult } from './types';

/**
 * Parser tolerante: acepta JSON estricto o JSON envuelto en texto/markdown
 * (los modelos a veces devuelven ```json ... ``` o prosa alrededor).
 * Devuelve null si no logra extraer una forma válida de EvaluationResult.
 */
export function parseEvaluationJson(raw: string): EvaluationResult | null {
  const candidate = extractJsonObject(raw);
  if (!candidate) return null;

  try {
    const parsed = JSON.parse(candidate);
    if (!isEvaluationResultShape(parsed)) return null;
    return {
      scores: parsed.scores,
      strengths: parsed.strengths,
      gaps: parsed.gaps,
      clientReply: parsed.clientReply,
      isMock: false,
    };
  } catch {
    return null;
  }
}

function extractJsonObject(raw: string): string | null {
  const trimmed = raw.trim();
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // sigue abajo: intenta extraer el primer bloque {...}
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return trimmed.slice(start, end + 1);
}

function isEvaluationResultShape(value: unknown): value is Omit<EvaluationResult, 'isMock'> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.scores) &&
    Array.isArray(v.strengths) &&
    Array.isArray(v.gaps) &&
    typeof v.clientReply === 'string'
  );
}
