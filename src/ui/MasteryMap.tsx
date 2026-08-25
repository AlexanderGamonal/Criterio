import { Lock } from 'lucide-react';
import type { Module } from '../content/types';
import type { PersistedState } from '../progress/types';
import { isModuleUnlocked } from '../progress/unlock';
import { CONCEPTS } from '../content/loadModules';

interface MasteryMapProps {
  modules: Module[];
  state: PersistedState;
  onOpenModule: (moduleId: string) => void;
  onOpenConcept: (conceptId: string) => void;
}

const LEVEL_CLASS: Record<string, string> = {
  nuevo: 'bg-grafito/30 text-grafito',
  practicando: 'bg-laton/20 text-laton border border-laton/50',
  consolidado: 'bg-verdin/20 text-verdin border border-verdin/50',
};

export function MasteryMap({ modules, state, onOpenModule, onOpenConcept }: MasteryMapProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-papel mb-1">mapa de maestría</h1>
        <p className="text-grafito">la única métrica: qué tan consolidado tienes cada concepto.</p>
      </div>

      <div className="space-y-4">
        {modules.map((module) => {
          const unlocked = isModuleUnlocked(modules, module.id, state);
          const moduleConceptIds = new Set(module.lessons.flatMap((l) => l.concepts));
          const concepts = CONCEPTS.filter((c) => moduleConceptIds.has(c.id));

          return (
            <div key={module.id} className={`border border-grafito/30 rounded p-4 bg-pliego ${!unlocked ? 'opacity-60' : ''}`}>
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => onOpenModule(module.id)}
                className="w-full text-left flex items-start justify-between gap-3 disabled:cursor-not-allowed"
              >
                <div>
                  <h2 className="font-display text-lg text-papel">{module.title}</h2>
                  {module.isStub ? (
                    <p className="text-grafito text-sm">próximamente</p>
                  ) : (
                    <p className="text-grafito text-sm">{concepts.length} conceptos</p>
                  )}
                </div>
                {!unlocked && <Lock className="text-grafito shrink-0 mt-1" size={18} />}
              </button>

              {unlocked && concepts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {concepts.map((concept) => {
                    const level = state.concepts[concept.id]?.level ?? 'nuevo';
                    return (
                      <button
                        key={concept.id}
                        type="button"
                        title={`ir a la lección de "${concept.name}"`}
                        onClick={() => onOpenConcept(concept.id)}
                        className={`text-xs font-mono px-2 py-1 rounded hover:brightness-125 transition-[filter] ${LEVEL_CLASS[level]}`}
                      >
                        {concept.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {!unlocked && (
                <p className="text-grafito text-sm mt-2">
                  se desbloquea al consolidar el 70% de los conceptos del módulo anterior.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
