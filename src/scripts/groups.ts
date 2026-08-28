// Director de escena del túnel de zoom entre grupos de secciones.
//
// - Entre grupos: transición de ZOOM. El saliente se aleja hacia la cámara y se
//   desvanece; el entrante llega desde el fondo. El crossfade es SECUENCIADO: el
//   saliente termina de irse antes de que el entrante empiece a aparecer, para
//   que nunca haya dos secciones pintadas a la vez.
// - Dentro de un grupo alto: scroll normal. .group-inner sube y cada sección
//   dispara su entrada al cruzar la línea de lectura, una sola vez.
// - Grupos cortos (Hero, Contacto): sólo se enfocan.
//
// Las secciones NO atan sus timelines al scroll: registran su coreografía en
// stage.ts y el director decide cuándo corre. La regla dura es que una sección
// sólo anima mientras su grupo manda en pantalla.
import { gsap, ScrollTrigger, prefersReducedMotion } from "./motion";
import { liveSection, revealSection } from "./stage";
import { lenis } from "./smooth-scroll";

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const clamp = (n: number, lo: number, hi: number) => (n < lo ? lo : n > hi ? hi : n);
const smooth = (k: number) => k * k * (3 - 2 * k);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Altura del viewport a la que una sección dispara su entrada. */
const REVEAL_LINE = 0.85;

/**
 * Punto del zoom a partir del cual el grupo entrante ya manda en pantalla.
 *
 * No es 1: si la entrada de la primera sección esperara al final del zoom se
 * vería llegar un panel vacío y recién ahí aparecer el contenido. A 0.75 el
 * grupo está al 92% de escala y el saliente hace rato que está en alpha 0
 * (termina en 0.45), así que la entrada se solapa con la cola del zoom sin
 * romper la secuencia.
 */
const PRESENT_AT = 0.75;

