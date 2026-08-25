import type { ConceptId, Module } from '../content/types';
import type { PersistedState } from './types';

const UNLOCK_THRESHOLD = 0.7;

function consolidatedRatio(conceptIds: ConceptId[], state: PersistedState): number {
  if (conceptIds.length === 0) return 1;
  const consolidated = conceptIds.filter((id) => state.concepts[id]?.level === 'consolidado').length;
  return consolidated / conceptIds.length;
}

function moduleConceptIds(module: Module): ConceptId[] {
  const ids = new Set<ConceptId>();
  for (const lesson of module.lessons) {
    for (const id of lesson.concepts) ids.add(id);
  }
  return Array.from(ids);
}

/**
 * Un módulo se desbloquea cuando >=70% de los conceptos del módulo anterior
 * están en 'consolidado'. El primer módulo (por `order`) siempre está abierto.
 */
export function isModuleUnlocked(modules: Module[], targetModuleId: string, state: PersistedState): boolean {
  const sorted = [...modules].sort((a, b) => a.order - b.order);
  const targetIndex = sorted.findIndex((m) => m.id === targetModuleId);
  if (targetIndex <= 0) return true;

  const previous = sorted[targetIndex - 1];
  const ratio = consolidatedRatio(moduleConceptIds(previous), state);
  return ratio >= UNLOCK_THRESHOLD;
}
