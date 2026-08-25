import { useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import type { ColumnType, SchemaColumnSeed, SchemaForgeExercise, SchemaTableSeed } from '../../content/types';
import { evaluateSchemaForge, type SchemaForgeEvaluation } from '../../engine/primitives/schemaForge';

interface SchemaForgeViewProps {
  exercise: SchemaForgeExercise;
  onComplete: (evaluation: SchemaForgeEvaluation) => void;
}

const COLUMN_TYPES: ColumnType[] = ['string', 'text', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'uuid'];

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function cloneTables(tables: SchemaTableSeed[]): SchemaTableSeed[] {
  return tables.map((t) => ({ ...t, columns: t.columns.map((c) => ({ ...c })) }));
}

export function SchemaForgeView({ exercise, onComplete }: SchemaForgeViewProps) {
  const [tables, setTables] = useState<SchemaTableSeed[]>(() => cloneTables(exercise.seedTables));
  const [evaluation, setEvaluation] = useState<SchemaForgeEvaluation | null>(null);

  function addTable() {
    setTables((prev) => [...prev, { id: nextId('table'), name: 'nueva_tabla', columns: [] }]);
  }

  function removeTable(tableId: string) {
    setTables((prev) => prev.filter((t) => t.id !== tableId));
  }

  function renameTable(tableId: string, name: string) {
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, name } : t)));
  }

  function addColumn(tableId: string) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, columns: [...t.columns, { id: nextId('col'), name: 'columna', type: 'string' }] }
          : t,
      ),
    );
  }

  function updateColumn(tableId: string, columnId: string, patch: Partial<SchemaColumnSeed>) {
    setTables((prev) =>
      prev.map((t) =>
        t.id !== tableId
          ? t
          : { ...t, columns: t.columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c)) },
      ),
    );
  }

  function removeColumn(tableId: string, columnId: string) {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) } : t)),
    );
  }

  const primaryKeyOptions = tables.flatMap((t) =>
    t.columns.filter((c) => c.isPrimaryKey).map((c) => ({ columnId: c.id, label: `${t.name}.${c.name}` })),
  );

  function handleValidate() {
    const result = evaluateSchemaForge(exercise, tables);
    setEvaluation(result);
    onComplete(result);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-papel mb-1">{exercise.title}</h2>
        <p className="text-grafito">{exercise.prompt}</p>
      </div>

      <div className="space-y-4">
        {tables.map((table) => (
          <div key={table.id} className="border border-grafito/30 rounded p-4 bg-pliego">
            <div className="flex items-center gap-2 mb-3">
              <input
                value={table.name}
                onChange={(e) => renameTable(table.id, e.target.value)}
                className="font-mono bg-transparent border-b border-grafito/40 text-papel px-1 py-0.5 flex-1"
                disabled={evaluation !== null}
              />
              <button
                type="button"
                onClick={() => removeTable(table.id)}
                disabled={evaluation !== null}
                className="text-grafito hover:text-rojo disabled:opacity-30"
                aria-label="eliminar tabla"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm font-mono">
              <thead>
                <tr className="text-grafito text-xs uppercase text-left">
                  <th className="font-normal pb-1">columna</th>
                  <th className="font-normal pb-1">tipo</th>
                  <th className="font-normal pb-1">pk</th>
                  <th className="font-normal pb-1 whitespace-nowrap">fk hacia</th>
                  <th className="font-normal pb-1"></th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map((column) => (
                  <tr key={column.id} className="border-t border-grafito/10">
                    <td className="py-1 pr-2">
                      <input
                        value={column.name}
                        onChange={(e) => updateColumn(table.id, column.id, { name: e.target.value })}
                        disabled={evaluation !== null}
                        className="bg-transparent border-b border-grafito/30 text-papel w-full"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <select
                        value={column.type}
                        onChange={(e) => updateColumn(table.id, column.id, { type: e.target.value as ColumnType })}
                        disabled={evaluation !== null}
                        className="bg-tinta border border-grafito/30 text-papel rounded px-1"
                      >
                        {COLUMN_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1 pr-2 text-center">
                      <input
                        type="checkbox"
                        checked={column.isPrimaryKey ?? false}
                        onChange={(e) => updateColumn(table.id, column.id, { isPrimaryKey: e.target.checked })}
                        disabled={evaluation !== null}
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <select
                        value={column.references ?? ''}
                        onChange={(e) =>
                          updateColumn(table.id, column.id, { references: e.target.value || undefined })
                        }
                        disabled={evaluation !== null}
                        className="bg-tinta border border-grafito/30 text-papel rounded px-1"
                      >
                        <option value="">—</option>
                        {primaryKeyOptions
                          .filter((o) => o.columnId !== column.id)
                          .map((o) => (
                            <option key={o.columnId} value={o.columnId}>
                              {o.label}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="py-1">
                      <button
                        type="button"
                        onClick={() => removeColumn(table.id, column.id)}
                        disabled={evaluation !== null}
                        className="text-grafito hover:text-rojo disabled:opacity-30"
                        aria-label="eliminar columna"
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>

            <button
              type="button"
              onClick={() => addColumn(table.id)}
              disabled={evaluation !== null}
              className="mt-2 text-sm text-laton flex items-center gap-1 disabled:opacity-30"
            >
              <Plus size={14} /> agregar columna
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addTable}
        disabled={evaluation !== null}
        className="text-sm text-laton flex items-center gap-1 disabled:opacity-30"
      >
        <Plus size={14} /> agregar tabla
      </button>

      {!evaluation && (
        <div>
          <button type="button" onClick={handleValidate} className="px-4 py-2 rounded bg-laton text-tinta font-medium">
            validar esquema
          </button>
        </div>
      )}

      {evaluation && (
        <div className="space-y-2">
          {evaluation.outcomes.map((outcome) => (
            <div
              key={outcome.name}
              className={`px-4 py-3 rounded border flex items-start gap-2 ${
                outcome.passed ? 'border-verdin bg-verdin/10' : 'border-rojo bg-rojo/10'
              }`}
            >
              {outcome.passed ? (
                <Check className="text-verdin shrink-0 mt-0.5" size={18} />
              ) : (
                <X className="text-rojo shrink-0 mt-0.5" size={18} />
              )}
              <p className="text-papel text-sm">{outcome.message || 'invariante cumplido.'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
