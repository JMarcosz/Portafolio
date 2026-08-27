// Setup compartido de animación. Se importa desde el <script> de cada componente;
// Vite comparte la misma instancia de módulo entre todos ellos, así que
// gsap.registerPlugin() solo corre una vez sin importar cuántos componentes lo importen.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Token de easing/duración reutilizado por todas las secciones (ver plan de movimiento). */
export const TOKENS = {
  revealSm: { duration: 0.6, ease: "power3.out" },
  revealMd: { duration: 0.8, ease: "power3.out" },
  splitChar: { duration: 1, ease: "expo.out", stagger: 0.01 },
  splitLine: { duration: 0.85, ease: "expo.out", stagger: 0.04 },
  micro: { duration: 0.3, ease: "power2.out" },
  morph: { duration: 0.8, ease: "expo.inOut" },
  bounce: { duration: 0.4, ease: "back.out(1.7)" },
};

/**
 * Dispara `onEnter` la primera vez que `el` cruza el 80% inferior del viewport.
 * Envoltorio delgado sobre ScrollTrigger para no repetir la misma config en cada componente.
 */
export function onScrollIn(
  el: Element,
  onEnter: () => void,
  opts: { start?: string; once?: boolean } = {}
) {
  ScrollTrigger.create({
    trigger: el,
    start: opts.start ?? "top 82%",
    once: opts.once ?? true,
    onEnter,
  });
}

/** Flotación ambiental continua: se pausa fuera de viewport y respeta reduced-motion. */
export function floatIdle(el: Element, amplitude = 3) {
  if (prefersReducedMotion()) return;

  const tween = gsap.to(el, {
    yPercent: amplitude,
    duration: gsap.utils.random(1.8, 2.6),
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
    delay: gsap.utils.random(0, 1),
  });

  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) tween.play();
      else tween.pause();
    },
    { threshold: 0.1 }
  );
  io.observe(el);

  return tween;
}

export { gsap, ScrollTrigger, SplitText, Flip };
