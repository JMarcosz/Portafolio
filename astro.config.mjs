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
