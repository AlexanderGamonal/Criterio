import { ArrowLeft } from 'lucide-react';
import type { Module } from '../content/types';

interface ModuleScreenProps {
  module: Module;
  onOpenLesson: (lessonId: string) => void;
  onBack: () => void;
}

export function ModuleScreen({ module, onOpenLesson, onBack }: ModuleScreenProps) {
  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="text-grafito hover:text-papel flex items-center gap-1 text-sm">
        <ArrowLeft size={14} /> volver al mapa
      </button>

      <div>
        <h1 className="font-display text-2xl text-papel mb-1">{module.title}</h1>
        <p className="text-grafito">{module.clientContext}</p>
      </div>

      <div className="grid gap-2">
        {module.lessons.map((lesson) => (
          <button
            key={lesson.id}
            type="button"
            onClick={() => onOpenLesson(lesson.id)}
            className="text-left px-4 py-3 rounded border border-grafito/30 hover:border-laton transition-colors bg-pliego"
          >
            <p className="text-papel">{lesson.title}</p>
            <p className="text-grafito text-sm font-mono">{lesson.exercises.length} ejercicios</p>
          </button>
        ))}
      </div>
    </div>
  );
}
