import { describe, expect, it } from 'vitest';
import { runInvariants } from './runInvariants';
import type { SchemaInvariant, SchemaTableSeed } from '../../content/types';

function col(overrides: Partial<SchemaTableSeed['columns'][number]>): SchemaTableSeed['columns'][number] {
  return { id: 'c', name: 'col', type: 'string', ...overrides };
}

describe('historical-price-preserved', () => {
  const invariant: SchemaInvariant = {
    name: 'historical-price-preserved',
    params: { tableHint: 'venta_detalle', columnHint: 'precio' },
    failureMessage: 'si el precio cambia, las facturas viejas mutan',
  };

  it('falla si la tabla de detalle solo tiene FK al producto, sin precio propio', () => {
    const schema: SchemaTableSeed[] = [
      {
        id: 't1',
        name: 'venta_detalle',
        columns: [
          col({ id: 't1-id', name: 'id', isPrimaryKey: true }),
          col({ id: 't1-prod', name: 'producto_id', references: 'productos-id' }),
        ],
      },
    ];
    const [result] = runInvariants(schema, [invariant]);
    expect(result.passed).toBe(false);
  });

  it('pasa si la tabla de detalle tiene columna de precio propia', () => {
    const schema: SchemaTableSeed[] = [
      {
        id: 't1',
        name: 'venta_detalle',
        columns: [
          col({ id: 't1-id', name: 'id', isPrimaryKey: true }),
          col({ id: 't1-prod', name: 'producto_id', references: 'productos-id' }),
          col({ id: 't1-precio', name: 'precio_unitario', type: 'decimal' }),
        ],
      },
    ];
    const [result] = runInvariants(schema, [invariant]);
    expect(result.passed).toBe(true);
  });
});

describe('no-repeating-groups', () => {
  const invariant: SchemaInvariant = { name: 'no-repeating-groups', failureMessage: 'grupos repetidos' };

  it('falla con columnas producto_1, producto_2', () => {
    const schema: SchemaTableSeed[] = [
      {
        id: 't1',
        name: 'ventas',
        columns: [col({ id: 'c1', name: 'producto_1' }), col({ id: 'c2', name: 'producto_2' })],
      },
    ];
    expect(runInvariants(schema, [invariant])[0].passed).toBe(false);
  });

  it('pasa con columnas normales', () => {
    const schema: SchemaTableSeed[] = [
      { id: 't1', name: 'ventas', columns: [col({ id: 'c1', name: 'fecha' }), col({ id: 'c2', name: 'total' })] },
    ];
    expect(runInvariants(schema, [invariant])[0].passed).toBe(true);
  });
});

describe('tenant-isolation', () => {
  const invariant: SchemaInvariant = { name: 'tenant-isolation', failureMessage: 'falta tenant_id' };

  it('falla si una tabla de negocio no tiene tenant_id', () => {
    const schema: SchemaTableSeed[] = [{ id: 't1', name: 'clientes', columns: [col({ id: 'c1', name: 'nombre' })] }];
    expect(runInvariants(schema, [invariant])[0].passed).toBe(false);
  });

  it('pasa si todas las tablas tienen tenant_id', () => {
    const schema: SchemaTableSeed[] = [
      { id: 't1', name: 'clientes', columns: [col({ id: 'c1', name: 'tenant_id' })] },
    ];
    expect(runInvariants(schema, [invariant])[0].passed).toBe(true);
  });
});

describe('fk-integrity', () => {
  const invariant: SchemaInvariant = { name: 'fk-integrity', failureMessage: 'FK rota' };

  it('falla si una FK apunta a una columna que no es PK', () => {
    const schema: SchemaTableSeed[] = [
      { id: 't1', name: 'a', columns: [col({ id: 'a-id', name: 'id' })] },
      { id: 't2', name: 'b', columns: [col({ id: 'b-fk', name: 'a_id', references: 'a-id' })] },
    ];
    expect(runInvariants(schema, [invariant])[0].passed).toBe(false);
  });

  it('pasa si toda FK apunta a una PK existente', () => {
    const schema: SchemaTableSeed[] = [
      { id: 't1', name: 'a', columns: [col({ id: 'a-id', name: 'id', isPrimaryKey: true })] },
      { id: 't2', name: 'b', columns: [col({ id: 'b-fk', name: 'a_id', references: 'a-id' })] },
    ];
    expect(runInvariants(schema, [invariant])[0].passed).toBe(true);
  });
});

describe('runInvariants', () => {
  it('reporta fallo controlado para un nombre no registrado', () => {
    const invariant: SchemaInvariant = { name: 'inexistente', failureMessage: 'x' };
    const [result] = runInvariants([], [invariant]);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('inexistente');
  });
});
