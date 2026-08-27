// Scroll suave global. Se importa una sola vez desde Layout.astro.
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./motion";

if (!prefersReducedMotion()) {
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Reemplaza el scroll-behavior:smooth nativo (removido en global.css) para que
  // los links del nav usen el mismo scroll con inercia que el resto del sitio.
  document.addEventListener("click", (event) => {
    const link = (event.target as HTMLElement)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const target = document.querySelector(link.getAttribute("href") || "");
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target as HTMLElement, { offset: -64, duration: 1.2 });
  });
}
