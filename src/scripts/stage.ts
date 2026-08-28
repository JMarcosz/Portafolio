// Contrato entre cada sección y el director de escena (groups.ts).
//
// Hay exactamente dos formas de animar una sección, y ninguna es "atar el
// timeline al scroll":
//
//   reveal()  Entrada. El director la corre UNA vez, por tiempo, cuando la
//             sección cruza la línea de lectura Y su grupo ya manda en pantalla.
//             Corre a su propio tempo: no se estira ni se aplasta según cuánto
//             scrollee el usuario.
//
//   live()    Efecto continuo y bidireccional — hoy sólo el trazo de la línea de
//             Experiencia. Se llama en cada frame con el rect en vivo, y sólo
//             mientras el grupo está presentado con escala exacta: durante el
//             zoom el grupo está escalado y los rects no son medibles.
//
// El estado inicial oculto lo aplica `prepare()` al registrar, no el componente,
// para que bajo prefers-reduced-motion nunca llegue a esconderse nada: ahí el
// director ni siquiera arranca, así que se llama `settle()` y se termina.
import type { gsap } from "gsap";
import { prefersReducedMotion } from "./motion";

export type SectionSpec = {
  /** Estado inicial oculto. Se aplica al registrar. */
  prepare?: () => void;
  /** Coreografía de entrada. Se corre una sola vez. */
  reveal?: () => gsap.core.Timeline | void;
  /** Efecto continuo. `rect` es el de la sección en el frame actual. */
  live?: (rect: DOMRect, vh: number) => void;
  /** Estado final inmediato, sin animación (reduced-motion). */
  settle: () => void;
};

type Entry = { spec: SectionSpec; revealed: boolean };

const sections = new Map<string, Entry>();

export function registerSection(id: string, spec: SectionSpec) {
  if (prefersReducedMotion()) {
    spec.settle();
    return;
  }
  spec.prepare?.();
  sections.set(id, { spec, revealed: false });
}

/** Dispara la entrada si todavía no corrió. */
export function revealSection(id: string) {
  const entry = sections.get(id);
  if (!entry || entry.revealed) return;
  entry.revealed = true;
  entry.spec.reveal?.();
}

export function liveSection(id: string, rect: DOMRect, vh: number) {
  sections.get(id)?.spec.live?.(rect, vh);
}
