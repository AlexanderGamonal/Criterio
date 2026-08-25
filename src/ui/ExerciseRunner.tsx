import type { Exercise } from '../content/types';
import type { ExerciseResult } from '../progress/types';
import type { LLMAdapter } from '../engine/llm/types';
import { SchemaForgeView } from './primitives/SchemaForgeView';
import { TradeoffMatrixView } from './primitives/TradeoffMatrixView';
import { BugHuntView } from './primitives/BugHuntView';
import { TimelineView } from './primitives/TimelineView';
import { ClientArenaView } from './primitives/ClientArenaView';
import { toExerciseResult as schemaForgeResult } from '../engine/primitives/schemaForge';
import { toExerciseResult as tradeoffResult } from '../engine/primitives/tradeoffMatrix';
import { toExerciseResult as bugHuntResult } from '../engine/primitives/bugHunt';
import { toExerciseResult as timelineResult } from '../engine/primitives/timeline';

interface ExerciseRunnerProps {
  exercise: Exercise;
  llmAdapter: LLMAdapter;
  onResult: (result: ExerciseResult) => void;
}

/**
 * Único lugar que sabe traducir cada primitiva a un ExerciseResult genérico.
 * Agregar una sexta primitiva significaría sumar un caso aquí, no tocar
 * el motor de progreso ni las primitivas existentes.
 */
export function ExerciseRunner({ exercise, llmAdapter, onResult }: ExerciseRunnerProps) {
  switch (exercise.type) {
    case 'schema-forge':
      return <SchemaForgeView exercise={exercise} onComplete={(e) => onResult(schemaForgeResult(exercise, e))} />;
    case 'tradeoff-matrix':
      return <TradeoffMatrixView exercise={exercise} onComplete={(e) => onResult(tradeoffResult(exercise, e))} />;
    case 'bug-hunt':
      return <BugHuntView exercise={exercise} onComplete={(e) => onResult(bugHuntResult(exercise, e))} />;
    case 'timeline':
      return <TimelineView exercise={exercise} onComplete={(e) => onResult(timelineResult(exercise, e))} />;
    case 'client-arena':
      return <ClientArenaView exercise={exercise} llmAdapter={llmAdapter} onComplete={onResult} />;
  }
}
