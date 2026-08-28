// Contrato entre cada sección y el controlador del túnel de grupos (groups.ts).
//
// Cada sección construye su coreografía como un timeline en pausa y registra
// `scrub(t, tMax)`:
//   - t     = progreso EN VIVO de la sección por el viewport (0..1, retrocede al
//             subir). Úsalo para efectos bidireccionales, como el llenado de la
//             línea de tiempo.
//   - tMax  = máximo alcanzado, no retrocede. Úsalo para revelados de una sola
//             vez (tarjetas, contadores, persianas).
export type ScrubFn = (t: number, tMax: number) => void;

const scrubbers = new Map<string, ScrubFn>();

export function registerPanelScrub(id: string, fn: ScrubFn) {
  scrubbers.set(id, fn);
  fn(0, 0);
}

export function getPanelScrub(id: string): ScrubFn | undefined {
  return scrubbers.get(id);
}
