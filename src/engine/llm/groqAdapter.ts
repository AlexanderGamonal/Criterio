import type { EvaluationRequest, EvaluationResult, LLMAdapter } from './types';
import { buildEvaluationPrompt } from './prompt';
import { parseEvaluationJson } from './parseEvaluationJson';
import { MockAdapter } from './mockAdapter';

const GROQ_MODEL = 'llama-3.3-70b-versatile';

/** Groq expone una API compatible con OpenAI (chat completions). */
export class GroqAdapter implements LLMAdapter {
  private readonly apiKey: string;
  private readonly fallback = new MockAdapter();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async evaluate(input: EvaluationRequest): Promise<EvaluationResult> {
    const prompt = buildEvaluationPrompt(input);

    const first = await this.requestOnce(prompt);
    const firstParsed = first ? parseEvaluationJson(first) : null;
    if (firstParsed) return firstParsed;

    const retryPrompt = `${prompt}\n\nTu respuesta anterior no era JSON válido. Responde SOLO con el objeto JSON, nada más.`;
    const second = await this.requestOnce(retryPrompt);
    const secondParsed = second ? parseEvaluationJson(second) : null;
    if (secondParsed) return secondParsed;

    return this.fallback.evaluate(input);
  }

  private async requestOnce(prompt: string): Promise<string | null> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      return typeof text === 'string' ? text : null;
    } catch {
      return null;
    }
  }
}
