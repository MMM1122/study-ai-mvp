export type Bi = { en: string; zh: string };
export type Step = { title: Bi; detail: Bi };
export type Bridge = { field: Bi; example: Bi; mapping: Bi; boundary: Bi };
export type Lesson = {
  id: string; title: Bi; pattern: 'representation'|'systems'|'feedback'|'constraints'|'levels';
  fields: string[]; question: Bi; intuition: Bi;
  template: 'pipeline'|'memory'|'experiment';
  simulation: 'pipeline'|'state'|'layers'|'memory'|'perception'|'feedback'|'waves';
  steps: Step[]; bridges: Bridge[];
  challenge: { question: Bi; options: Bi[]; answer: number; explanation: Bi };
  sources: { label: string; url: string }[];
  source_facts: { quote: string; page: number|null }[];
};
export type LabDocument = { document_id: number; document_title: string; concepts: Lesson[]; generated_at: string; truncated: boolean };
