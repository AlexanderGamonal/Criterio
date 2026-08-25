import { describe, expect, it } from 'vitest';
import { evaluateSchemaForge } from './schemaForge';
import type { SchemaForgeExercise, SchemaTableSeed } from '../../content/types';

const exercise: SchemaForgeExercise = {
  id: 'ex-1',
  type: 'schema-forge',
  title: 'Modelar ventas',
  prompt: '...',
  concepts: ['precio-historico'],
  seedTables: [],
  invariants: [
    {
      name: 'historical-price-preserved',
      params: { tableHint: 'venta_detalle', columnHint: 'precio' },
      failureMessage: 'si Marta sube el precio, las facturas viejas cambian solas',
    },
    { name: 'fk-integrity', failureMessage: 'FK rota' },
  ],
};

describe('evaluateSchemaForge', () => {
  it('correcto cuando todos los invariantes pasan', () => {
    const schema: SchemaTableSeed[] = [
      { id: 'productos', name: 'productos', columns: [{ id: 'productos-id', name: 'id', type: 'uuid', isPrimaryKey: true }] },
      {
        id: 'venta_detalle',
        name: 'venta_detalle',
        columns: [
          { id: 'vd-id', name: 'id', type: 'uuid', isPrimaryKey: true },
          { id: 'vd-prod', name: 'producto_id', type: 'uuid', references: 'productos-id' },
          { id: 'vd-precio', name: 'precio_unitario', type: 'decimal' },
        ],
      },
    ];
    const evaluation = evaluateSchemaForge(exercise, schema);
    expect(evaluation.correct).toBe(true);
  });

  it('incorrecto cuando falta el precio propio en el detalle', () => {
    const schema: SchemaTableSeed[] = [
      { id: 'productos', name: 'productos', columns: [{ id: 'productos-id', name: 'id', type: 'uuid', isPrimaryKey: true }] },
      {
        id: 'venta_detalle',
        name: 'venta_detalle',
        columns: [
          { id: 'vd-id', name: 'id', type: 'uuid', isPrimaryKey: true },
          { id: 'vd-prod', name: 'producto_id', type: 'uuid', references: 'productos-id' },
        ],
      },
    ];
    const evaluation = evaluateSchemaForge(exercise, schema);
    expect(evaluation.correct).toBe(false);
    expect(evaluation.outcomes.find((o) => o.name === 'historical-price-preserved')?.passed).toBe(false);
  });
});
