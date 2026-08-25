import type { EvaluationRequest } from './types';

/**
 * Prompt compartido entre proveedores. Pide salida JSON estricta con el
 * shape exacto de EvaluationResult (sin `isMock`, que el adaptador agrega).
 */
export function buildEvaluationPrompt(input: EvaluationRequest): string {
  const rubricLines = input.rubric
    .map((c) => `- id: "${c.id}" | peso: ${c.weight} | criterio: ${c.description}`)
    .join('\n');

  return `Eres un cliente PyME evaluando la respuesta técnica de un consultor de arquitectura de software.

Contexto: ${input.context ?? '(sin contexto adicional)'}
Tu última línea de diálogo fue: "${input.clientLine}"
La respuesta del consultor fue: "${input.userResponse}"

Evalúa la respuesta contra esta rúbrica:
${rubricLines}

Responde ÚNICAMENTE con un objeto JSON (sin markdown, sin texto alrededor) con esta forma exacta:
{
  "scores": [{ "criterionId": string, "score": number, "maxScore": number }],
  "strengths": string[],
  "gaps": string[],
  "clientReply": string
}

"clientReply" debe estar en la voz del cliente del contexto, reaccionando a la respuesta recibida.
"score" no puede superar "maxScore" del criterio correspondiente.`;
}
