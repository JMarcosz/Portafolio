// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://www.jeanmarte.com';

// Una sola marca de tiempo para todo el build: el sitemap no llevaba `lastmod`,
// que es la señal con la que Google decide cuándo vale la pena volver a rastrear.
const BUILD_DATE = new Date();

// https://astro.build/config
export default defineConfig({
  // Necesario para canonical, Open Graph y el sitemap: sin `site`, Astro no puede
  // generar URLs absolutas. Elegido www — el ápex debe redirigir acá desde Netlify
  // (ver la regla [[redirects]] en netlify.toml), si no Google indexa los dos como
  // sitios distintos y divide el ranking.
  site: SITE,
  // Español en `/`, inglés en `/en/`. El toggle del header es un enlace entre ambas.
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      // Los códigos tienen que ser los MISMOS que los <link rel="alternate"> del
      // HTML. Estaban en 'es-DO'/'en-US' acá y en 'es'/'en' en Layout.astro:
      // Search Console marca esa discrepancia como falta de "return tags" en el
      // informe de Segmentación internacional.
      i18n: { defaultLocale: 'es', locales: { es: 'es', en: 'en' } },

      serialize(item) {
        item.lastmod = BUILD_DATE;

        // Los casos de estudio no reciben alternates automáticos: el segmento de
        // ruta cambia con el idioma (`/proyectos/` vs `/en/projects/`), no sólo el
        // prefijo, así que la integración no puede emparejarlos sola. Sin esto el
        // hreflang quedaba declarado en el HTML pero sin confirmar en el sitemap.
        const match = item.url.match(/\/(?:proyectos|en\/projects)\/([^/]+)\/$/);
        if (match) {
          const slug = match[1];
          item.links = [
            { lang: 'es', url: `${SITE}/proyectos/${slug}/` },
            { lang: 'en', url: `${SITE}/en/projects/${slug}/` },
          ];
        }

        // Mismo caso para las páginas índice traducidas: el par no comparte
        // segmento, así que hay que declararlo a mano. Se añaden aquí los pares
        // nuevos a medida que existan.
        const INDEX_PAIRS = [
          { es: '/proyectos/', en: '/en/projects/' },
          { es: '/servicios/', en: '/en/services/' },
        ];
        const pair = INDEX_PAIRS.find(
          (p) => item.url === `${SITE}${p.es}` || item.url === `${SITE}${p.en}`,
        );
        if (pair) {
          item.links = [
            { lang: 'es', url: `${SITE}${pair.es}` },
            { lang: 'en', url: `${SITE}${pair.en}` },
          ];
        }

        // x-default apuntando al español. Para el par de la home lo genera la
        // propia integración, así que sólo se añade donde falta — declararlo dos
        // veces es un error de hreflang, no un refuerzo.
        if (item.links?.length && !item.links.some((l) => l.lang === 'x-default')) {
          const fallback = item.links.find((l) => l.lang === 'es');
          if (fallback) item.links.push({ lang: 'x-default', url: fallback.url });
        }

        return item;
      },
    }),
    {
      name: 'sitemap-copy',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const fs = await import('node:fs/promises');
          const path = await import('node:path');
          const { fileURLToPath } = await import('node:url');
          const distDir = fileURLToPath(dir);
          const indexPath = path.join(distDir, 'sitemap-index.xml');
          const aliasPath = path.join(distDir, 'sitemap.xml');
          try {
            await fs.copyFile(indexPath, aliasPath);
          } catch (e) {
            console.error('Error copying sitemap-index.xml to sitemap.xml:', e);
          }
        },
      },
    },
    {
      name: 'markdown-mirror',
      hooks: {
        // Genera un `index.md` junto a cada `index.html`: el contenido de
        // <main id="contenido"> (nav, footer y scripts quedan fuera porque
        // viven fuera de ese landmark) pasado por Turndown. `middleware.ts`
        // reescribe ahí las requests que mandan `Accept: text/markdown` — el
        // sitio es 100% estático (sin adapter/SSR), así que el middleware de
        // Vercel es el único lugar donde se puede negociar por ese header.
        'astro:build:done': async ({ dir }) => {
          const fs = await import('node:fs/promises');
          const path = await import('node:path');
          const { fileURLToPath } = await import('node:url');
          const { default: TurndownService } = await import('turndown');
          const distDir = fileURLToPath(dir);

          const turndown = new TurndownService({ headingStyle: 'atx', hr: '---' });

          const decodeEntities = (value) =>
            value
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#0?39;|&apos;/g, "'");

          async function walk(currentDir) {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = path.join(currentDir, entry.name);
              if (entry.isDirectory()) {
                await walk(fullPath);
                continue;
              }
              if (entry.name !== 'index.html') continue;

              const html = await fs.readFile(fullPath, 'utf-8');
              const mainMatch = html.match(/<main[^>]*id="contenido"[\s\S]*?<\/main>/i);
              if (!mainMatch) continue;

              const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
              const descMatch = html.match(/<meta name="description" content="([^"]*)"/i);

              // Turndown no filtra <script>/<style>: su texto quedaría como
              // contenido plano en el markdown si no se quita antes.
              //
              // Chips de stack/participación e items de "company/location"
              // (Experience.astro) son <span> pegados uno al otro — la
              // separación visual la da un `gap` de flexbox, no espacio real
              // en el HTML — así que Turndown los concatena sin separador
              // ("Vue 3NestJSPostgreSQL...", "...EconomíaRemoto"). Se exige
              // que el primer <span> tenga contenido (texto y/o ícono SVG
              // adentro) para no afectar los puntos decorativos vacíos de
              // las listas (<span class="...rounded-full"></span> seguido
              // del <span> con el texto real del ítem).
              const mainHtml = mainMatch[0]
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                // (lookahead sin consumir el <span> siguiente: con 3+ chips
                // seguidos, consumirlo saltaba el límite entre el 2do y 3ro)
                .replace(/(<span[^>]*>(?:(?!<\/span>)[\s\S])+<\/span>)\s*(?=<span)/gi, '$1, ')
                // Los contadores animados (About.astro) arrancan en "0" en el
                // HTML estático y suben con JS en el navegador — el número
                // real vive en data-target/data-suffix, no en el texto.
                .replace(
                  /<p[^>]*\bdata-stat-value\b[^>]*\bdata-target="([^"]*)"[^>]*\bdata-suffix(?:="([^"]*)")?[^>]*>0[^<]*<\/p>/gi,
                  (_m, target, suffix) => `<p>${target}${suffix || ''}</p>`,
                );

              const body = turndown.turndown(mainHtml).trim();
              const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : '';
              const description = descMatch ? decodeEntities(descMatch[1].trim()) : '';

              const sections = [title && `# ${title}`, description, body].filter(Boolean);

              const mdPath = fullPath.replace(/index\.html$/, 'index.md');
              await fs.writeFile(mdPath, sections.join('\n\n') + '\n', 'utf-8');
            }
          }

          await walk(distDir);
        },
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
    // `build.sourcemap` sólo afecta a `astro build`: el dev server sigue sirviendo
    // sourcemaps igual, así que apagarlo acá no cuesta nada al depurar. En
    // producción se estaban publicando ~800 KB de .map enlazados desde cada
    // bundle — no bloquean al usuario, pero exponen todo el TypeScript original y
    // engordan el deploy sin dar nada a cambio.
    build: { sourcemap: false },
  },
});
