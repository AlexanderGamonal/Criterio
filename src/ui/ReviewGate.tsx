import { useState } from 'react';
import type { Exercise, Module } from '../content/types';
import type { ConceptProgress, ExerciseResult } from '../progress/types';
import type { LLMAdapter } from '../engine/llm/types';
import { CONCEPTS } from '../content/loadModules';
import { ExerciseRunner } from './ExerciseRunner';

interface ReviewGateProps {
  modules: Module[];
  dueItems: ConceptProgress[];
  llmAdapter: LLMAdapter;
  onExerciseResult: (result: ExerciseResult) => void;
}

function findExerciseForConcept(modules: Module[], conceptId: string): Exercise | null {
  for (const module of modules) {
    for (const lesson of module.lessons) {
      const exercise = lesson.exercises.find((e) => e.concepts.includes(conceptId));
      if (exercise) return exercise;
    }
  }
  return null;
}

export function ReviewGate({ modules, dueItems, llmAdapter, onExerciseResult }: ReviewGateProps) {
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);

  const activeExercise = activeConceptId ? findExerciseForConcept(modules, activeConceptId) : null;

  return (
    <div className="space-y-6">
      <div className="px-4 py-3 rounded border border-laton/50 bg-laton/10">
        <h1 className="font-display text-xl text-laton mb-1">repaso pendiente</h1>
        <p className="text-papel text-sm">
          antes de seguir, repasa estos {dueItems.length} conceptos vencidos. no se puede saltar: es lo que sostiene
          el aprendizaje a largo plazo.
        </p>
      </div>

      <div className="grid gap-2">
        {dueItems.map((item) => {
          const concept = CONCEPTS.find((c) => c.id === item.conceptId);
          if (!concept) return null;
          const isActive = activeConceptId === item.conceptId;
          return (
            <button
              key={item.conceptId}
              type="button"
              onClick={() => setActiveConceptId(item.conceptId)}
              className={`text-left px-4 py-3 rounded border transition-colors ${
                isActive ? 'border-laton bg-laton/10' : 'border-grafito/30 hover:border-grafito bg-pliego'
              }`}
            >
              <p className="text-papel">{concept.name}</p>
              {item.spacedRepetition.recentFailures > 0 && (
                <p className="text-rojo text-xs font-mono mt-1">{item.spacedRepetition.recentFailures} fallo(s) reciente(s)</p>
              )}
            </button>
          );
        })}
      </div>

      {activeExercise && (
        <div className="border-t border-grafito/20 pt-6">
          <ExerciseRunner exercise={activeExercise} llmAdapter={llmAdapter} onResult={onExerciseResult} />
        </div>
      )}

      {activeConceptId && !activeExercise && (
        <p className="text-grafito text-sm">no se encontró un ejercicio para este concepto todavía.</p>
      )}
    </div>
  );
}
