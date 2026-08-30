// Scroll suave global (única instancia de Lenis del sitio). Se importa una sola
// vez desde Layout.astro.
//
// Lenis sólo se activa en dispositivos con puntero fino (ratón / trackpad).
// En touch (móvil, tablet) el navegador ya tiene su propia inercia nativa que
// se siente fluida y 1:1 con el dedo. Activar Lenis encima añadía una segunda
// capa de momentum que, sobre el sticky-stage, producía el efecto de que la
// sección se "congelaba" unos instantes al levantar el dedo.
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion, hasFinePointer } from "./motion";

let lenis: Lenis | null = null;

if (!prefersReducedMotion() && hasFinePointer()) {
  if (typeof window !== "undefined" && "scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Reemplaza el scroll-behavior:smooth nativo (removido en global.css) para que
  // los enlaces del nav usen el mismo scroll con inercia que el resto del sitio.
  document.addEventListener("click", (event) => {
    const link = (event.target as HTMLElement)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute("href") || "");
    if (!target) return;
    event.preventDefault();
    lenis?.scrollTo(target as HTMLElement, { offset: -72, duration: 1.2 });
  });
}

export { lenis };
