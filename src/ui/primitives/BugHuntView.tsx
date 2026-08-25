import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { BugHuntExercise } from '../../content/types';
import { evaluateBugHunt, type BugHuntEvaluation } from '../../engine/primitives/bugHunt';

interface BugHuntViewProps {
  exercise: BugHuntExercise;
  onComplete: (evaluation: BugHuntEvaluation) => void;
}

export function BugHuntView({ exercise, onComplete }: BugHuntViewProps) {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedCauseId, setSelectedCauseId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<BugHuntEvaluation | null>(null);

  function handleSubmit() {
    if (!selectedElementId || !selectedCauseId) return;
    const result = evaluateBugHunt(exercise, { selectedElementId, selectedCauseId });
    setEvaluation(result);
    onComplete(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-papel mb-1">{exercise.title}</h2>
        <p className="text-grafito">{exercise.prompt}</p>
      </div>

      <div className="px-4 py-3 rounded border border-rojo/50 bg-rojo/10">
        <p className="text-sm uppercase tracking-wide text-rojo mb-1">síntoma reportado</p>
        <p className="text-papel">{exercise.symptom}</p>
      </div>

      <pre className="font-mono text-sm bg-pliego border border-grafito/30 rounded p-4 overflow-x-auto text-papel">
        {exercise.artifact.content}
      </pre>

      <div>
        <h3 className="text-sm uppercase tracking-wide text-grafito mb-2">señalar el elemento culpable</h3>
        <div className="grid gap-2">
          {exercise.culprits.map((culprit) => {
            const isSelected = selectedElementId === culprit.elementId;
            const showResult = evaluation !== null;
            const isCorrectPlace = culprit.elementId === exercise.correctCulpritId;
            const stateClass = !showResult
              ? isSelected
                ? 'border-laton bg-laton/10'
                : 'border-grafito/30 hover:border-grafito'
              : isCorrectPlace
                ? 'border-verdin bg-verdin/10'
                : isSelected
                  ? 'border-rojo bg-rojo/10'
                  : 'border-grafito/20 opacity-60';

            return (
              <button
                key={culprit.elementId}
                type="button"
                disabled={showResult}
                onClick={() => setSelectedElementId(culprit.elementId)}
                className={`text-left px-4 py-2 rounded border font-mono text-sm ${stateClass} transition-colors`}
              >
                {culprit.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm uppercase tracking-wide text-grafito mb-2">elegir la causa raíz</h3>
        <div className="grid gap-2">
          {exercise.causeOptions.map((cause) => {
            const isSelected = selectedCauseId === cause.id;
            const showResult = evaluation !== null;
            const stateClass = !showResult
              ? isSelected
                ? 'border-laton bg-laton/10'
                : 'border-grafito/30 hover:border-grafito'
              : cause.isCorrect
                ? 'border-verdin bg-verdin/10'
                : isSelected
                  ? 'border-rojo bg-rojo/10'
                  : 'border-grafito/20 opacity-60';

            return (
              <button
                key={cause.id}
                type="button"
                disabled={showResult}
                onClick={() => setSelectedCauseId(cause.id)}
                className={`text-left px-4 py-2 rounded border ${stateClass} transition-colors`}
              >
                {cause.text}
              </button>
            );
          })}
        </div>
      </div>

      {!evaluation && (
        <button
          type="button"
          disabled={!selectedElementId || !selectedCauseId}
          onClick={handleSubmit}
          className="px-4 py-2 rounded bg-laton text-tinta font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          diagnosticar
        </button>
      )}

      {evaluation && (
        <div
          className={`px-4 py-3 rounded border flex items-start gap-2 ${
            evaluation.correct ? 'border-verdin bg-verdin/10' : 'border-rojo bg-rojo/10'
          }`}
        >
          {evaluation.correct ? (
            <Check className="text-verdin shrink-0 mt-0.5" size={18} />
          ) : (
            <X className="text-rojo shrink-0 mt-0.5" size={18} />
          )}
          <p className="text-papel text-sm">
            {evaluation.correct
              ? 'lugar y causa correctos.'
              : evaluation.placeCorrect
                ? 'señalaste el elemento correcto, pero la causa que elegiste no es la raíz del problema.'
                : 'ese no es el elemento que provocó el síntoma reportado.'}
          </p>
        </div>
      )}
    </div>
  );
}
