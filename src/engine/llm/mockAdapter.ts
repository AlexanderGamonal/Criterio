import type { EvaluationRequest, EvaluationResult, LLMAdapter } from './types';

/**
 * Adaptador sin modelo real. Da una puntuación heurística basada en cobertura
 * de palabras clave de la rúbrica y longitud de la respuesta, para que la app
 * sea 100% funcional sin ninguna API key.
 */
export class MockAdapter implements LLMAdapter {
  async evaluate(input: EvaluationRequest): Promise<EvaluationResult> {
    const response = input.userResponse.toLowerCase();
    const wordCount = response.trim().split(/\s+/).filter(Boolean).length;

    const scores = input.rubric.map((criterion) => {
      const keywords = criterion.description
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 4);
      const hits = keywords.filter((k) => response.includes(k)).length;
      const coverage = keywords.length > 0 ? hits / keywords.length : 0;
      const lengthBonus = wordCount >= 20 ? 0.2 : 0;
      const score = Math.min(1, coverage + lengthBonus) * criterion.weight;
      return { criterionId: criterion.id, score, maxScore: criterion.weight };
    });

    const totalRatio =
      scores.reduce((s, x) => s + x.score, 0) / Math.max(1, scores.reduce((s, x) => s + x.maxScore, 0));

    return {
      scores,
      strengths:
        totalRatio > 0.4 ? ['tu respuesta toca varios puntos de la rúbrica.'] : [],
      gaps:
        totalRatio <= 0.4
          ? ['sin una API key configurada, esta es una evaluación aproximada: agrega una clave de Gemini o Groq para feedback real.']
          : ['revisa si mencionaste el costo de negocio del incidente, no solo el detalle técnico.'],
      clientReply:
        totalRatio > 0.6
          ? 'entiendo, gracias por explicarlo con esos términos.'
          : 'sigo sin entender qué gano yo con eso. explícamelo de nuevo, más simple.',
      isMock: true,
    };
  }
}
