import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, X } from 'lucide-react';
import type { TimelineExercise } from '../../content/types';
import {
  evaluateTimeline,
  simulateTimelineSteps,
  type TimelineEvaluation,
  type TimelineState,
  type TimelineStep,
} from '../../engine/primitives/timeline';

interface TimelineViewProps {
  exercise: TimelineExercise;
  onComplete: (evaluation: TimelineEvaluation) => void;
}

const STEP_INTERVAL_MS = 700;

export function TimelineView({ exercise, onComplete }: TimelineViewProps) {
  const [order, setOrder] = useState<string[]>(() => exercise.operations.map((op) => op.id));
  const [prediction, setPrediction] = useState<TimelineState>(() =>
    Object.fromEntries(Object.keys(exercise.initialState).map((k) => [k, ''])),
  );
  const [evaluation, setEvaluation] = useState<TimelineEvaluation | null>(null);
  const [steps, setSteps] = useState<TimelineStep[]>([]);
  const [playIndex, setPlayIndex] = useState(0);

  useEffect(() => {
    if (!evaluation || playIndex >= steps.length) return;
    const timer = setTimeout(() => setPlayIndex((i) => i + 1), STEP_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [evaluation, playIndex, steps.length]);

  function move(index: number, direction: -1 | 1) {
    if (evaluation) return;
    setOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function handleSubmit() {
    const normalizedPrediction: TimelineState = {};
    for (const [key, value] of Object.entries(prediction)) {
      const num = Number(value);
      normalizedPrediction[key] = value !== '' && !Number.isNaN(num) ? num : value;
    }
    const result = evaluateTimeline(exercise, { order, predictedFinalState: normalizedPrediction });
    setEvaluation(result);
    setSteps(simulateTimelineSteps(exercise, order));
    setPlayIndex(0);
    onComplete(result);
  }

  const opById = new Map(exercise.operations.map((op) => [op.id, op]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-papel mb-1">{exercise.title}</h2>
        <p className="text-grafito">{exercise.prompt}</p>
      </div>

      <div>
        <h3 className="text-sm uppercase tracking-wide text-grafito mb-2">ordenar las operaciones</h3>
        <div className="grid gap-1.5">
          {order.map((opId, index) => {
            const op = opById.get(opId);
            if (!op) return null;
            return (
              <div
                key={opId}
                className="flex items-center gap-2 px-3 py-2 rounded border border-grafito/30 bg-pliego font-mono text-sm"
              >
                <span className="text-grafito w-16 shrink-0">{op.transactionId}</span>
                <span className="text-papel flex-1">{op.label}</span>
                <button
                  type="button"
                  disabled={!!evaluation}
                  onClick={() => move(index, -1)}
                  className="text-grafito hover:text-laton disabled:opacity-30"
                  aria-label="mover arriba"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={!!evaluation}
                  onClick={() => move(index, 1)}
                  className="text-grafito hover:text-laton disabled:opacity-30"
                  aria-label="mover abajo"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm uppercase tracking-wide text-grafito mb-2">predecir el estado final</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.keys(exercise.initialState).map((key) => (
            <label key={key} className="flex items-center gap-2 font-mono text-sm">
              <span className="text-grafito">{key} =</span>
              <input
                value={prediction[key] ?? ''}
                disabled={!!evaluation}
                onChange={(e) => setPrediction((prev) => ({ ...prev, [key]: e.target.value }))}
                className="bg-pliego border border-grafito/30 rounded px-2 py-1 text-papel w-24"
              />
            </label>
          ))}
        </div>
      </div>

      {!evaluation && (
        <button type="button" onClick={handleSubmit} className="px-4 py-2 rounded bg-laton text-tinta font-medium">
          validar predicción
        </button>
      )}

      {evaluation && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm uppercase tracking-wide text-grafito mb-2">ejecución</h3>
            <div className="grid gap-1.5">
              {steps.map((step, index) => {
                const op = opById.get(step.operationId);
                const visible = index <= playIndex;
                return (
                  <div
                    key={`${step.operationId}-${index}`}
                    className={`px-3 py-2 rounded border border-grafito/20 font-mono text-sm transition-opacity duration-300 ${
                      visible ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <span className="text-grafito">{op?.label}</span>
                    <span className="text-papel ml-2">→ {JSON.stringify(step.stateAfter)}</span>
                  </div>
                );
              })}
            </div>
          </div>

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
            <p className="text-papel text-sm font-mono">
              estado real: {JSON.stringify(evaluation.actualFinalState)}
              {!evaluation.correct && ' — tu predicción no coincide.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
