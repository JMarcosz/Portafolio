// Campo de partículas dispersas que huyen del cursor y vuelven a su lugar al soltarlo.
// Se usa como fondo global fijo (una sola capa a tamaño de viewport, detrás de
// todo el contenido), continua al scrollear por todas las secciones.
import { prefersReducedMotion } from "./motion";

type Particle = {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  size: number;
  alpha: number;
  phase: number;
};

type ParticleFieldOptions = {
  count?: number;
  color?: string; // "r, g, b"
  repelRadius?: number;
  repelStrength?: number;
  returnEase?: number;
  /** Si devuelve false, el frame no se dibuja (para una capa que solo importa
   *  en cierta zona de scroll, p. ej. la capa densa del Hero). */
  visible?: () => boolean;
};

export function initParticleField(canvas: HTMLCanvasElement, opts: ParticleFieldOptions = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const {
    count = 220,
    color = "242, 241, 236",
    repelRadius = 170,
    repelStrength = 64,
    returnEase = 0.055,
    visible,
  } = opts;

  // En pantallas chicas se bajan densidad y resolución: es donde menos se aprecia
  // el detalle y donde más cuesta pintar cada frame.
  const isSmall = window.matchMedia("(max-width: 768px)").matches;
  const particleCount = isSmall ? Math.round(count * 0.55) : count;
  const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2);
  let w = 0;
  let h = 0;
  let particles: Particle[] = [];
  let raf: number | null = null;
  let tick = 0;
  const pointer = { x: -9999, y: -9999, active: false };

  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const seed = () => {
    particles = Array.from({ length: particleCount }, () => {
      const x = Math.random() * w;
      const y = Math.random() * h;
      return {
        baseX: x,
        baseY: y,
        x,
        y,
        size: 1 + Math.random() * 2.2,
        alpha: 0.15 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
      };
    });
  };

  const drawStatic = () => {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${p.alpha.toFixed(3)})`;
      ctx.fill();
    });
  };

  resize();
  seed();

  // En mobile el navegador dispara `resize` cada vez que la barra de direcciones
  // se oculta o aparece al scrollear. Reposicionar las partículas ahí producía un
  // salto a mitad del scroll, así que se ignoran los resize donde sólo cambió el alto.
  let lastWidth = window.innerWidth;
  let resizeTimer: number | undefined;

  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resize();
      seed();
    }, 150);
  });

  // El canvas es fixed en (0,0) y cubre el viewport: clientX/clientY ya están en
  // sus coordenadas, sin necesidad de getBoundingClientRect.
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    },
    { passive: true }
  );
  window.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) pointer.active = false;
  });

  if (prefersReducedMotion()) {
    drawStatic();
    return;
  }

  let wasHidden = false;
  const step = () => {
    if (visible && !visible()) {
      if (!wasHidden) {
        ctx.clearRect(0, 0, w, h);
        wasHidden = true;
      }
      raf = requestAnimationFrame(step);
      return;
    }
    wasHidden = false;
    tick++;
    ctx.clearRect(0, 0, w, h);

    particles.forEach((p) => {
      // deriva ambiental: cada partícula vaga suavemente alrededor de su origen
      let targetX = p.baseX + Math.sin(tick * 0.007 + p.phase) * 24;
      let targetY = p.baseY + Math.cos(tick * 0.006 + p.phase) * 24;

      if (pointer.active) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < repelRadius) {
          const force = (1 - dist / repelRadius) * repelStrength;
          targetX = p.x + (dx / dist) * force;
          targetY = p.y + (dy / dist) * force;
        }
      }

      p.x += (targetX - p.x) * returnEase;
      p.y += (targetY - p.y) * returnEase;

      const twinkle = p.alpha * (0.6 + 0.4 * Math.sin(tick * 0.03 + p.phase));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${twinkle.toFixed(3)})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
    } else if (!document.hidden && raf === null) {
      raf = requestAnimationFrame(step);
    }
  });
}
