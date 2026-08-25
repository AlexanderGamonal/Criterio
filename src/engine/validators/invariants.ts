import type { InvariantName, SchemaTableSeed } from '../../content/types';

export interface InvariantCheckResult {
  passed: boolean;
  /** ids de tabla/columna involucrados, para resaltarlos en la UI. */
  failingElementIds?: string[];
}

export type InvariantRule = (schema: SchemaTableSeed[], params: Record<string, unknown>) => InvariantCheckResult;

function str(params: Record<string, unknown>, key: string, fallback: string): string {
  const value = params[key];
  return typeof value === 'string' ? value : fallback;
}

function includesCI(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/**
 * El motor no sabe qué es un "precio histórico": solo verifica que exista una
 * tabla cuyo nombre matchee `tableHint` con una columna propia (no FK) cuyo
 * nombre matchee `columnHint`. El significado de negocio vive en el JSON,
 * en `failureMessage`.
 */
const historicalValuePreserved: InvariantRule = (schema, params) => {
  const tableHint = str(params, 'tableHint', '');
  const columnHint = str(params, 'columnHint', '');

  const candidateTables = schema.filter((t) => includesCI(t.name, tableHint));
  if (candidateTables.length === 0) {
    return { passed: false, failingElementIds: [] };
  }

  const failing: string[] = [];
  for (const table of candidateTables) {
    const hasOwnValueColumn = table.columns.some(
      (c) => includesCI(c.name, columnHint) && !c.references && !c.isPrimaryKey,
    );
    if (!hasOwnValueColumn) failing.push(table.id);
  }

  return { passed: failing.length === 0, failingElementIds: failing };
};

/**
 * Detecta columnas tipo `producto_1`, `producto_2` dentro de una misma tabla:
 * dos o más columnas que comparten el mismo prefijo al quitarles el sufijo
 * numérico.
 */
const noRepeatingGroups: InvariantRule = (schema) => {
  const failing: string[] = [];
  const pattern = /^(.*?)[_-]?\d+$/;

  for (const table of schema) {
    const prefixCounts = new Map<string, number>();
    for (const column of table.columns) {
      const match = column.name.match(pattern);
      if (!match) continue;
      const prefix = match[1].toLowerCase();
      if (!prefix) continue;
      prefixCounts.set(prefix, (prefixCounts.get(prefix) ?? 0) + 1);
    }
    const hasRepeatingGroup = Array.from(prefixCounts.values()).some((count) => count >= 2);
    if (hasRepeatingGroup) failing.push(table.id);
  }

  return { passed: failing.length === 0, failingElementIds: failing };
};

/**
 * Toda tabla de negocio debe tener una columna de aislamiento de tenant,
 * salvo las listadas en `exemptTableIds`.
 */
const tenantIsolation: InvariantRule = (schema, params) => {
  const tenantColumnName = str(params, 'tenantColumnName', 'tenant_id');
  const exemptTableIds = Array.isArray(params.exemptTableIds) ? (params.exemptTableIds as string[]) : [];

  const failing = schema
    .filter((t) => !exemptTableIds.includes(t.id))
    .filter((t) => !t.columns.some((c) => c.name.toLowerCase() === tenantColumnName.toLowerCase()))
    .map((t) => t.id);

  return { passed: failing.length === 0, failingElementIds: failing };
};

/** Toda FK (columna con `references`) debe apuntar a una PK existente. */
const fkIntegrity: InvariantRule = (schema) => {
  const primaryKeyColumnIds = new Set(
    schema.flatMap((t) => t.columns.filter((c) => c.isPrimaryKey).map((c) => c.id)),
  );

  const failing: string[] = [];
  for (const table of schema) {
    for (const column of table.columns) {
      if (column.references && !primaryKeyColumnIds.has(column.references)) {
        failing.push(column.id);
      }
    }
  }

  return { passed: failing.length === 0, failingElementIds: failing };
};

export const INVARIANT_REGISTRY: Record<InvariantName, InvariantRule> = {
  'historical-price-preserved': historicalValuePreserved,
  'no-repeating-groups': noRepeatingGroups,
  'tenant-isolation': tenantIsolation,
  'fk-integrity': fkIntegrity,
};
