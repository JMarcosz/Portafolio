// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Necesario para canonical, Open Graph y el sitemap: sin `site`, Astro no puede
  // generar URLs absolutas. Elegido www — el ápex debe redirigir acá desde Netlify
  // (Domain management → Primary domain), si no Google indexa los dos como sitios
  // distintos y divide el ranking.
  site: 'https://www.jeanmarte.com',
  // Español en `/`, inglés en `/en/`. El toggle del header es un enlace entre ambas.
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap({ i18n: { defaultLocale: 'es', locales: { es: 'es-DO', en: 'en-US' } } })],
  vite: {
    plugins: [tailwindcss()],
    // Genera los .map y los enlaza desde cada bundle, para poder debuggear el
    // TypeScript original en DevTools. La minificación la sigue aplicando Astro
    // por defecto en `build` — esto no la desactiva.
    build: { sourcemap: true },
  },
});
