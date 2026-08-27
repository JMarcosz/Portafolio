// Entradas y salidas de sección animadas, con dirección aleatoria (izquierda, derecha,
// arriba o abajo) cada vez — en mobile y desktop por igual. Se ejecuta una sola vez
// desde Layout.astro y wirea cada <section data-slide-section>.
//
// Es una capa por-sección independiente de las coreografías internas que ya tiene
// cada componente (split-text, stagger de cards, etc.): acá se anima la SECCIÓN
// completa como bloque; las animaciones internas siguen operando sobre sus propios
// elementos hijos y no chocan con esto (un transform en el padre no afecta el cálculo
// de posición/scroll de ScrollTrigger en los hijos, solo el render visual).
import { gsap, ScrollTrigger, prefersReducedMotion } from "./motion";

const OFFSETS: Record<string, { x: number; y: number }> = {
  left: { x: -90, y: 0 },
  right: { x: 90, y: 0 },
  top: { x: 0, y: -70 },
  bottom: { x: 0, y: 70 },
};
const DIRS = Object.keys(OFFSETS);
const randomOffset = () => OFFSETS[DIRS[Math.floor(Math.random() * DIRS.length)]];

export function initSectionTransitions() {
  if (prefersReducedMotion()) return;

  document.querySelectorAll<HTMLElement>("[data-slide-section]").forEach((section) => {
    const playIn = () => {
      const { x, y } = randomOffset();
      gsap.fromTo(
        section,
        { x, y, autoAlpha: 0 },
        { x: 0, y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", overwrite: true }
      );
    };

    const playOut = () => {
      const { x, y } = randomOffset();
      gsap.to(section, { x, y, autoAlpha: 0, duration: 0.55, ease: "power2.in", overwrite: true });
    };

    ScrollTrigger.create({
      trigger: section,
      start: "top 88%",
      end: "bottom 10%",
      onEnter: playIn,
      onEnterBack: playIn,
      onLeave: playOut,
      onLeaveBack: playOut,
    });
  });
}
