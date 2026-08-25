import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { TradeoffMatrixExercise } from '../../content/types';
import { evaluateTradeoffMatrix, type TradeoffMatrixEvaluation } from '../../engine/primitives/tradeoffMatrix';

interface TradeoffMatrixViewProps {
  exercise: TradeoffMatrixExercise;
  onComplete: (evaluation: TradeoffMatrixEvaluation) => void;
}

export function TradeoffMatrixView({ exercise, onComplete }: TradeoffMatrixViewProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedJustificationIds, setSelectedJustificationIds] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<TradeoffMatrixEvaluation | null>(null);

  const canSubmit =
    selectedOptionId !== null && selectedJustificationIds.length === exercise.requiredJustificationCount;

  function toggleJustification(id: string) {
    if (evaluation) return;
    setSelectedJustificationIds((prev) => {
      if (prev.includes(id)) return prev.filter((j) => j !== id);
      if (prev.length >= exercise.requiredJustificationCount) return prev;
      return [...prev, id];
    });
  }

  function handleSubmit() {
    if (!selectedOptionId) return;
    const result = evaluateTradeoffMatrix(exercise, { selectedOptionId, selectedJustificationIds });
    setEvaluation(result);
    onComplete(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-papel mb-1">{exercise.title}</h2>
        <p className="text-grafito">{exercise.prompt}</p>
      </div>

      <div>
        <h3 className="text-sm uppercase tracking-wide text-grafito mb-2">elegir una opción</h3>
        <div className="grid gap-2">
          {exercise.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            const showResult = evaluation !== null;
            const stateClass = !showResult
              ? isSelected
                ? 'border-laton bg-laton/10'
                : 'border-grafito/30 hover:border-grafito'
              : option.isCorrect
                ? 'border-verdin bg-verdin/10'
                : isSelected
                  ? 'border-rojo bg-rojo/10'
                  : 'border-grafito/20 opacity-60';

            return (
              <button
                key={option.id}
                type="button"
                disabled={showResult}
                onClick={() => setSelectedOptionId(option.id)}
                className={`text-left px-4 py-3 rounded border ${stateClass} transition-colors`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm uppercase tracking-wide text-grafito mb-2">
          elegir {exercise.requiredJustificationCount} razones que sustenten la decisión
        </h3>
        <div className="grid gap-2">
          {exercise.justifications.map((justification) => {
            const isSelected = selectedJustificationIds.includes(justification.id);
            const showResult = evaluation !== null;
            const stateClass = !showResult
              ? isSelected
                ? 'border-laton bg-laton/10'
                : 'border-grafito/30 hover:border-grafito'
              : justification.kind === 'correct' && isSelected
                ? 'border-verdin bg-verdin/10'
                : isSelected
                  ? 'border-rojo bg-rojo/10'
                  : 'border-grafito/20 opacity-60';

            return (
              <button
                key={justification.id}
                type="button"
                disabled={showResult}
                onClick={() => toggleJustification(justification.id)}
                className={`text-left px-4 py-3 rounded border ${stateClass} transition-colors`}
              >
                {justification.text}
              </button>
            );
          })}
        </div>
      </div>

      {!evaluation && (
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="px-4 py-2 rounded bg-laton text-tinta font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          validar decisión
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
              ? 'decisión y razones consistentes.'
              : evaluation.optionCorrect
                ? 'la opción es correcta, pero las razones elegidas no la sustentan: eso no consolida el concepto.'
                : 'esta opción no es la más adecuada para este caso.'}
          </p>
        </div>
      )}
    </div>
  );
}
