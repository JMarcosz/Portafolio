// Controlador del túnel de zoom entre 4 grupos de secciones.
//
// - Entre grupos: transición de ZOOM. El saliente se aleja hacia la cámara
//   (scale 1 -> 2.6) y se desvanece; el entrante llega desde el fondo
//   (scale 0.35 -> 1) y aparece.
// - Dentro de un grupo alto: scroll normal. .group-inner sube (anclado arriba,
//   sin hueco) y cada sección dibuja su coreografía según su posición REAL en
//   el viewport. No retrocede: una vez revelada, se queda.
// - Grupos cortos (Hero, Contacto): solo se enfocan.
import { gsap, ScrollTrigger, prefersReducedMotion } from "./motion";
import { getPanelScrub } from "./panel-scrub";
import { lenis } from "./smooth-scroll";

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n);
const smooth = (k: number) => k * k * (3 - 2 * k);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type SectionRef = { id: string; el: HTMLElement };
type GroupModel = {
  el: HTMLElement;
  inner: HTMLElement;
  navId: string;
  sections: SectionRef[];
  tall: boolean;
  endY: number; // translateY del .group-inner al final del sub-scroll (<= 0)
  travelPx: number; // -endY
  windowPx: number; // scroll asignado tras el ancla
  anchorPx: number; // A_i acumulado
};

