import { useProgressStore } from './progress/store';

export default function App() {
  const conceptCount = Object.keys(useProgressStore((s) => s.state).concepts).length;

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl text-papel">Criterio</h1>
        <p className="text-grafito">arquitectura de software para clientes reales</p>
        <p className="text-grafito text-sm font-mono">
          andamiaje fase 1 — conceptos en progreso: {conceptCount}
        </p>
      </div>
    </main>
  );
}
