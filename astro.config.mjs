// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    // Genera los .map y los enlaza desde cada bundle, para poder debuggear el
    // TypeScript original en DevTools. La minificación la sigue aplicando Astro
    // por defecto en `build` — esto no la desactiva.
    build: { sourcemap: true },
  },
});
