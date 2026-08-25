import { describe, expect, it } from 'vitest';
import { migrateState } from './persistence';
import { CURRENT_SCHEMA_VERSION, DEFAULT_DAILY_REVIEW_SIZE } from './types';

describe('migrateState: guardado real de v1 (antes de dailyReviewSize)', () => {
  const v1Save = {
    schemaVersion: 1,
    concepts: {
      'entidades-relaciones-pk-fk': {
        conceptId: 'entidades-relaciones-pk-fk',
        level: 'consolidado',
        distinctPrimitivesPassed: ['schema-forge', 'tradeoff-matrix'],
        lastPracticedAt: 1_700_000_000_000,
        spacedRepetition: { intervalIndex: 2, dueAt: 1_700_700_000_000, recentFailures: 0 },
      },
    },
    history: [
      {
        exerciseId: 'l1-schema-ventas',
        primitiveType: 'schema-forge',
        concepts: ['entidades-relaciones-pk-fk'],
        correct: true,
        timestamp: 1_700_000_000_000,
      },
    ],
    settings: { llmProvider: 'gemini' },
  };

  it('migra a la versión actual', () => {
    const migrated = migrateState(v1Save);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('conserva la maestría consolidada, el historial y el proveedor elegido', () => {
    const migrated = migrateState(v1Save);
    expect(migrated.concepts['entidades-relaciones-pk-fk'].level).toBe('consolidado');
    expect(migrated.concepts['entidades-relaciones-pk-fk'].distinctPrimitivesPassed).toEqual([
      'schema-forge',
      'tradeoff-matrix',
    ]);
    expect(migrated.history).toHaveLength(1);
    expect(migrated.settings.llmProvider).toBe('gemini');
  });

  it('completa dailyReviewSize (campo nuevo en v2) con el default, sin que el usuario lo pidiera', () => {
    const migrated = migrateState(v1Save);
    expect(migrated.settings.dailyReviewSize).toBe(DEFAULT_DAILY_REVIEW_SIZE);
  });
});

describe('migrateState: guardado ya en la versión actual', () => {
  it('pasa sin tocarlo', () => {
    const current = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      concepts: {},
      history: [],
      settings: { llmProvider: 'groq', dailyReviewSize: 3 },
    };
    const migrated = migrateState(current);
    expect(migrated.settings.dailyReviewSize).toBe(3);
    expect(migrated.settings.llmProvider).toBe('groq');
  });
});

describe('migrateState: guardado corrupto o de una versión sin ruta de migración conocida', () => {
  it('un schemaVersion inexistente (0, muy anterior a versionar) cae al camino tolerante sin lanzar', () => {
    const veryOld = {
      schemaVersion: 0,
      concepts: { c1: { conceptId: 'c1', level: 'practicando' } }, // shape parcial, plausible
    };
    expect(() => migrateState(veryOld)).not.toThrow();
    const migrated = migrateState(veryOld);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    // no hay ruta de migración registrada para v0: se conserva lo reconocible tal cual está,
    // sin intentar adivinar el resto de ConceptProgress.
    expect(migrated.concepts.c1).toBeDefined();
    expect(migrated.settings.dailyReviewSize).toBe(DEFAULT_DAILY_REVIEW_SIZE);
  });

  it('concepts/history con tipos equivocados no rompen la carga, se descartan con seguridad', () => {
    const corrupt = {
      schemaVersion: 1,
      concepts: null,
      history: 'no soy un arreglo',
      settings: { llmProvider: 'algo-invalido', dailyReviewSize: -5 },
    };
    const migrated = migrateState(corrupt);
    expect(migrated.concepts).toEqual({});
    expect(migrated.history).toEqual([]);
    expect(migrated.settings.llmProvider).toBe('mock');
    expect(migrated.settings.dailyReviewSize).toBe(DEFAULT_DAILY_REVIEW_SIZE);
  });

  it('un valor completamente ajeno (string, null, arreglo) no lanza y devuelve estado vacío válido', () => {
    for (const garbage of [null, 'texto suelto', 42, []]) {
      expect(() => migrateState(garbage)).not.toThrow();
      const migrated = migrateState(garbage);
      expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(migrated.concepts).toEqual({});
    }
  });

  it('un schemaVersion del futuro (mayor al actual) no lanza y se trata como estado actual', () => {
    const fromTheFuture = {
      schemaVersion: 99,
      concepts: { c1: { conceptId: 'c1', level: 'consolidado' } },
      history: [],
      settings: { llmProvider: 'mock', dailyReviewSize: 4 },
    };
    const migrated = migrateState(fromTheFuture);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated.concepts.c1).toBeDefined();
  });
});
