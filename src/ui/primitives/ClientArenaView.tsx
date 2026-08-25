import { useState } from 'react';
import type { ClientArenaChoice, ClientArenaExercise, ClientArenaMultipleChoiceNode } from '../../content/types';
import type { EvaluationResult, LLMAdapter } from '../../engine/llm/types';
import { MockAdapter } from '../../engine/llm/mockAdapter';
import {
  applyMarkerDeltas,
  getNode,
  resolveEnding,
  toExerciseResult,
  type ClientArenaMarkers,
} from '../../engine/primitives/clientArena';
import type { ExerciseResult } from '../../progress/types';

interface ClientArenaViewProps {
  exercise: ClientArenaExercise;
  llmAdapter: LLMAdapter;
  onComplete: (result: ExerciseResult) => void;
}

function MarkerBar({ markers }: { markers: ClientArenaMarkers }) {
  const items: Array<{ label: string; value: number }> = [
    { label: 'presupuesto', value: markers.budget },
    { label: 'confianza', value: markers.trust },
    { label: 'deuda técnica', value: markers.techDebt },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-sm border border-grafito/30 rounded px-4 py-2 bg-pliego">
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-grafito">{item.label}</span>
          <span className="text-laton">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ClientArenaView({ exercise, llmAdapter, onComplete }: ClientArenaViewProps) {
  const [currentNodeId, setCurrentNodeId] = useState(exercise.startNodeId);
  const [markers, setMarkers] = useState<ClientArenaMarkers>(exercise.initialMarkers);
  const [freeText, setFreeText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [endingText, setEndingText] = useState<string | null>(null);

  const node = getNode(exercise, currentNodeId);
  const isMock = llmAdapter instanceof MockAdapter;

  function handleChoice(choice: ClientArenaChoice) {
    setMarkers((prev) => applyMarkerDeltas(prev, choice.deltas));
    setCurrentNodeId(choice.nextNodeId);
  }

  async function submitFreeResponse(text: string) {
    if (node.type !== 'free-response' || !text.trim()) return;
    setIsEvaluating(true);
    try {
      const result = await llmAdapter.evaluate({
        clientLine: node.clientLine,
        userResponse: text,
        rubric: node.rubric,
      });
      setEvaluation(result);
      const ending = resolveEnding(exercise, markers);
      setEndingText(ending.text);
      onComplete(toExerciseResult(exercise, result));
    } finally {
      setIsEvaluating(false);
    }
  }

  if (endingText && evaluation) {
    return (
      <div className="space-y-6">
        <MarkerBar markers={markers} />
        <div className="space-y-3">
          <p className="font-display text-lg text-papel italic">"{evaluation.clientReply}"</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {evaluation.strengths.length > 0 && (
              <div className="px-3 py-2 rounded border border-verdin/50 bg-verdin/10">
                <p className="text-xs uppercase text-verdin mb-1">lo que funcionó</p>
                <ul className="text-sm text-papel list-disc list-inside">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.gaps.length > 0 && (
              <div className="px-3 py-2 rounded border border-rojo/50 bg-rojo/10">
                <p className="text-xs uppercase text-rojo mb-1">lo que falta</p>
                <ul className="text-sm text-papel list-disc list-inside">
                  {evaluation.gaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 py-3 rounded border border-laton/50 bg-laton/10">
          <p className="text-sm uppercase text-laton mb-1">desenlace</p>
          <p className="text-papel">{endingText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-papel mb-1">{exercise.title}</h2>
        <p className="text-grafito">{exercise.prompt}</p>
      </div>

      <MarkerBar markers={markers} />

      {node.type !== 'ending' && (
        <p className="font-display text-lg text-papel italic">"{node.clientLine}"</p>
      )}

      {node.type === 'multiple-choice' && (
        <MultipleChoiceNode node={node} onChoose={handleChoice} />
      )}

      {node.type === 'free-response' && !isMock && (
        <div className="space-y-3">
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            disabled={isEvaluating}
            rows={5}
            className="w-full bg-pliego border border-grafito/30 rounded p-3 text-papel"
            placeholder="escribe tu respuesta a Marta..."
          />
          <button
            type="button"
            disabled={isEvaluating || !freeText.trim()}
            onClick={() => submitFreeResponse(freeText)}
            className="px-4 py-2 rounded bg-laton text-tinta font-medium disabled:opacity-40"
          >
            {isEvaluating ? 'evaluando respuesta...' : 'responder a Marta'}
          </button>
        </div>
      )}

      {node.type === 'free-response' && isMock && (
        <div className="grid gap-2">
          <p className="text-xs text-grafito uppercase tracking-wide">
            sin api key configurada: elige la respuesta más cercana a la tuya
          </p>
          {node.fallbackChoices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              disabled={isEvaluating}
              onClick={() => submitFreeResponse(choice.text)}
              className="text-left px-4 py-2 rounded border border-grafito/30 hover:border-laton transition-colors disabled:opacity-40"
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MultipleChoiceNode({
  node,
  onChoose,
}: {
  node: ClientArenaMultipleChoiceNode;
  onChoose: (choice: ClientArenaChoice) => void;
}) {
  return (
    <div className="grid gap-2">
      {node.choices.map((choice) => (
        <button
          key={choice.id}
          type="button"
          onClick={() => onChoose(choice)}
          className="text-left px-4 py-2 rounded border border-grafito/30 hover:border-laton transition-colors"
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
