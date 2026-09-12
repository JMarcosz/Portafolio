import { next, rewrite } from "@vercel/edge";

// Vercel Edge Middleware (independiente de Astro: el sitio se compila 100%
// estatico, sin adapter/SSR, asi que esta es la unica capa donde se puede
// inspeccionar el header `Accept` por request). Corre en el edge de Vercel
// antes de servir los archivos estaticos de `dist/`.
//
// El gemelo .md de cada pagina lo genera el build (ver el hook
// `markdown-mirror` en astro.config.mjs): un `/ruta/index.html` siempre tiene
// un `/ruta/index.md` al lado.
export const config = {
  // Solo se excluyen los bundles con hash de Astro por volumen de requests;
  // el resto de archivos estaticos (robots.txt, *.webp, *.md, etc.) se
  // descartan abajo comprobando si el ultimo segmento tiene extension —
  // un patron de matcher a base de regex es mas fragil para eso.
  matcher: "/((?!_astro/).*)",
};

function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;

  const entries = acceptHeader.split(",").map((part) => {
    const [rawType, ...params] = part.trim().split(";");
    const type = rawType.trim().toLowerCase();
    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    const q = qParam ? parseFloat(qParam.slice(2)) : 1;
    return { type, q: Number.isNaN(q) ? 1 : q };
  });

  const markdown = entries.find((e) => e.type === "text/markdown");
  if (!markdown) return false;

  // Un navegador manda `text/html` (con o sin `*/*` de respaldo) y NUNCA
  // `text/markdown`, así que en la práctica basta con que el Accept lo
  // mencione. Igual se compara el peso por si algún cliente manda ambos.
  const html = entries.find((e) => e.type === "text/html" || e.type === "application/xhtml+xml");
  if (!html) return true;

  return markdown.q >= html.q;
}

export default function middleware(request: Request) {
  const url = new URL(request.url);

  // El ultimo segmento tiene extension (robots.txt, sitemap.xml, foo.webp,
  // foo.md pedido directo, etc.): ya es un archivo estatico servido tal
  // cual, no una pagina con gemelo .md que negociar.
  const lastSegment = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
  if (lastSegment.includes(".")) return next();

  if (!prefersMarkdown(request.headers.get("accept"))) return next();

  const withoutTrailingSlash = url.pathname.replace(/\/+$/, "");
  url.pathname = `${withoutTrailingSlash}/index.md`;

  return rewrite(url, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
