import { describe, expect, it } from 'vitest';
import { isModuleUnlocked } from './unlock';
import { createEmptyState } from './types';
import type { Module } from '../content/types';
import type { ConceptProgress, PersistedState } from './types';

function module(id: string, order: number, conceptIds: string[]): Module {
  return {
    id,
    order,
    title: id,
    clientContext: '',
    lessons: [{ id: `${id}-l1`, title: '', narrative: '', concepts: conceptIds, exercises: [] }],
  };
}

function withConsolidated(ids: string[]): PersistedState {
  const concepts: Record<string, ConceptProgress> = {};
  for (const id of ids) {
    concepts[id] = {
      conceptId: id,
      level: 'consolidado',
      distinctPrimitivesPassed: [],
      lastPracticedAt: 0,
      spacedRepetition: { intervalIndex: 0, dueAt: null, recentFailures: 0 },
    };
  }
  return { ...createEmptyState(), concepts };
}

describe('isModuleUnlocked', () => {
  const m1 = module('m1', 1, ['a', 'b', 'c']);
  const m2 = module('m2', 2, ['d', 'e']);
  const modules = [m1, m2];

  it('el primer módulo siempre está desbloqueado', () => {
    expect(isModuleUnlocked(modules, 'm1', createEmptyState())).toBe(true);
  });

  it('el siguiente módulo está bloqueado si <70% del anterior está consolidado', () => {
    const state = withConsolidated(['a']); // 1/3 = 33%
    expect(isModuleUnlocked(modules, 'm2', state)).toBe(false);
  });

  it('el siguiente módulo se desbloquea al llegar a >=70% consolidado', () => {
    const state = withConsolidated(['a', 'b', 'c']); // 100%
    expect(isModuleUnlocked(modules, 'm2', state)).toBe(true);
  });

  it('70% exacto desbloquea', () => {
    const mPrev = module('mPrev', 1, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
    const mNext = module('mNext', 2, ['z']);
    const state = withConsolidated(['a', 'b', 'c', 'd', 'e', 'f', 'g']); // 7/10 = 70%
    expect(isModuleUnlocked([mPrev, mNext], 'mNext', state)).toBe(true);
  });
});
