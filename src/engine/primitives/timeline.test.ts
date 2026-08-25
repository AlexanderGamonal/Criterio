import { describe, expect, it } from 'vitest';
import { evaluateTimeline, simulateTimeline } from './timeline';
import type { TimelineExercise } from '../../content/types';

// Escenario clásico de "lost update": dos cajeros leen stock=10 y despachan 3 y 4
// respectivamente, pero ambos escriben sobre el valor leído en vez de restar
// atómicamente, así que la segunda escritura pisa a la primera.
const exercise: TimelineExercise = {
  id: 'ex-race',
  type: 'timeline',
  title: 'Carrera de stock',
  prompt: '...',
  concepts: ['race-condition-lectura-escritura'],
  initialState: { stock: 10 },
  operations: [
    { id: 'op-read-a', transactionId: 'tx-a', label: 'A lee stock', effect: { kind: 'read', key: 'stock' } },
    { id: 'op-write-a', transactionId: 'tx-a', label: 'A escribe stock=7', effect: { kind: 'write', key: 'stock', value: 7, mode: 'set' } },
    { id: 'op-read-b', transactionId: 'tx-b', label: 'B lee stock', effect: { kind: 'read', key: 'stock' } },
    { id: 'op-write-b', transactionId: 'tx-b', label: 'B escribe stock=6', effect: { kind: 'write', key: 'stock', value: 6, mode: 'set' } },
  ],
  expectedFinalState: { stock: 6 },
};

describe('simulateTimeline', () => {
  it('aplica los efectos de write en el orden dado, ignorando reads', () => {
    const order = ['op-read-a', 'op-write-a', 'op-read-b', 'op-write-b'];
    expect(simulateTimeline(exercise, order)).toEqual({ stock: 6 });
  });

  it('el resultado depende del orden elegido (evidencia la carrera)', () => {
    const orderBFirst = ['op-read-b', 'op-write-b', 'op-read-a', 'op-write-a'];
    expect(simulateTimeline(exercise, orderBFirst)).toEqual({ stock: 7 });
  });

  it('soporta mode delta para sumar/restar sobre el estado actual', () => {
    const deltaExercise: TimelineExercise = {
      ...exercise,
      initialState: { total: 100 },
      operations: [
        { id: 'op1', transactionId: 'tx-a', label: 'resta 30', effect: { kind: 'write', key: 'total', value: -30, mode: 'delta' } },
        { id: 'op2', transactionId: 'tx-b', label: 'suma 10', effect: { kind: 'write', key: 'total', value: 10, mode: 'delta' } },
      ],
    };
    expect(simulateTimeline(deltaExercise, ['op1', 'op2'])).toEqual({ total: 80 });
  });
});

describe('evaluateTimeline', () => {
  it('correcto cuando la predicción coincide con el estado simulado', () => {
    const order = ['op-read-a', 'op-write-a', 'op-read-b', 'op-write-b'];
    const evaluation = evaluateTimeline(exercise, { order, predictedFinalState: { stock: 6 } });
    expect(evaluation.correct).toBe(true);
  });

  it('incorrecto cuando la predicción no coincide (no se detectó la carrera)', () => {
    const order = ['op-read-a', 'op-write-a', 'op-read-b', 'op-write-b'];
    const evaluation = evaluateTimeline(exercise, { order, predictedFinalState: { stock: 3 } });
    expect(evaluation.correct).toBe(false);
    expect(evaluation.actualFinalState).toEqual({ stock: 6 });
  });
});
