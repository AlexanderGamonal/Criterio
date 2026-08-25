import type { EvaluationRequest, EvaluationResult, LLMAdapter } from './types';
import { buildEvaluationPrompt } from './prompt';
import { parseEvaluationJson } from './parseEvaluationJson';
import { MockAdapter } from './mockAdapter';

const GEMINI_MODEL = 'gemini-2.0-flash';

export class GeminiAdapter implements LLMAdapter {
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
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        },
      );
      if (!response.ok) return null;
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return typeof text === 'string' ? text : null;
    } catch {
      return null;
    }
  }
}
