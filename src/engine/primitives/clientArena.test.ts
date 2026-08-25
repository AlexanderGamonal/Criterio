import { describe, expect, it } from 'vitest';
import { applyMarkerDeltas, resolveEnding } from './clientArena';
import type { ClientArenaExercise } from '../../content/types';

const exercise: ClientArenaExercise = {
  id: 'ex-marta',
  type: 'client-arena',
  title: 'Marta pregunta por el Excel',
  prompt: '...',
  concepts: ['deuda-tecnica'],
  initialMarkers: { budget: 100, trust: 50, techDebt: 0 },
  startNodeId: 'n1',
  nodes: [
    {
      id: 'n1',
      type: 'multiple-choice',
      clientLine: '¿por qué no lo haces como el Excel?',
      choices: [
        { id: 'c1', text: 'explico el riesgo del incidente de los 2.3M', deltas: { trust: 10 }, nextNodeId: 'end-good' },
        { id: 'c2', text: 'le doy la razón y recorto el modelo', deltas: { techDebt: 20, trust: -5 }, nextNodeId: 'end-bad' },
      ],
    },
    {
      id: 'end-good',
      type: 'ending',
      condition: { metric: 'trust', operator: 'gte', value: 55 },
      text: 'Marta confía en el plan.',
    },
    {
      id: 'end-bad',
      type: 'ending',
      condition: { metric: 'techDebt', operator: 'gte', value: 15 },
      text: 'El sistema queda frágil desde el día uno.',
    },
    {
      id: 'end-default',
      type: 'ending',
      text: 'Un desenlace neutro.',
    },
  ],
};

describe('applyMarkerDeltas', () => {
  it('suma los deltas a los marcadores actuales', () => {
    const result = applyMarkerDeltas({ budget: 100, trust: 50, techDebt: 0 }, { trust: 10, techDebt: 5 });
    expect(result).toEqual({ budget: 100, trust: 60, techDebt: 5 });
  });
});

describe('resolveEnding', () => {
  it('elige el ending cuya condición se cumple', () => {
    const ending = resolveEnding(exercise, { budget: 100, trust: 60, techDebt: 0 });
    expect(ending.id).toBe('end-good');
  });

  it('elige otro ending si su condición es la que se cumple', () => {
    const ending = resolveEnding(exercise, { budget: 100, trust: 40, techDebt: 20 });
    expect(ending.id).toBe('end-bad');
  });

  it('cae al ending sin condición cuando ninguna condición se cumple', () => {
    const ending = resolveEnding(exercise, { budget: 100, trust: 40, techDebt: 0 });
    expect(ending.id).toBe('end-default');
  });
});
