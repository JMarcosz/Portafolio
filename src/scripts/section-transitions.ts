// Entradas y salidas de sección animadas, con dirección aleatoria (izquierda, derecha,
// arriba o abajo) cada vez — en mobile y desktop por igual. Se ejecuta una sola vez
// desde Layout.astro y wirea cada <section data-slide-section>.
//
// Además coordina el orden: cada sección avisa con `section:revealed` cuando terminó
// de entrar, y recién ahí los componentes lanzan su coreografía interna. Sin esto el
// padre y los hijos se animaban solapados (el padre arrancaba en `top 88%` y los hijos
// en `top 78%`), componiendo transformaciones anidadas sobre el mismo subárbol — la
// causa del tirón en Proyectos, que además contiene las dos imágenes más pesadas.
import { gsap, ScrollTrigger, prefersReducedMotion, pauseFloatsIn, resumeFloatsIn } from "./motion";

const OFFSETS: Record<string, { x: number; y: number }> = {
  left: { x: -90, y: 0 },
  right: { x: 90, y: 0 },
  top: { x: 0, y: -70 },
  bottom: { x: 0, y: 70 },
};
const DIRS = Object.keys(OFFSETS);
const randomOffset = () => OFFSETS[DIRS[Math.floor(Math.random() * DIRS.length)]];

const REVEALED_ATTR = "data-section-revealed";

function markRevealed(section: HTMLElement) {
  if (section.hasAttribute(REVEALED_ATTR)) return;
  section.setAttribute(REVEALED_ATTR, "");
  section.dispatchEvent(new CustomEvent("section:revealed"));
}

/**
 * Ejecuta `cb` cuando la sección terminó su animación de entrada.
 * Incluye red de seguridad: si el evento nunca llega (reduced-motion, sección sin
 * `data-slide-section`, o init que no corrió), igual dispara cuando la sección está
 * claramente en pantalla — así el contenido nunca puede quedarse invisible.
 */
export function onSectionRevealed(section: HTMLElement | null, cb: () => void) {
  if (!section) return;

  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cb();
  };

  if (section.hasAttribute(REVEALED_ATTR)) {
    run();
    return;
  }

  section.addEventListener("section:revealed", run, { once: true });

  // Red de seguridad. `onEnter` sólo dispara al *cruzar* el punto de inicio, así que
  // no alcanza por sí solo: si la página carga ya scrolleada dentro de la sección
  // (F5 a mitad de página, o entrar directo a /#proyectos), el trigger nace activo
  // pero nunca "entra", y el contenido quedaría invisible para siempre. Por eso se
  // comprueba además el estado activo al crearlo y en cada refresh.
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: "top 55%",
    once: true,
    onEnter: run,
    onRefresh: (self) => {
      if (self.isActive) run();
    },
  });

  if (trigger.isActive) run();
}

export function initSectionTransitions() {
  const sections = document.querySelectorAll<HTMLElement>("[data-slide-section]");

  if (prefersReducedMotion()) {
    sections.forEach(markRevealed);
    return;
  }

  sections.forEach((section) => {
    const playIn = () => {
      const { x, y } = randomOffset();
      gsap.fromTo(
        section,
        { x, y, autoAlpha: 0 },
        {
          x: 0,
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          ease: "power3.out",
          overwrite: true,
          // Promoción a capa propia solo mientras dura el movimiento: dejar
          // will-change fijo consume memoria de GPU sin beneficio.
          onStart: () => {
            section.style.willChange = "transform, opacity";
            resumeFloatsIn(section);
          },
          onComplete: () => {
            section.style.willChange = "";
            markRevealed(section);
          },
        }
      );
    };

    const playOut = () => {
      const { x, y } = randomOffset();
      gsap.to(section, {
        x,
        y,
        autoAlpha: 0,
        duration: 0.55,
        ease: "power2.in",
        overwrite: true,
        onStart: () => {
          section.style.willChange = "transform, opacity";
        },
        onComplete: () => {
          section.style.willChange = "";
          // autoAlpha deja visibility:hidden, que IntersectionObserver NO detecta
          // (solo detecta display:none) — sin esto los tweens de flotación seguirían
          // corriendo indefinidamente sobre secciones invisibles.
          pauseFloatsIn(section);
        },
      });
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
