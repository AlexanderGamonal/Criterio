import { useState } from 'react';
import { useProgressStore } from './progress/store';
import { applyExerciseResult } from './progress/mastery';
import { selectReviewItems } from './progress/spacedRepetition';
import { MODULES } from './content/loadModules';
import { useLLMAdapter } from './ui/useLLMAdapter';
import { Header } from './ui/Header';
import { MasteryMap } from './ui/MasteryMap';
import { ModuleScreen } from './ui/ModuleScreen';
import { LessonScreen } from './ui/LessonScreen';
import { SettingsScreen } from './ui/SettingsScreen';
import { ReviewGate } from './ui/ReviewGate';
import { loadRoute, saveRoute } from './ui/routePersistence';
import type { ExerciseResult } from './progress/types';

type Route =
  | { screen: 'map' }
  | { screen: 'settings' }
  | { screen: 'module'; moduleId: string }
  | { screen: 'lesson'; moduleId: string; lessonId: string };

function findLessonForConcept(conceptId: string): { moduleId: string; lessonId: string } | null {
  for (const module of MODULES) {
    for (const lesson of module.lessons) {
      if (lesson.concepts.includes(conceptId)) return { moduleId: module.id, lessonId: lesson.id };
    }
  }
  return null;
}

/** Valida la ruta guardada: campos faltantes o corruptos caen de vuelta al mapa. */
function toValidRoute(stored: ReturnType<typeof loadRoute>): Route {
  if (!stored) return { screen: 'map' };
  if (stored.screen === 'settings') return { screen: 'settings' };
  if (stored.screen === 'module' && stored.moduleId) return { screen: 'module', moduleId: stored.moduleId };
  if (stored.screen === 'lesson' && stored.moduleId && stored.lessonId) {
    return { screen: 'lesson', moduleId: stored.moduleId, lessonId: stored.lessonId };
  }
  return { screen: 'map' };
}

export default function App() {
  // Recuerda la pantalla actual: si el navegador descarga la pestaña en
  // segundo plano (frecuente en Android con poca batería) y la recarga,
  // el usuario vuelve a donde estaba en vez de al mapa.
  const [route, setRouteState] = useState<Route>(() => toValidRoute(loadRoute()));
  const [completedExerciseIds, setCompletedExerciseIds] = useState<Set<string>>(new Set());

  function setRoute(next: Route) {
    setRouteState(next);
    saveRoute(next);
  }

  const state = useProgressStore((s) => s.state);
  const setState = useProgressStore((s) => s.setState);
  const llmAdapter = useLLMAdapter();

  const dueItems = selectReviewItems(state);

  function handleExerciseResult(result: ExerciseResult) {
    setState((prev) => applyExerciseResult(prev, result));
    setCompletedExerciseIds((prev) => new Set(prev).add(result.exerciseId));
  }

  function handleOpenConcept(conceptId: string) {
    const location = findLessonForConcept(conceptId);
    if (location) setRoute({ screen: 'lesson', ...location });
  }

  if (dueItems.length > 0) {
    return (
      <div className="min-h-screen">
        <Header onOpenSettings={() => setRoute({ screen: 'settings' })} onGoHome={() => {}} />
        <main className="max-w-3xl mx-auto px-6 py-10">
          <ReviewGate modules={MODULES} dueItems={dueItems} llmAdapter={llmAdapter} onExerciseResult={handleExerciseResult} />
        </main>
      </div>
    );
  }

  function content() {
    if (route.screen === 'settings') {
      return <SettingsScreen onBack={() => setRoute({ screen: 'map' })} />;
    }

    if (route.screen === 'module') {
      const module = MODULES.find((m) => m.id === route.moduleId);
      if (!module) return <MasteryMap modules={MODULES} state={state} onOpenModule={(id) => setRoute({ screen: 'module', moduleId: id })} onOpenConcept={handleOpenConcept} />;
      return (
        <ModuleScreen
          module={module}
          onOpenLesson={(lessonId) => setRoute({ screen: 'lesson', moduleId: module.id, lessonId })}
          onBack={() => setRoute({ screen: 'map' })}
        />
      );
    }

    if (route.screen === 'lesson') {
      const module = MODULES.find((m) => m.id === route.moduleId);
      const lesson = module?.lessons.find((l) => l.id === route.lessonId);
      if (!module || !lesson) return <MasteryMap modules={MODULES} state={state} onOpenModule={(id) => setRoute({ screen: 'module', moduleId: id })} onOpenConcept={handleOpenConcept} />;
      return (
        <LessonScreen
          lesson={lesson}
          llmAdapter={llmAdapter}
          completedExerciseIds={completedExerciseIds}
          onExerciseResult={handleExerciseResult}
          onBack={() => setRoute({ screen: 'module', moduleId: module.id })}
        />
      );
    }

    return <MasteryMap modules={MODULES} state={state} onOpenModule={(id) => setRoute({ screen: 'module', moduleId: id })} onOpenConcept={handleOpenConcept} />;
  }

  return (
    <div className="min-h-screen">
      <Header onOpenSettings={() => setRoute({ screen: 'settings' })} onGoHome={() => setRoute({ screen: 'map' })} />
      <main className="max-w-3xl mx-auto px-6 py-10">{content()}</main>
    </div>
  );
}
