import { describe, expect, it } from 'vitest';
import { evaluateTradeoffMatrix } from './tradeoffMatrix';
import type { TradeoffMatrixExercise } from '../../content/types';

const exercise: TradeoffMatrixExercise = {
  id: 'ex-tenant',
  type: 'tradeoff-matrix',
  title: 'Multi-tenancy',
  prompt: '...',
  concepts: ['multi-tenancy-tenant-id'],
  requiredJustificationCount: 2,
  options: [
    { id: 'shared-tenant-id', label: 'tenant_id compartido', isCorrect: true },
    { id: 'schema-per-client', label: 'esquema por cliente', isCorrect: false },
    { id: 'db-per-client', label: 'base de datos por cliente', isCorrect: false },
  ],
  justifications: [
    { id: 'j-cost', text: 'menor costo operativo para 3 empleados', kind: 'correct' },
    { id: 'j-simplicity', text: 'una sola base para mantener', kind: 'correct' },
    { id: 'j-soc2', text: 'aísla mejor ante una auditoría SOC2', kind: 'true-but-irrelevant' },
    { id: 'j-false', text: 'es la única opción que soporta backups', kind: 'false' },
  ],
};

describe('evaluateTradeoffMatrix', () => {
  it('correcto: opción correcta + justificaciones correctas', () => {
    const evaluation = evaluateTradeoffMatrix(exercise, {
      selectedOptionId: 'shared-tenant-id',
      selectedJustificationIds: ['j-cost', 'j-simplicity'],
    });
    expect(evaluation.correct).toBe(true);
  });

  it('NO correcto: opción correcta pero con justificación verdadera-pero-irrelevante', () => {
    const evaluation = evaluateTradeoffMatrix(exercise, {
      selectedOptionId: 'shared-tenant-id',
      selectedJustificationIds: ['j-cost', 'j-soc2'],
    });
    expect(evaluation.optionCorrect).toBe(true);
    expect(evaluation.correct).toBe(false);
  });

  it('NO correcto: opción equivocada aunque las justificaciones sean válidas para otra', () => {
    const evaluation = evaluateTradeoffMatrix(exercise, {
      selectedOptionId: 'schema-per-client',
      selectedJustificationIds: ['j-cost', 'j-simplicity'],
    });
    expect(evaluation.correct).toBe(false);
  });

  it('NO correcto: cantidad de justificaciones distinta a la requerida', () => {
    const evaluation = evaluateTradeoffMatrix(exercise, {
      selectedOptionId: 'shared-tenant-id',
      selectedJustificationIds: ['j-cost'],
    });
    expect(evaluation.correct).toBe(false);
  });
});
