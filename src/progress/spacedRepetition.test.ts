import { describe, expect, it } from 'vitest';
import { selectReviewItems } from './spacedRepetition';
import { createEmptyState } from './types';
import type { ConceptProgress, PersistedState } from './types';

function concept(overrides: Partial<ConceptProgress>): ConceptProgress {
  return {
    conceptId: 'c',
    level: 'practicando',
    distinctPrimitivesPassed: [],
    lastPracticedAt: 0,
    spacedRepetition: { intervalIndex: 0, dueAt: 0, recentFailures: 0 },
    ...overrides,
  };
}

function stateWith(concepts: Record<string, ConceptProgress>): PersistedState {
  return { ...createEmptyState(), concepts };
}

describe('selectReviewItems', () => {
  const now = 1_000_000;

  it('ignora conceptos nuevos o consolidados', () => {
    const state = stateWith({
      a: concept({ conceptId: 'a', level: 'nuevo', spacedRepetition: { intervalIndex: 0, dueAt: now - 1, recentFailures: 0 } }),
      b: concept({ conceptId: 'b', level: 'consolidado', spacedRepetition: { intervalIndex: 0, dueAt: now - 1, recentFailures: 0 } }),
    });
    expect(selectReviewItems(state, now)).toEqual([]);
  });

  it('ignora conceptos en practicando que aún no vencen', () => {
    const state = stateWith({
      a: concept({ conceptId: 'a', spacedRepetition: { intervalIndex: 0, dueAt: now + 1000, recentFailures: 0 } }),
    });
    expect(selectReviewItems(state, now)).toEqual([]);
  });

  it('prioriza fallos recientes sobre antigüedad', () => {
    const state = stateWith({
      old: concept({
        conceptId: 'old',
        lastPracticedAt: now - 100_000,
        spacedRepetition: { intervalIndex: 0, dueAt: now - 1, recentFailures: 0 },
      }),
      failed: concept({
        conceptId: 'failed',
        lastPracticedAt: now - 10_000,
        spacedRepetition: { intervalIndex: 0, dueAt: now - 1, recentFailures: 2 },
      }),
    });
    const items = selectReviewItems(state, now);
    expect(items[0].conceptId).toBe('failed');
    expect(items[1].conceptId).toBe('old');
  });

  it('entre iguales fallos recientes, prioriza más días sin tocarse', () => {
    const state = stateWith({
      recent: concept({
        conceptId: 'recent',
        lastPracticedAt: now - 1_000,
        spacedRepetition: { intervalIndex: 0, dueAt: now - 1, recentFailures: 0 },
      }),
      stale: concept({
        conceptId: 'stale',
        lastPracticedAt: now - 500_000,
        spacedRepetition: { intervalIndex: 0, dueAt: now - 1, recentFailures: 0 },
      }),
    });
    const items = selectReviewItems(state, now);
    expect(items[0].conceptId).toBe('stale');
  });

  it('limita a maxItems', () => {
    const concepts: Record<string, ConceptProgress> = {};
    for (let i = 0; i < 10; i++) {
      concepts[`c${i}`] = concept({
        conceptId: `c${i}`,
        spacedRepetition: { intervalIndex: 0, dueAt: now - 1, recentFailures: 0 },
      });
    }
    expect(selectReviewItems(stateWith(concepts), now, 5).length).toBe(5);
  });

  it('sin maxItems explícito, usa settings.dailyReviewSize del estado (configurable por el usuario)', () => {
    const concepts: Record<string, ConceptProgress> = {};
    for (let i = 0; i < 10; i++) {
      concepts[`c${i}`] = concept({
        conceptId: `c${i}`,
        spacedRepetition: { intervalIndex: 0, dueAt: now - 1, recentFailures: 0 },
      });
    }
    const state: PersistedState = {
      ...createEmptyState(),
      concepts,
      settings: { llmProvider: 'mock', dailyReviewSize: 3 },
    };
    expect(selectReviewItems(state, now).length).toBe(3);
  });
});
