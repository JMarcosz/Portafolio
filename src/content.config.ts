// Content Collections para /guias/.
//
// Las guías no caben en los JSON de i18n: son prosa larga con encabezados,
// listas y enlaces, y editarlas dentro de una cadena JSON es insufrible.
// Markdown es el formato correcto, y `glob` es el loader de Astro 5.
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const guias = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guias" }),
  schema: z.object({
    title: z.string(),
    /** El <title> de la pestaña, si conviene que difiera del H1. */
    metaTitle: z.string().optional(),
    description: z.string(),
    /**
     * Respuesta directa de 40-60 palabras. Va bajo el H1 y es lo que Google
     * extrae como fragmento destacado — el formato importa más que la longitud.
     */
    answer: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    /** Página de servicio a la que apunta esta guía. */
    service: z.string().optional(),
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .default([]),
  }),
});

export const collections = { guias };