export function initGroups() {
  const track = document.querySelector<HTMLElement>(".scroll-track");
  const stage = document.querySelector<HTMLElement>(".sticky-stage");
  const bar = document.querySelector<HTMLElement>(".z-progress");
  const groupEls = gsap.utils.toArray<HTMLElement>(".scroll-group");
  if (!track || !stage || groupEls.length < 2) return;

  const N = groupEls.length;

  if (prefersReducedMotion()) {
    groupEls.forEach((g) => g.removeAttribute("data-group-initial"));
    return;
  }

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
  const groupTopPx = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--group-top")) * 16 || 88;

  const models: GroupModel[] = groupEls.map((el) => ({
    el,
    inner: el.querySelector<HTMLElement>(".group-inner")!,
    navId: el.dataset.nav || el.id,
    sections: gsap.utils.toArray<HTMLElement>(el.querySelectorAll("section[id]")).map((s) => ({ id: s.id, el: s })),
    tall: false,
    endY: 0,
    travelPx: 0,
    windowPx: 0,
    anchorPx: 0,
  }));

  // id de sección/grupo -> índice de grupo (para navegación por anclas).
  const groupOfId = new Map<string, number>();
  models.forEach((m, i) => {
    groupOfId.set(m.navId, i);
    m.sections.forEach((s) => groupOfId.set(s.id, i));
  });

  // Progreso máximo alcanzado por cada sección (revelado sin retroceso).
  const sectionMaxT = new Map<string, number>();
  const armSection = (id: string, t: number) => {
    const prev = sectionMaxT.get(id) ?? 0;
    const next = t > prev ? t : prev;
    if (next !== prev) sectionMaxT.set(id, next);
    getPanelScrub(id)?.(t, next); // t en vivo (retrocede) + máximo (no retrocede)
  };

  let totalPx = 0;
  let stageH = 0;

  const measure = () => {
    stageH = stage.getBoundingClientRect().height;
    const topPx = groupTopPx();
    // Ventana de la transición de zoom: también es el recorrido en el que se
    // revela la PRIMERA sección del grupo entrante (contadores, líneas), así que
    // conviene amplia para que dé tiempo a leerla.
    const HANDOFF = stageH * 1.7;

    let acc = 0;
    models.forEach((m, i) => {
      m.anchorPx = acc;
      gsap.set(m.inner, { clearProps: "transform,y" });
      const contentH = m.inner.scrollHeight;

      m.tall = contentH > stageH - topPx + 4;
      const availH = m.tall ? stageH - topPx : stageH;
      m.travelPx = m.tall ? Math.max(0, contentH - availH) : 0;
      m.endY = -m.travelPx;
      m.el.toggleAttribute("data-group-tall", m.tall);

      m.windowPx = i === N - 1 ? 0 : m.travelPx + HANDOFF;
      acc += m.windowPx;
    });

    totalPx = acc;
    track.style.height = `${Math.round(totalPx + stageH)}px`;
  };

  groupEls.forEach((el, i) => {
    gsap.set(el, {
      autoAlpha: i === 0 ? 1 : 0,
      scale: i === 0 ? 1 : 0.35,
      zIndex: i === 0 ? 30 : 10,
      pointerEvents: i === 0 ? "auto" : "none",
    });
    el.removeAttribute("data-group-initial");
  });

  let activeId = "";
  const setActive = (id: string) => {
    if (!id || id === activeId) return;
    activeId = id;
    document.dispatchEvent(new CustomEvent("nav:active", { detail: { id } }));
  };

  // La sección "actual" de un grupo: la última cuyo borde superior ya cruzó el
  // 35% del viewport (default: la primera).
  const currentSectionOf = (m: GroupModel): string => {
    const line = window.innerHeight * 0.35;
    let cur = m.sections[0]?.id ?? m.navId;
    for (const s of m.sections) {
      if (s.el.getBoundingClientRect().top <= line) cur = s.id;
    }
    return cur;
  };

  // Revela cada sección según su recorrido real: t = 0 cuando su borde superior
  // toca el ~90% del viewport, t = 1 cuando la sección ya subió ~el 75% de su
  // propia altura. Así una sección alta (Experiencia) dibuja su timeline a lo
  // largo de todo su scroll y va mostrando cada tarjeta al llegar a ella; una
  // corta se revela rápido.
  const armGroupSections = (m: GroupModel) => {
    const vh = window.innerHeight;
    m.sections.forEach((s) => {
      const top = s.el.getBoundingClientRect().top;
      // Banda proporcional a la altura de la sección: una sección alta
      // (Experiencia) reparte su revelado a lo largo de casi todo su scroll.
      const band = Math.max(0.5 * vh, s.el.offsetHeight * 0.85);
      const t = clamp01((0.92 * vh - top) / band);
      armSection(s.id, t);
    });
  };

  const showFocused = (i: number) => {
    gsap.set(models[i].el, { autoAlpha: 1, scale: 1, zIndex: 30, pointerEvents: "auto" });
  };

  const handoff = (out: number, inc: number, tB: number) => {
    const mobile = isMobile();
    const e = smooth(tB);

    gsap.set(models[out].el, {
      autoAlpha: 1 - clamp01((tB - 0.12) / 0.5),
      scale: mobile ? 1 - 0.08 * e : 1 + 1.6 * e,
      yPercent: mobile ? -30 * e : 0,
      zIndex: 24,
      pointerEvents: "none",
    });
    gsap.set(models[out].inner, { y: models[out].endY });
    // Mantiene lo ya revelado del grupo saliente; no fuerza a 1.
    models[out].sections.forEach((s) => {
      const v = sectionMaxT.get(s.id) ?? 0;
      getPanelScrub(s.id)?.(v, v);
    });

    gsap.set(models[inc].el, {
      autoAlpha: clamp01((tB - 0.4) / 0.5),
      scale: mobile ? 0.94 + 0.06 * e : 0.35 + 0.65 * e,
      yPercent: mobile ? 40 * (1 - e) : 0,
      zIndex: 30,
      pointerEvents: tB > 0.65 ? "auto" : "none",
    });
    gsap.set(models[inc].inner, { y: 0 });
    // La PRIMERA sección del grupo entrante (que queda anclada arriba y nunca
    // "cruza" una banda de reveal) se dibuja a lo largo de todo el zoom, con tB.
    const firstId = models[inc].sections[0]?.id;
    if (firstId) armSection(firstId, smooth(tB));
  };

  const render = (progress: number) => {
    const scrolled = progress * totalPx;

    let i = 0;
    while (i < N - 1 && scrolled >= models[i + 1].anchorPx) i++;

    for (let k = 0; k < N; k++) {
      if (k !== i && k !== i + 1) gsap.set(models[k].el, { autoAlpha: 0, pointerEvents: "none" });
    }

    if (i === N - 1) {
      showFocused(i);
      gsap.set(models[i].inner, { y: models[i].endY });
      armGroupSections(models[i]);
      setActive(currentSectionOf(models[i]));
    } else {
      const segLen = models[i].windowPx || 1;
      const local = clamp01((scrolled - models[i].anchorPx) / segLen);
      const phaseA = models[i].travelPx / segLen;

      if (models[i].tall && local < phaseA) {
        const tA = phaseA <= 0 ? 1 : local / phaseA;
        showFocused(i);
        gsap.set(models[i].inner, { y: lerp(0, models[i].endY, tA) });
        armGroupSections(models[i]);
        gsap.set(models[i + 1].el, { autoAlpha: 0, pointerEvents: "none" });
        setActive(currentSectionOf(models[i]));
      } else {
        const tB = models[i].tall ? (local - phaseA) / (1 - phaseA) : local;
        handoff(i, i + 1, tB);
        setActive(tB < 0.5 ? currentSectionOf(models[i]) : models[i + 1].sections[0]?.id ?? models[i + 1].navId);
      }
    }

    if (bar) gsap.set(bar, { scaleX: progress });
  };

  measure();

  const st = ScrollTrigger.create({
    trigger: track,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => render(self.progress),
    onRefreshInit: () => measure(),
    onRefresh: (self) => render(self.progress),
  });

  render(0);
  document.dispatchEvent(new CustomEvent("nav:active", { detail: { id: models[0].sections[0]?.id ?? models[0].navId } }));

  // Navegación por anclas: #id de grupo o de sección.
  const scrollForId = (id: string): number | null => {
    const gi = groupOfId.get(id);
    if (gi == null) return null;
    const m = models[gi];
    const base = st.start + m.anchorPx;
    const sec = m.sections.find((s) => s.id === id);
    if (!m.tall || !sec || m.endY === 0) return base;
    const vh = window.innerHeight;
    const targetY = clamp(0.15 * vh - sec.el.offsetTop, m.endY, 0);
    const tA = targetY / m.endY;
    const local = tA * (m.travelPx / m.windowPx);
    return base + local * m.windowPx;
  };

  document.addEventListener(
    "click",
    (event) => {
      const link = (event.target as HTMLElement)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      const target = scrollForId((link.getAttribute("href") || "").slice(1));
      if (target == null) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (lenis) lenis.scrollTo(target, { duration: 1.2 });
      else window.scrollTo({ top: target, behavior: "smooth" });
    },
    true
  );

  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  let resizeTimer: number | undefined;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
  });
  ro.observe(stage);

  ScrollTrigger.refresh();
}