type Phase = "hidden" | "entering" | "presented" | "leaving";

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

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

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

  const phases: Phase[] = models.map(() => "hidden");
  let presented = -1;

  const setPhase = (idx: number, phase: Phase) => {
    if (phases[idx] === phase) return;
    phases[idx] = phase;
    if (phase === "presented") presented = idx;
    else if (presented === idx) presented = -1;
    document.dispatchEvent(new CustomEvent("stage:phase", { detail: { group: models[idx].navId, phase } }));
  };

  let totalPx = 0;
  let stageH = 0;

  const measure = () => {
    stageH = stage.getBoundingClientRect().height;
    const topPx = groupTopPx();
    // Ventana del zoom. Antes era 1.7x la altura del stage y se llevaba el 47%
    // de TODO el scroll de la página: cambiar de sección costaba cinco gestos de
    // rueda. El techo en px importa tanto como el factor — sin él, en una
    // pantalla de 1440px de alto el zoom volvería a costar casi 800px.
    const HANDOFF = Math.min(stageH * 0.55, 520);

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

  /**
   * Arma las secciones del grupo que manda en pantalla.
   *
   * `exact` dice si la geometría es de fiar. Durante la cola del zoom el grupo
   * todavía está a ~0.92 de escala: alcanza para decidir un disparo con umbral,
   * no para el trazo continuo, que necesita el rect real.
   */
  const armGroupSections = (m: GroupModel, exact: boolean) => {
    const vh = window.innerHeight;
    m.sections.forEach((s) => {
      const rect = s.el.getBoundingClientRect();
      if (rect.top <= REVEAL_LINE * vh) revealSection(s.id);
      if (exact) liveSection(s.id, rect, vh);
    });
  };

  const showFocused = (i: number) => {
    gsap.set(models[i].el, { autoAlpha: 1, scale: 1, yPercent: 0, zIndex: 30, pointerEvents: "auto" });
  };

  /** Dibuja el zoom y devuelve la opacidad del grupo saliente. */
  const handoff = (out: number, inc: number, tB: number) => {
    const mobile = isMobile();
    const e = smooth(tB);

    // Crossfade secuenciado. Antes el saliente se iba entre 0.12 y 0.62 y el
    // entrante llegaba entre 0.40 y 0.90: durante casi un cuarto de la
    // transición había dos grupos pintados uno encima del otro. Ahora el
    // saliente termina en 0.45 y el entrante arranca en 0.40 — 0.05 de
    // solapamiento, sólo para que no quede un frame en negro.
    const outAlpha = 1 - clamp01(tB / 0.45);
    const inAlpha = clamp01((tB - 0.4) / 0.6);

    gsap.set(models[out].el, {
      autoAlpha: outAlpha,
      scale: mobile ? 1 - 0.08 * e : 1 + 1.6 * e,
      yPercent: mobile ? -30 * e : 0,
      zIndex: 24,
      // Mientras se siga viendo, se sigue pudiendo tocar. Matar el hit-testing en
      // tB=0 dejaba la última sección del grupo (Habilidades) a la vista, intacta
      // y muerta al click durante todo el arranque del zoom.
      pointerEvents: outAlpha > 0.5 ? "auto" : "none",
    });
    gsap.set(models[out].inner, { y: models[out].endY });

    gsap.set(models[inc].el, {
      autoAlpha: inAlpha,
      scale: mobile ? 0.94 + 0.06 * e : 0.35 + 0.65 * e,
      yPercent: mobile ? 40 * (1 - e) : 0,
      zIndex: 30,
      pointerEvents: inAlpha > 0.5 ? "auto" : "none",
    });
    gsap.set(models[inc].inner, { y: 0 });

    return outAlpha;
  };

  const render = (progress: number) => {
    const scrolled = progress * totalPx;

    let i = 0;
    while (i < N - 1 && scrolled >= models[i + 1].anchorPx) i++;

    for (let k = 0; k < N; k++) {
      if (k !== i && k !== i + 1) {
        gsap.set(models[k].el, { autoAlpha: 0, pointerEvents: "none" });
        setPhase(k, "hidden");
      }
    }

    if (i === N - 1) {
      showFocused(i);
      gsap.set(models[i].inner, { y: models[i].endY });
      setPhase(i, "presented");
      armGroupSections(models[i], true);
      setActive(currentSectionOf(models[i]));
    } else {
      const segLen = models[i].windowPx || 1;
      const local = clamp01((scrolled - models[i].anchorPx) / segLen);
      const phaseA = models[i].travelPx / segLen;

      if (models[i].tall && local < phaseA) {
        const tA = phaseA <= 0 ? 1 : local / phaseA;
        showFocused(i);
        gsap.set(models[i].inner, { y: lerp(0, models[i].endY, tA) });
        gsap.set(models[i + 1].el, { autoAlpha: 0, pointerEvents: "none" });
        setPhase(i + 1, "hidden");
        setPhase(i, "presented");
        armGroupSections(models[i], true);
        setActive(currentSectionOf(models[i]));
      } else {
        const tB = models[i].tall ? (local - phaseA) / (1 - phaseA) : local;
        const outAlpha = handoff(i, i + 1, tB);

        if (tB >= PRESENT_AT) {
          setPhase(i, "hidden");
          setPhase(i + 1, "presented");
          armGroupSections(models[i + 1], false);
        } else if (outAlpha > 0.5) {
          // El saliente todavía manda en pantalla — es el mismo umbral con el que
          // conserva el hit-testing, así que "presentado" y "clickeable" son la
          // misma cosa. Hace falta para los grupos CORTOS: el Hero no tiene fase
          // A, toda su ventana es zoom, así que sin esta rama nunca llegaría a
          // estar presentado y el salto de Tab entre grupos no arrancaría.
          setPhase(i + 1, "entering");
          setPhase(i, "presented");
          armGroupSections(models[i], false);
        } else {
          setPhase(i, "leaving");
          setPhase(i + 1, "entering");
        }

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

  // --------------------------------------------------------------- navegación

  /** Desplazamiento de `el` dentro de su .scroll-group, en coordenadas de layout. */
  const offsetInGroup = (el: HTMLElement, group: HTMLElement) => {
    let y = 0;
    let node: HTMLElement | null = el;
    while (node && node !== group) {
      y += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return y;
  };

  /** Posición del túnel que deja `offset` (dentro del grupo `gi`) cerca del tope. */
  const scrollForOffset = (gi: number, offset: number | null) => {
    const m = models[gi];
    const base = st.start + m.anchorPx;
    if (offset == null || !m.tall || m.endY === 0) return base;
    const targetY = clamp(0.15 * window.innerHeight - offset, m.endY, 0);
    return base + (targetY / m.endY) * m.travelPx;
  };

  const scrollForId = (id: string): number | null => {
    const gi = groupOfId.get(id);
    if (gi == null) return null;
    const sec = models[gi].sections.find((s) => s.id === id);
    return scrollForOffset(gi, sec ? sec.el.offsetTop : null);
  };

  const scrollForElement = (el: HTMLElement): number | null => {
    const group = el.closest<HTMLElement>(".scroll-group");
    if (!group) return null;
    const gi = models.findIndex((m) => m.el === group);
    if (gi < 0) return null;
    return scrollForOffset(gi, offsetInGroup(el, group));
  };

  const goTo = (target: number, opts: { duration?: number; onComplete?: () => void } = {}) => {
    if (lenis) {
      lenis.scrollTo(target, { duration: opts.duration ?? 1.2, onComplete: opts.onComplete });
    } else {
      window.scrollTo({ top: target, behavior: "smooth" });
      if (opts.onComplete) window.setTimeout(opts.onComplete, 400);
    }
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
      goTo(target);
    },
    true
  );

  // ------------------------------------------------------------------ teclado

  /**
   * Puente de foco.
   *
   * El stage es overflow:hidden y el scroll es virtual, así que cuando el
   * navegador quiere traer a la vista un elemento enfocado no encuentra ningún
   * contenedor que mover: tabular a un control fuera de pantalla no hacía nada.
   * Acá se traduce la posición del elemento a su posición equivalente del túnel.
   */
  let pointerFocus = false;
  // El puente se calla mientras nosotros mismos movemos el foco: si no, un salto
  // de grupo encadenaba dos scrolls, el del salto y el del foco que acaba de
  // aterrizar.
  let suppressBridge = false;

  document.addEventListener("pointerdown", () => (pointerFocus = true), true);
  document.addEventListener("keydown", () => (pointerFocus = false), true);

  document.addEventListener("focusin", (event) => {
    if (pointerFocus || suppressBridge) return;
    const el = event.target as HTMLElement | null;
    // El header es fixed: siempre visible, nunca hay que ir a buscarlo.
    if (!el || el.closest("header")) return;
    const target = scrollForElement(el);
    if (target == null || Math.abs(target - window.scrollY) < 8) return;
    goTo(target, { duration: 0.45 });
  });

  const focusablesIn = (root: HTMLElement) =>
    gsap.utils
      .toArray<HTMLElement>(root.querySelectorAll(FOCUSABLE))
      .filter((el) => el.checkVisibility?.({ visibilityProperty: true }) ?? true);

  const focusGroupEdge = (gi: number, edge: "start" | "end") => {
    const m = models[gi];
    let target: HTMLElement | null = null;

    if (edge === "start") {
      // El ENCABEZADO, no el primer control: al entrar a un grupo su contenido
      // recién se está revelando y buena parte sigue en visibility:hidden, así
      // que "el primer enfocable" sería el único que quedó fuera de la
      // coreografía — no el que le toca. El encabezado además ya está donde
      // acabamos de scrollear, así que el foco no vuelve a mover la página.
      target = m.el.querySelector<HTMLElement>("h1, h2");
      if (target) target.tabIndex = -1;
    }
    if (!target) {
      const list = focusablesIn(m.el);
      target = edge === "start" ? list[0] : list[list.length - 1];
    }
    if (!target) return;

    suppressBridge = true;
    target.focus({ preventScroll: true });
    requestAnimationFrame(() => (suppressBridge = false));
  };

  const goToGroup = (gi: number, edge: "start" | "end" = "start", focusAfter = false) => {
    const m = models[gi];
    const target = st.start + m.anchorPx + (edge === "end" ? m.travelPx : 0);
    goTo(target, { duration: 0.6, onComplete: focusAfter ? () => focusGroupEdge(gi, edge) : undefined });
  };

  const inTextField = (el: Element | null) => !!el?.closest("input, textarea, select, [contenteditable='true']");

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    // Tab en el borde del grupo: avanza el túnel en vez de morir ahí. Sin esto el
    // teclado sólo alcanza el grupo presentado — los demás están en
    // visibility:hidden y sus controles ni siquiera son enfocables.
    if (event.key === "Tab" && presented >= 0) {
      const list = focusablesIn(models[presented].el);
      if (!list.length) return;
      const edge = event.shiftKey ? list[0] : list[list.length - 1];
      if (document.activeElement !== edge) return;
      const next = event.shiftKey ? presented - 1 : presented + 1;
      if (next < 0 || next >= N) return;
      event.preventDefault();
      goToGroup(next, event.shiftKey ? "end" : "start", true);
      return;
    }

    if (inTextField(document.activeElement)) return;

    const from = presented >= 0 ? presented : 0;
    let next: number | null = null;
    if (event.key === "PageDown") next = Math.min(N - 1, from + 1);
    else if (event.key === "PageUp") next = Math.max(0, from - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = N - 1;
    if (next == null) return;

    event.preventDefault();
    goToGroup(next);
  });

  // -------------------------------------------------------------- re-medición

  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  let resizeTimer: number | undefined;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
  });
  // Se vigilan los .group-inner, no el stage: el stage mide 100dvh y no cambia
  // nunca, así que abrir un acordeón de Habilidades crecía el contenido sin que
  // nadie re-midiera y el alto extra quedaba fuera del recorrido, recortado por
  // el overflow:hidden.
  models.forEach((m) => ro.observe(m.inner));
  ro.observe(stage);

  ScrollTrigger.refresh();
}
