import { describe, expect, it } from 'vitest';
import { MockAdapter } from './mockAdapter';

describe('MockAdapter', () => {
  it('siempre marca isMock true y respeta el máximo de la rúbrica', async () => {
    const adapter = new MockAdapter();
    const result = await adapter.evaluate({
      clientLine: '¿por qué tarda tanto?',
      userResponse: 'porque estamos evitando perder dinero como con el incidente de 2.3 millones',
      rubric: [{ id: 'r1', description: 'traduce el costo técnico a riesgo de negocio dinero incidente', weight: 4 }],
    });
    expect(result.isMock).toBe(true);
    expect(result.scores[0].score).toBeLessThanOrEqual(result.scores[0].maxScore);
    expect(typeof result.clientReply).toBe('string');
  });

  it('funciona sin ninguna coincidencia de palabras clave', async () => {
    const adapter = new MockAdapter();
    const result = await adapter.evaluate({
      clientLine: 'x',
      userResponse: 'no sé',
      rubric: [{ id: 'r1', description: 'algo totalmente distinto irrelevante', weight: 2 }],
    });
    expect(result.scores[0].score).toBe(0);
  });
});
