import { describe, expect, it } from 'vitest';
import { applyExerciseResult } from './mastery';
import { createEmptyState } from './types';
import type { ExerciseResult } from './types';

function result(overrides: Partial<ExerciseResult>): ExerciseResult {
  return {
    exerciseId: 'ex-1',
    primitiveType: 'schema-forge',
    concepts: ['c1'],
    correct: true,
    timestamp: 1000,
    ...overrides,
  };
}

describe('applyExerciseResult - consolidación de maestría', () => {
  it('nuevo -> practicando tras el primer acierto', () => {
    const state = applyExerciseResult(createEmptyState(), result({ correct: true }), 1000);
    expect(state.concepts.c1.level).toBe('practicando');
    expect(state.concepts.c1.distinctPrimitivesPassed).toEqual(['schema-forge']);
  });

  it('NO consolida al acertar dos veces con la misma primitiva', () => {
    let state = createEmptyState();
    state = applyExerciseResult(state, result({ correct: true, primitiveType: 'schema-forge' }), 1000);
    state = applyExerciseResult(state, result({ correct: true, primitiveType: 'schema-forge' }), 2000);
    expect(state.concepts.c1.level).toBe('practicando');
  });

  it('consolida al acertar en dos primitivas distintas', () => {
    let state = createEmptyState();
    state = applyExerciseResult(state, result({ correct: true, primitiveType: 'schema-forge' }), 1000);
    state = applyExerciseResult(state, result({ correct: true, primitiveType: 'tradeoff-matrix' }), 2000);
    expect(state.concepts.c1.level).toBe('consolidado');
  });

  it('un fallo baja un nivel y reinicia el contador de primitivas distintas', () => {
    let state = createEmptyState();
    state = applyExerciseResult(state, result({ correct: true, primitiveType: 'schema-forge' }), 1000);
    state = applyExerciseResult(state, result({ correct: true, primitiveType: 'tradeoff-matrix' }), 2000);
    expect(state.concepts.c1.level).toBe('consolidado');

    state = applyExerciseResult(state, result({ correct: false, primitiveType: 'timeline' }), 3000);
    expect(state.concepts.c1.level).toBe('practicando');
    expect(state.concepts.c1.distinctPrimitivesPassed).toEqual([]);
  });

  it('un fallo desde practicando baja a nuevo', () => {
    let state = createEmptyState();
    state = applyExerciseResult(state, result({ correct: true }), 1000);
    expect(state.concepts.c1.level).toBe('practicando');
    state = applyExerciseResult(state, result({ correct: false }), 2000);
    expect(state.concepts.c1.level).toBe('nuevo');
  });

  it('un fallo en nuevo se mantiene en nuevo', () => {
    const state = applyExerciseResult(createEmptyState(), result({ correct: false }), 1000);
    expect(state.concepts.c1.level).toBe('nuevo');
  });

  it('un resultado afecta a todos los conceptos que ejercita el ejercicio', () => {
    const state = applyExerciseResult(createEmptyState(), result({ correct: true, concepts: ['c1', 'c2'] }), 1000);
    expect(state.concepts.c1.level).toBe('practicando');
    expect(state.concepts.c2.level).toBe('practicando');
  });

  it('anexa al historial y lo trunca a MAX_HISTORY', () => {
    let state = createEmptyState();
    for (let i = 0; i < 210; i++) {
      state = applyExerciseResult(state, result({ correct: true, timestamp: i }), i);
    }
    expect(state.history.length).toBe(200);
    expect(state.history[state.history.length - 1].timestamp).toBe(209);
  });

  it('un acierto agenda el próximo repaso 1 día después', () => {
    const now = 1_000_000;
    const state = applyExerciseResult(createEmptyState(), result({ correct: true }), now);
    const dueAt = state.concepts.c1.spacedRepetition.dueAt!;
    expect(dueAt - now).toBe(24 * 60 * 60 * 1000);
  });
});
