import type { SchemaInvariant, SchemaTableSeed } from '../../content/types';
import { INVARIANT_REGISTRY } from './invariants';

export interface InvariantOutcome {
  name: string;
  passed: boolean;
  message: string;
  failingElementIds: string[];
}

/**
 * Ejecuta cada invariante declarado en el JSON del ejercicio contra el
 * esquema actual del usuario. Un invariante cuyo nombre no está registrado
 * se reporta como fallido en vez de romper la ejecución.
 */
export function runInvariants(schema: SchemaTableSeed[], invariants: SchemaInvariant[]): InvariantOutcome[] {
  return invariants.map((invariant) => {
    const rule = INVARIANT_REGISTRY[invariant.name];
    if (!rule) {
      return {
        name: invariant.name,
        passed: false,
        message: `Invariante desconocida: "${invariant.name}".`,
        failingElementIds: [],
      };
    }

    const result = rule(schema, invariant.params ?? {});
    return {
      name: invariant.name,
      passed: result.passed,
      message: result.passed ? (invariant.successMessage ?? '') : invariant.failureMessage,
      failingElementIds: result.failingElementIds ?? [],
    };
  });
}
