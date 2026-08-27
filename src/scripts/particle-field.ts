// Campo de partículas dispersas que huyen del cursor y vuelven a su lugar al soltarlo.
// Reemplaza el anillo de Houdini: acá se necesita física por partícula (distancia al
// mouse cada frame), así que canvas es la herramienta correcta, no un paint worklet.
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
};

export function initParticleField(canvas: HTMLCanvasElement, opts: ParticleFieldOptions = {}) {
  const ctx = canvas.getContext("2d");
  const stage = canvas.parentElement as HTMLElement | null;
  if (!ctx || !stage) return;

  const { count = 220, color = "242, 241, 236", repelRadius = 170, repelStrength = 64, returnEase = 0.055 } = opts;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let particles: Particle[] = [];
  let raf: number | null = null;
  let tick = 0;
  const pointer = { x: -9999, y: -9999, active: false };

  const resize = () => {
    w = stage.clientWidth;
    h = stage.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const seed = () => {
    particles = Array.from({ length: count }, () => {
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
  window.addEventListener("resize", () => {
    resize();
    seed();
  });

  if (prefersReducedMotion()) {
    drawStatic();
    return;
  }

  const step = () => {
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

  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });
  stage.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  let isIntersecting = false;

  const io = new IntersectionObserver(
    ([entry]) => {
      isIntersecting = entry.isIntersecting;
      if (isIntersecting && !document.hidden && raf === null) raf = requestAnimationFrame(step);
      if (!isIntersecting && raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    },
    { threshold: 0.05 }
  );
  io.observe(stage);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
    } else if (!document.hidden && isIntersecting && raf === null) {
      raf = requestAnimationFrame(step);
    }
  });
}
