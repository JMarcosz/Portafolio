// Schema.org compartido por las páginas de caso de estudio.
//
// Vive acá y no duplicado en `/proyectos/[slug].astro` y `/en/projects/[slug].astro`
// porque las dos rutas describen el MISMO recurso en distinto idioma: si el
// schema se escribe dos veces, se desincroniza en el primer cambio.
import type { Locale, Project } from "../i18n";

const SITE = "https://www.jeanmarte.com";

/** Autor/editor: el mismo `Person` que declara el Layout, por referencia de URL. */
const AUTHOR = {
  "@type": "Person",
  name: "Jean Marte (Jean Marco Marte)",
  url: `${SITE}/`,
};

/**
 * `Article` del caso de estudio. Antes estas páginas sólo llevaban `Person` +
 * `BreadcrumbList`: Google no tenía forma de saber que el cuerpo era un artículo
 * con autor y fecha, así que no eran elegibles para resultados de artículo.
 *
 * `datePublished` sale de `publishedAt`, que es la fecha real en que el caso se
 * publicó (historial de git). Si un proyecto no la tiene, el campo se omite en
 * vez de inventarse: un `datePublished` falso es peor que ninguno.
 */
export function caseStudySchema(project: Project, locale: Locale) {
  const cs = project.caseStudy;
  const url = `${SITE}${project.href}`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${cs.name} — ${cs.tagline}`,
    description: project.valueLine,
    image: [`${SITE}${project.thumb}`],
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: AUTHOR,
    publisher: AUTHOR,
    inLanguage: locale === "en" ? "en-US" : "es-DO",
    ...(project.publishedAt ? { datePublished: project.publishedAt } : {}),
    // `about` conecta el artículo con la cosa de la que habla. Sin esto el caso
    // es texto suelto; con esto, Google puede relacionarlo con el sistema real
    // que está en producción y enlazado en la demo.
    about: {
      "@type": "SoftwareApplication",
      name: cs.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: project.demo,
      ...(project.tags.length ? { keywords: project.tags.join(", ") } : {}),
    },
    keywords: project.tags.join(", "),
  };
}
