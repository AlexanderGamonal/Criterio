import { describe, expect, it } from 'vitest';
import { parseEvaluationJson } from './parseEvaluationJson';

const validShape = {
  scores: [{ criterionId: 'c1', score: 3, maxScore: 4 }],
  strengths: ['tradujo el costo a riesgo de negocio'],
  gaps: ['usó jerga sin traducir'],
  clientReply: 'ahora sí entiendo el riesgo.',
};

describe('parseEvaluationJson', () => {
  it('parsea JSON estricto', () => {
    const result = parseEvaluationJson(JSON.stringify(validShape));
    expect(result?.isMock).toBe(false);
    expect(result?.clientReply).toBe(validShape.clientReply);
  });

  it('extrae JSON envuelto en markdown/prosa', () => {
    const wrapped = `Aquí está la evaluación:\n\`\`\`json\n${JSON.stringify(validShape)}\n\`\`\`\ngracias.`;
    const result = parseEvaluationJson(wrapped);
    expect(result?.clientReply).toBe(validShape.clientReply);
  });

  it('devuelve null si el shape no coincide', () => {
    expect(parseEvaluationJson(JSON.stringify({ foo: 'bar' }))).toBeNull();
  });

  it('devuelve null si no hay JSON en absoluto', () => {
    expect(parseEvaluationJson('esto no es json')).toBeNull();
  });
});
