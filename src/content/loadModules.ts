import module01 from './modules/module-01-modelado.json';
import stubModules from './modules/module-02-05.stub.json';
import conceptsData from './concepts.json';
import type { Concept, Module } from './types';

/**
 * Único punto donde el motor toca archivos concretos de contenido. Agregar
 * un módulo nuevo es escribir su JSON y sumarlo a este arreglo; nada en
 * src/engine/ necesita cambiar.
 */
export const MODULES: Module[] = [module01 as Module, ...(stubModules as Module[])].sort(
  (a, b) => a.order - b.order,
);

export const CONCEPTS: Concept[] = conceptsData as Concept[];
