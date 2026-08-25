import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useProgressStore } from '../progress/store';
import type { LLMProvider } from '../engine/llm/createLLMAdapter';

interface SettingsScreenProps {
  onBack: () => void;
}

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  mock: 'sin modelo (respuestas de opción múltiple pre-escritas)',
  gemini: 'Google Gemini',
  groq: 'Groq',
};

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const provider = useProgressStore((s) => s.state.settings.llmProvider);
  const apiKey = useProgressStore((s) => s.apiKey);
  const setLlmProvider = useProgressStore((s) => s.setLlmProvider);
  const setApiKey = useProgressStore((s) => s.setApiKey);
  const clearApiKey = useProgressStore((s) => s.clearApiKey);

  const [draftKey, setDraftKey] = useState('');

  function handleSaveKey() {
    if (!draftKey.trim()) return;
    setApiKey(draftKey.trim());
    setDraftKey('');
  }

  return (
    <div className="space-y-8 max-w-xl">
      <button type="button" onClick={onBack} className="text-grafito hover:text-papel flex items-center gap-1 text-sm">
        <ArrowLeft size={14} /> volver
      </button>

      <div>
        <h1 className="font-display text-2xl text-papel mb-1">configuración</h1>
        <p className="text-grafito">
          Criterio funciona por completo sin ninguna clave: ClientArena degrada a opción múltiple con feedback
          pre-escrito. Agrega una clave solo si quieres respuesta libre evaluada por un modelo real.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm uppercase tracking-wide text-grafito">proveedor</h2>
        <div className="grid gap-2">
          {(Object.keys(PROVIDER_LABELS) as LLMProvider[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setLlmProvider(p)}
              className={`text-left px-4 py-2 rounded border transition-colors ${
                provider === p ? 'border-laton bg-laton/10' : 'border-grafito/30 hover:border-grafito'
              }`}
            >
              {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm uppercase tracking-wide text-grafito">clave de api</h2>
        {apiKey ? (
          <div className="flex items-center gap-3">
            <p className="font-mono text-sm text-papel">clave guardada: {'•'.repeat(8)}</p>
            <button type="button" onClick={clearApiKey} className="text-rojo text-sm hover:underline">
              quitar clave
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="pega tu clave aquí"
              className="flex-1 bg-pliego border border-grafito/30 rounded px-3 py-2 text-papel font-mono text-sm"
            />
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={!draftKey.trim()}
              className="px-4 py-2 rounded bg-laton text-tinta font-medium disabled:opacity-40"
            >
              guardar clave
            </button>
          </div>
        )}
        <p className="text-grafito text-xs">
          la clave se guarda solo en este navegador (localStorage). Criterio nunca la envía a ningún servidor propio.
        </p>
      </div>
    </div>
  );
}
