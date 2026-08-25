// Tipos del modelo de contenido. Este archivo es la frontera entre
// "contenido" (JSON puro) y "motor" (código). El motor solo conoce estos
// tipos; nunca conoce el Módulo 1, ni a Marta, ni ningún dato concreto.

// ---------------------------------------------------------------------------
// Conceptos
// ---------------------------------------------------------------------------

export type ConceptId = string;

export interface Concept {
  id: ConceptId;
  name: string;
  moduleId: string;
  /** Conceptos que deberían estar en `consolidado` antes de abordar este. */
  prerequisites: ConceptId[];
}

// ---------------------------------------------------------------------------
// Primitivas de ejercicio
// ---------------------------------------------------------------------------

export type PrimitiveType =
  | 'schema-forge'
  | 'timeline'
  | 'bug-hunt'
  | 'tradeoff-matrix'
  | 'client-arena';

interface ExerciseBase {
  id: string;
  type: PrimitiveType;
  title: string;
  /** Enunciado / contexto narrativo mostrado antes del ejercicio. */
  prompt: string;
  /** Conceptos que este ejercicio ejercita, para el motor de maestría. */
  concepts: ConceptId[];
}

// --- SchemaForge -----------------------------------------------------------

export type ColumnType =
  | 'string'
  | 'text'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'uuid';

export interface SchemaColumnSeed {
  id: string;
  name: string;
  type: ColumnType;
  isPrimaryKey?: boolean;
  /** id de la columna (de otra tabla) a la que referencia esta FK. */
  references?: string;
  nullable?: boolean;
}

export interface SchemaTableSeed {
  id: string;
  name: string;
  columns: SchemaColumnSeed[];
}

/**
 * Nombre de una regla registrada en engine/validators/invariants.
 * El motor no sabe qué significa 'historical-price-preserved'; solo sabe
 * ejecutar la función registrada bajo ese nombre contra el grafo del esquema.
 */
export type InvariantName = string;

export interface SchemaInvariant {
  name: InvariantName;
  /** Parámetros libres que la regla interpreta (ids de tabla, patrones, etc). */
  params?: Record<string, unknown>;
  /** Mensaje mostrado cuando el invariante falla. Prioriza consecuencia de negocio. */
  failureMessage: string;
  successMessage?: string;
}

export interface SchemaForgeExercise extends ExerciseBase {
  type: 'schema-forge';
  /** Tablas iniciales que el usuario puede editar (vacío = lienzo en blanco). */
  seedTables: SchemaTableSeed[];
  invariants: SchemaInvariant[];
}

// --- Timeline ----------------------------------------------------------------

export interface TimelineOperation {
  id: string;
  /** Transacción a la que pertenece (para agrupar visualmente). */
  transactionId: string;
  label: string;
  /** Efecto declarativo que el simulador aplica sobre el estado. */
  effect: {
    kind: 'read' | 'write';
    key: string;
    value?: string | number;
    /** 'delta' suma `value` al estado actual; 'set' lo reemplaza. Default: 'set'. */
    mode?: 'set' | 'delta';
  };
}

export interface TimelineExercise extends ExerciseBase {
  type: 'timeline';
  initialState: Record<string, number | string>;
  operations: TimelineOperation[];
  /** Estado esperado tras la ejecución en el orden correcto declarado por el autor. */
  expectedFinalState: Record<string, number | string>;
  isolationLevel?: 'read-committed' | 'repeatable-read' | 'serializable';
}

// --- BugHunt -----------------------------------------------------------------

export interface BugHuntArtifact {
  kind: 'schema' | 'sql' | 'endpoint' | 'policy';
  /** Contenido a mostrar; para 'schema' puede ser SchemaTableSeed[] serializado como JSON string. */
  content: string;
}

export interface BugHuntCulprit {
  /** id del elemento culpable dentro del artefacto (línea, columna, tabla). */
  elementId: string;
  label: string;
}

export interface BugHuntCauseOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface BugHuntExercise extends ExerciseBase {
  type: 'bug-hunt';
  symptom: string;
  artifact: BugHuntArtifact;
  culprits: BugHuntCulprit[];
  correctCulpritId: string;
  causeOptions: BugHuntCauseOption[];
}

// --- TradeoffMatrix ------------------------------------------------------------

export interface TradeoffOption {
  id: string;
  label: string;
  isCorrect: boolean;
}

export interface TradeoffJustification {
  id: string;
  text: string;
  /** Verdadera pero irrelevante para el caso concreto, falsa, o correcta. */
  kind: 'correct' | 'true-but-irrelevant' | 'false';
}

export interface TradeoffMatrixExercise extends ExerciseBase {
  type: 'tradeoff-matrix';
  options: TradeoffOption[];
  justifications: TradeoffJustification[];
  /** Cuántas justificaciones debe elegir el usuario (spec: 2). */
  requiredJustificationCount: number;
}

// --- ClientArena ---------------------------------------------------------------

export interface ClientArenaMarkerDelta {
  budget?: number;
  trust?: number;
  techDebt?: number;
}

export interface ClientArenaChoice {
  id: string;
  text: string;
  deltas: ClientArenaMarkerDelta;
  /** Nodo siguiente dentro de `nodes`. */
  nextNodeId: string;
  feedback?: string;
}

export interface ClientArenaMultipleChoiceNode {
  id: string;
  type: 'multiple-choice';
  clientLine: string;
  choices: ClientArenaChoice[];
}

export interface ClientArenaRubricCriterion {
  id: string;
  description: string;
  weight: number;
}

export interface ClientArenaFreeResponseNode {
  id: string;
  type: 'free-response';
  clientLine: string;
  rubric: ClientArenaRubricCriterion[];
  /** Usado por MockAdapter cuando no hay LLM disponible. */
  fallbackChoices: ClientArenaChoice[];
}

export interface ClientArenaEndingNode {
  id: string;
  type: 'ending';
  /** Condición simple sobre los marcadores acumulados para decidir el desenlace mostrado. */
  condition?: {
    metric: 'budget' | 'trust' | 'techDebt';
    operator: 'gte' | 'lte';
    value: number;
  };
  text: string;
}

export type ClientArenaNode =
  | ClientArenaMultipleChoiceNode
  | ClientArenaFreeResponseNode
  | ClientArenaEndingNode;

export interface ClientArenaExercise extends ExerciseBase {
  type: 'client-arena';
  initialMarkers: { budget: number; trust: number; techDebt: number };
  startNodeId: string;
  nodes: ClientArenaNode[];
}

export type Exercise =
  | SchemaForgeExercise
  | TimelineExercise
  | BugHuntExercise
  | TradeoffMatrixExercise
  | ClientArenaExercise;

// ---------------------------------------------------------------------------
// Lecciones y módulos
// ---------------------------------------------------------------------------

export interface Lesson {
  id: string;
  title: string;
  /** Texto/markdown de introducción teórica antes del ejercicio. */
  narrative: string;
  concepts: ConceptId[];
  exercises: Exercise[];
}

export interface Module {
  id: string;
  order: number;
  title: string;
  /** Resumen del arco narrativo del cliente ficticio en este módulo. */
  clientContext: string;
  lessons: Lesson[];
  /** true en módulos stub (metadata sin contenido real todavía). */
  isStub?: boolean;
}
