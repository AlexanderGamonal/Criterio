import { describe, expect, it } from 'vitest';
import { evaluateBugHunt } from './bugHunt';
import type { BugHuntExercise } from '../../content/types';

const exercise: BugHuntExercise = {
  id: 'ex-bug',
  type: 'bug-hunt',
  title: 'Dirección repetida',
  prompt: '...',
  concepts: ['normalizacion-3fn'],
  symptom: 'un despacho llegó a la dirección vieja de un cliente',
  artifact: { kind: 'schema', content: '{}' },
  culprits: [
    { elementId: 'clientes.direccion', label: 'clientes.direccion' },
    { elementId: 'pedidos.direccion', label: 'pedidos.direccion' },
    { elementId: 'facturas.direccion', label: 'facturas.direccion' },
  ],
  correctCulpritId: 'pedidos.direccion',
  causeOptions: [
    { id: 'cause-denorm', text: 'la dirección está duplicada en varias tablas y no se sincronizó', isCorrect: true },
    { id: 'cause-fk', text: 'falta una foreign key', isCorrect: false },
  ],
};

describe('evaluateBugHunt', () => {
  it('correcto: lugar y causa correctos', () => {
    const evaluation = evaluateBugHunt(exercise, {
      selectedElementId: 'pedidos.direccion',
      selectedCauseId: 'cause-denorm',
    });
    expect(evaluation.correct).toBe(true);
  });

  it('fallo parcial: lugar correcto, causa equivocada', () => {
    const evaluation = evaluateBugHunt(exercise, {
      selectedElementId: 'pedidos.direccion',
      selectedCauseId: 'cause-fk',
    });
    expect(evaluation.placeCorrect).toBe(true);
    expect(evaluation.causeCorrect).toBe(false);
    expect(evaluation.correct).toBe(false);
  });

  it('incorrecto: lugar equivocado', () => {
    const evaluation = evaluateBugHunt(exercise, {
      selectedElementId: 'clientes.direccion',
      selectedCauseId: 'cause-denorm',
    });
    expect(evaluation.correct).toBe(false);
  });
});
