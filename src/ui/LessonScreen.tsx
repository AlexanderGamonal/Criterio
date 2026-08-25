import { ArrowLeft, Check } from 'lucide-react';
import type { Lesson } from '../content/types';
import type { ExerciseResult } from '../progress/types';
import type { LLMAdapter } from '../engine/llm/types';
import { ExerciseRunner } from './ExerciseRunner';
import { renderRichText } from './richText';

interface LessonScreenProps {
  lesson: Lesson;
  llmAdapter: LLMAdapter;
  completedExerciseIds: Set<string>;
  onExerciseResult: (result: ExerciseResult) => void;
  onBack: () => void;
}

export function LessonScreen({ lesson, llmAdapter, completedExerciseIds, onExerciseResult, onBack }: LessonScreenProps) {
  return (
    <div className="space-y-8">
      <button type="button" onClick={onBack} className="text-grafito hover:text-papel flex items-center gap-1 text-sm">
        <ArrowLeft size={14} /> volver al módulo
      </button>

      <div>
        <h1 className="font-display text-2xl text-papel mb-3">{lesson.title}</h1>
        <div className="text-papel/90 space-y-3 leading-relaxed max-w-2xl">
          {lesson.narrative.split('\n\n').map((paragraph, i) => (
            <p key={i}>{renderRichText(paragraph)}</p>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {lesson.exercises.map((exercise) => {
          const done = completedExerciseIds.has(exercise.id);
          return (
            <div key={exercise.id} className="border-t border-grafito/20 pt-6">
              {done && (
                <p className="flex items-center gap-1.5 text-verdin text-sm font-mono mb-3">
                  <Check size={14} /> completado
                </p>
              )}
              <ExerciseRunner exercise={exercise} llmAdapter={llmAdapter} onResult={onExerciseResult} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
