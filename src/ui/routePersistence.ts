// Persiste la pantalla actual para sobrevivir a que el navegador descargue
// la pestaña en segundo plano (común en Android con poca batería/memoria) y
// la recargue desde cero. Es navegación, no progreso de aprendizaje: vive en
// su propia clave, separada de criterio:progress, y se valida de forma
// tolerante — cualquier dato inesperado cae de vuelta al mapa sin romper la app.

const ROUTE_STORAGE_KEY = 'criterio:route';

export interface StoredRoute {
  screen: 'map' | 'settings' | 'module' | 'lesson';
  moduleId?: string;
  lessonId?: string;
}

export function loadRoute(): StoredRoute | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ROUTE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!['map', 'settings', 'module', 'lesson'].includes(parsed.screen)) return null;
    return parsed as StoredRoute;
  } catch {
    return null;
  }
}

export function saveRoute(route: StoredRoute): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ROUTE_STORAGE_KEY, JSON.stringify(route));
  } catch {
    // almacenamiento lleno o no disponible: se ignora, no rompe la app.
  }
}
