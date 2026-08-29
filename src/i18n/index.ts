// Contenido del sitio en dos idiomas.
//
// - Los textos traducibles viven en ./es.json y ./en.json (misma forma).
// - Los datos no traducibles (fotos, archivos, correo, enlaces sociales, dominio)
//   viven acá y se fusionan con el idioma elegido.
//
// Uso en un componente .astro:
//   const t = getContent(Astro.currentLocale);
//   t.hero.title2, t.projects.items[0].demo, t.schedule, t.socials, ...
import es from "./es.json";
import en from "./en.json";

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

export function normalizeLocale(input: string | undefined | null): Locale {
  return input === "en" ? "en" : "es";
}

/** Ruta raíz de cada idioma (routing de Astro con prefixDefaultLocale: false). */
export function localeHome(locale: Locale): string {
  return locale === "en" ? "/en/" : "/";
}

/**
 * Ruta del caso de estudio de un proyecto.
 *
 * El segmento cambia con el idioma (`/proyectos/` vs `/en/projects/`) pero el
 * slug NO: es el mismo en ambos, así que el toggle ES/EN de una página de caso
 * puede llevar al mismo proyecto sin tabla de equivalencias.
 */
export function projectPath(locale: Locale, slug: string): string {
  return locale === "en" ? `/en/projects/${slug}/` : `/proyectos/${slug}/`;
}

// --- Datos no traducibles, compartidos entre idiomas -----------------------

/** Número de WhatsApp usado como agenda: el CTA principal de todo el sitio. */
const WHATSAPP_NUMBER = "18299069256";

// El mensaje precargado sí cambia con el idioma. Se manda ya listo para que el
// cliente no tenga que redactar nada — la fricción de "¿y ahora qué le escribo?"
// es justamente lo que hace que un CTA de contacto no se use.
const SCHEDULE_TEXT: Record<Locale, string> = {
  es: "Hola Jean, vi tu portafolio y me gustaría agendar una llamada para contarte sobre mi negocio.",
  en: "Hi Jean, I saw your portfolio and I'd like to book a call to tell you about my business.",
};

function scheduleUrl(locale: Locale): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(SCHEDULE_TEXT[locale])}`;
}

const shared = {
  hero: {
    photo: "/foto_personal.webp",
    cvFile: "/CV Jean Marte Full Stack Spanish Version.pdf",
  },
  /** Media y enlaces de cada proyecto, indexados por el slug del JSON. */
  projects: {
    zentra: {
      link: "https://github.com/JMarcosz/FacturasRD",
      demo: "https://zentra.jeanmarte.com",
      image: "/zentrav2.webp",
    },
    "santoral-logistic": {
      link: "https://github.com/JMarcosz/SantoralLogistic",
      demo: "https://santorallogistics.jeanmarte.com",
      image: "/santorallogisticsv2.webp",
    },
  } as Record<string, { link: string; demo: string; image: string }>,
  contact: {
    email: "jeanmarte22@gmail.com",
  },
  footer: {
    name: "Jean Marco",
  },
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jean-marte-a6b070178/", icon: "linkedin" as const },
    { label: "Instagram", href: "https://www.instagram.com/jeanwebdesing/", icon: "instagram" as const },
    { label: "WhatsApp", href: `https://wa.me/${WHATSAPP_NUMBER}`, icon: "whatsapp" as const },
    { label: "Email", href: "mailto:jeanmarte22@gmail.com", icon: "email" as const },
  ],
};

type Dict = typeof es;

function merge(dict: Dict, locale: Locale) {
  return {
    ...dict,
    hero: { ...dict.hero, ...shared.hero },
    projects: {
      ...dict.projects,
      items: dict.projects.items.map((item) => ({
        ...item,
        ...(shared.projects[item.slug] ?? { link: "", demo: "", image: "" }),
        href: projectPath(locale, item.slug),
      })),
    },
    contact: { ...dict.contact, ...shared.contact },
    footer: { ...dict.footer, ...shared.footer, year: new Date().getFullYear() },
    socials: shared.socials,
    /** URL de agendado: el CTA primario del hero, del contacto y de cada caso. */
    schedule: scheduleUrl(locale),
    home: localeHome(locale),
  };
}

const CONTENT = {
  es: merge(es as Dict, "es"),
  en: merge(en as Dict, "en"),
};

export type Content = (typeof CONTENT)["es"];
export type Project = Content["projects"]["items"][number];

export function getContent(locale?: string | null): Content {
  return CONTENT[normalizeLocale(locale)];
}

/** Un proyecto por slug, o `undefined` si el slug no existe. */
export function getProject(locale: string | null | undefined, slug: string): Project | undefined {
  return getContent(locale).projects.items.find((item) => item.slug === slug);
}

/** Todos los proyectos de un idioma — usado por `getStaticPaths`. */
export function getProjects(locale: Locale): Project[] {
  return CONTENT[locale].projects.items;
}
