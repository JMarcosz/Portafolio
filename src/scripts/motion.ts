// Setup compartido de animación. Se importa desde el <script> de cada componente;
// Vite comparte la misma instancia de módulo entre todos ellos, así que
// gsap.registerPlugin() solo corre una vez sin importar cuántos componentes lo importen.
// Flip estaba importado y registrado sin un solo uso en todo src/: eran ~15 KB
// de plugin viajando dentro del bundle crítico por nada.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * Vocabulario de movimiento compartido por todas las secciones.
 *
 * Existe para que las entradas se sientan de la misma familia: antes cada
 * componente elegía su propia duración y su propio stagger (iban de 0.06 a 0.4)
 * y el resultado era que unas secciones entraban en medio segundo y otras
 * tardaban más de tres. Si una entrada necesita otro tiempo, que sea una
 * decisión explícita y no el default.
 */
export const TOKENS = {
  revealSm: { duration: 0.5, ease: "power3.out" },
  revealMd: { duration: 0.6, ease: "power3.out" },
  splitChar: { duration: 1, ease: "expo.out", stagger: 0.01 },
  splitLine: { duration: 0.7, ease: "expo.out", stagger: 0.04 },
  micro: { duration: 0.3, ease: "power2.out" },
  morph: { duration: 0.8, ease: "expo.inOut" },
  bounce: { duration: 0.4, ease: "back.out(1.7)" },
  /** Cascada entre hermanos. `normal` es el default; `tight` para listas largas. */
  stagger: { tight: 0.05, normal: 0.08 },
};

/**
 * Registro de las flotaciones ambientales activas.
 *
 * Un tween sólo corre si se cumplen las dos condiciones a la vez: el elemento está
 * en viewport (`inView`) y su sección no está oculta (`sectionVisible`). Hacen falta
 * las dos porque `autoAlpha: 0` deja `visibility: hidden`, y IntersectionObserver no
 * detecta eso — sólo detecta `display: none`.
 */
type FloatEntry = { tween: gsap.core.Tween; inView: boolean; sectionVisible: boolean };
const floats = new Map<Element, FloatEntry>();

function syncFloat(entry: FloatEntry) {
  if (entry.inView && entry.sectionVisible) entry.tween.play();
  else entry.tween.pause();
}

/** Flotación ambiental continua. Desactivada en touch y bajo reduced-motion. */
export function floatIdle(el: Element, amplitude = 3) {
  // En mobile el efecto casi no se percibe y es donde más cuesta: son hasta 10 tweens
  // infinitos simultáneos sobre subárboles que incluyen imágenes grandes.
  if (prefersReducedMotion() || !hasFinePointer()) return;

  const tween = gsap.to(el, {
    yPercent: amplitude,
    duration: gsap.utils.random(1.8, 2.6),
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
    delay: gsap.utils.random(0, 1),
  });

  const entry: FloatEntry = { tween, inView: false, sectionVisible: true };
  floats.set(el, entry);

  const io = new IntersectionObserver(
    ([observed]) => {
      entry.inView = observed.isIntersecting;
      syncFloat(entry);
    },
    { threshold: 0.1 }
  );
  io.observe(el);

  return tween;
}

/** Pausa las flotaciones dentro de `root`. Utilitario disponible para ocultamientos manuales. */
export function pauseFloatsIn(root: Element) {
  floats.forEach((entry, el) => {
    if (root.contains(el)) {
      entry.sectionVisible = false;
      syncFloat(entry);
    }
  });
}

/** Reanuda las flotaciones dentro de `root` cuando su sección vuelve a mostrarse. */
export function resumeFloatsIn(root: Element) {
  floats.forEach((entry, el) => {
    if (root.contains(el)) {
      entry.sectionVisible = true;
      syncFloat(entry);
    }
  });
}

export { gsap, ScrollTrigger, SplitText };
