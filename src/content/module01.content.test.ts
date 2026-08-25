import { describe, expect, it } from 'vitest';
import { MODULES } from './loadModules';
import { evaluateSchemaForge } from '../engine/primitives/schemaForge';
import { evaluateBugHunt } from '../engine/primitives/bugHunt';
import { evaluateTimeline } from '../engine/primitives/timeline';
import { evaluateTradeoffMatrix } from '../engine/primitives/tradeoffMatrix';
import { applyMarkerDeltas, resolveEnding } from '../engine/primitives/clientArena';
import { isModuleUnlocked } from '../progress/unlock';
import { createEmptyState } from '../progress/types';
import type {
  BugHuntExercise,
  ClientArenaExercise,
  SchemaForgeExercise,
  SchemaTableSeed,
  TimelineExercise,
  TradeoffMatrixExercise,
} from './types';

const module1 = MODULES.find((m) => m.id === 'module-01')!;

function findExercise<T extends { id: string }>(exerciseId: string): T {
  for (const lesson of module1.lessons) {
    const exercise = lesson.exercises.find((e) => e.id === exerciseId);
    if (exercise) return exercise as unknown as T;
  }
  throw new Error(`Ejercicio no encontrado: ${exerciseId}`);
}

describe('contenido del Módulo 1: engine agnóstico, contenido real', () => {
  it('el módulo existe y tiene 5 lecciones con al menos un ejercicio cada una', () => {
    expect(module1).toBeDefined();
    expect(module1.lessons.length).toBe(5);
    for (const lesson of module1.lessons) {
      expect(lesson.exercises.length).toBeGreaterThan(0);
    }
  });

  it('SchemaForge l1: un esquema con precio propio en el detalle pasa los invariantes', () => {
    const exercise = findExercise<SchemaForgeExercise>('l1-schema-ventas');
    const schema: SchemaTableSeed[] = [
      { id: 'productos', name: 'productos', columns: [{ id: 'productos-id', name: 'id', type: 'uuid', isPrimaryKey: true }] },
      { id: 'clientes', name: 'clientes', columns: [{ id: 'clientes-id', name: 'id', type: 'uuid', isPrimaryKey: true }] },
      {
        id: 'ventas',
        name: 'ventas',
        columns: [
          { id: 'ventas-id', name: 'id', type: 'uuid', isPrimaryKey: true },
          { id: 'ventas-cliente', name: 'cliente_id', type: 'uuid', references: 'clientes-id' },
        ],
      },
      {
        id: 'venta_detalle',
        name: 'venta_detalle',
        columns: [
          { id: 'vd-id', name: 'id', type: 'uuid', isPrimaryKey: true },
          { id: 'vd-venta', name: 'venta_id', type: 'uuid', references: 'ventas-id' },
          { id: 'vd-producto', name: 'producto_id', type: 'uuid', references: 'productos-id' },
          { id: 'vd-precio', name: 'precio_unitario', type: 'decimal' },
        ],
      },
    ];
    expect(evaluateSchemaForge(exercise, schema).correct).toBe(true);
  });

  it('SchemaForge l1: el bug real de Marta (FK sin precio propio) falla el invariante', () => {
    const exercise = findExercise<SchemaForgeExercise>('l1-schema-ventas');
    const schema: SchemaTableSeed[] = [
      { id: 'productos', name: 'productos', columns: [{ id: 'productos-id', name: 'id', type: 'uuid', isPrimaryKey: true }] },
      {
        id: 'venta_detalle',
        name: 'venta_detalle',
        columns: [
          { id: 'vd-id', name: 'id', type: 'uuid', isPrimaryKey: true },
          { id: 'vd-producto', name: 'producto_id', type: 'uuid', references: 'productos-id' },
        ],
      },
    ];
    expect(evaluateSchemaForge(exercise, schema).correct).toBe(false);
  });

  it('BugHunt l2: lugar y causa correctos evalúan a correcto', () => {
    const exercise = findExercise<BugHuntExercise>('l2-bug-direccion-repetida');
    const evaluation = evaluateBugHunt(exercise, {
      selectedElementId: 'pedidos.direccion',
      selectedCauseId: 'cause-denorm-sin-dueno',
    });
    expect(evaluation.correct).toBe(true);
  });

  it('SchemaForge l3: kárdex con costo propio por movimiento pasa los invariantes', () => {
    const exercise = findExercise<SchemaForgeExercise>('l3-schema-kardex');
    const schema: SchemaTableSeed[] = [
      ...exercise.seedTables,
      {
        id: 'movimientos',
        name: 'movimientos_inventario',
        columns: [
          { id: 'mov-id', name: 'id', type: 'uuid', isPrimaryKey: true },
          { id: 'mov-producto', name: 'producto_id', type: 'uuid', references: 'productos-id' },
          { id: 'mov-tipo', name: 'tipo', type: 'string' },
          { id: 'mov-cantidad', name: 'cantidad', type: 'decimal' },
          { id: 'mov-costo', name: 'costo_unitario', type: 'decimal' },
        ],
      },
    ];
    expect(evaluateSchemaForge(exercise, schema).correct).toBe(true);
  });

  it('Timeline l3: la predicción correcta según el JSON evalúa a correcto', () => {
    const exercise = findExercise<TimelineExercise>('l3-timeline-kardex-vs-update');
    const order = exercise.operations.map((op) => op.id);
    const evaluation = evaluateTimeline(exercise, { order, predictedFinalState: exercise.expectedFinalState });
    expect(evaluation.correct).toBe(true);
  });

  it('TradeoffMatrix l4: tenant_id compartido con las razones correctas evalúa a correcto', () => {
    const exercise = findExercise<TradeoffMatrixExercise>('l4-tradeoff-multitenancy');
    const evaluation = evaluateTradeoffMatrix(exercise, {
      selectedOptionId: 'opt-tenant-id',
      selectedJustificationIds: ['j-costo-operativo', 'j-mantenimiento-simple'],
    });
    expect(evaluation.correct).toBe(true);
  });

  it('TradeoffMatrix l4: la opción correcta con una razón verdadera-pero-irrelevante NO consolida', () => {
    const exercise = findExercise<TradeoffMatrixExercise>('l4-tradeoff-multitenancy');
    const evaluation = evaluateTradeoffMatrix(exercise, {
      selectedOptionId: 'opt-tenant-id',
      selectedJustificationIds: ['j-costo-operativo', 'j-soc2'],
    });
    expect(evaluation.correct).toBe(false);
  });

  it('ClientArena l5: el camino de confianza alta lleva al desenlace de confianza', () => {
    const exercise = findExercise<ClientArenaExercise>('l5-client-arena-marta');
    let markers = exercise.initialMarkers;
    const n1 = exercise.nodes.find((n) => n.id === 'n-intro' && n.type === 'multiple-choice')!;
    if (n1.type === 'multiple-choice') {
      const choice = n1.choices.find((c) => c.id === 'c-explicar-incidente')!;
      markers = applyMarkerDeltas(markers, choice.deltas);
    }
    const n2 = exercise.nodes.find((n) => n.id === 'n-budget' && n.type === 'multiple-choice')!;
    if (n2.type === 'multiple-choice') {
      const choice = n2.choices.find((c) => c.id === 'c-justificar-costo')!;
      markers = applyMarkerDeltas(markers, choice.deltas);
    }
    const ending = resolveEnding(exercise, markers);
    expect(ending.id).toBe('end-confianza-alta');
  });

  it('ClientArena l5: el camino de atajos lleva al desenlace de deuda técnica', () => {
    const exercise = findExercise<ClientArenaExercise>('l5-client-arena-marta');
    let markers = exercise.initialMarkers;
    const n1 = exercise.nodes.find((n) => n.id === 'n-intro' && n.type === 'multiple-choice')!;
    if (n1.type === 'multiple-choice') {
      const choice = n1.choices.find((c) => c.id === 'c-aceptar-atajo')!;
      markers = applyMarkerDeltas(markers, choice.deltas);
    }
    const n2 = exercise.nodes.find((n) => n.id === 'n-budget' && n.type === 'multiple-choice')!;
    if (n2.type === 'multiple-choice') {
      const choice = n2.choices.find((c) => c.id === 'c-descuento-recorte')!;
      markers = applyMarkerDeltas(markers, choice.deltas);
    }
    const ending = resolveEnding(exercise, markers);
    expect(ending.id).toBe('end-deuda-alta');
  });
});

describe('módulos stub 2-5: el motor los carga sin tocar src/engine', () => {
  it('existen 4 módulos stub, después del Módulo 1, cargados por el mismo loader', () => {
    const stubs = MODULES.filter((m) => m.isStub);
    expect(stubs.length).toBe(4);
    expect(stubs.map((m) => m.id)).toEqual(['module-02', 'module-03', 'module-04', 'module-05']);
  });

  it('isModuleUnlocked funciona sobre un módulo stub sin lanzar', () => {
    expect(() => isModuleUnlocked(MODULES, 'module-02', createEmptyState())).not.toThrow();
  });
});
