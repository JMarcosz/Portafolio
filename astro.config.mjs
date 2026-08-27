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
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // Genera los .map y los enlaza desde cada bundle, para poder debuggear el
    // TypeScript original en DevTools. La minificación la sigue aplicando Astro
    // por defecto en `build` — esto no la desactiva.
    build: { sourcemap: true },
  },
});
