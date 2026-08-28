// Contenido del sitio en dos idiomas.
//
// - Los textos traducibles viven en ./es.json y ./en.json (misma forma).
// - Los datos no traducibles (fotos, archivos, correo, enlaces sociales, dominio)
//   viven acá y se fusionan con el idioma elegido.
//
// Uso en un componente .astro:
//   const t = getContent(Astro.currentLocale);
//   t.hero.title2, t.projects.featured.demo, t.socials, ...
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

// --- Datos no traducibles, compartidos entre idiomas -----------------------
const shared = {
  hero: {
    photo: "/foto_personal.webp",
    cvFile: "/CV Jean Marte Full Stack Spanish Version.pdf",
  },
  projects: {
    featured: {
      link: "https://github.com/JMarcosz/FacturasRD",
      demo: "https://zentra.jeanmarte.com",
      image: "/zentrav2.webp",
    },
    client: {
      link: "https://github.com/JMarcosz/SantoralLogistic",
      demo: "https://santorallogistics.jeanmarte.com",
      image: "/santorallogisticsv2.webp",
    },
  },
  contact: {
    email: "jeanmarte22@gmail.com",
  },
  footer: {
    name: "Jean Marco",
  },
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jean-marte-a6b070178/", icon: "linkedin" as const },
    { label: "Instagram", href: "https://www.instagram.com/jeanwebdesing/", icon: "instagram" as const },
    { label: "WhatsApp", href: "https://wa.me/18299069256", icon: "whatsapp" as const },
    { label: "Email", href: "mailto:jeanmarte22@gmail.com", icon: "email" as const },
  ],
};

type Dict = typeof es;

function merge(dict: Dict) {
  return {
    ...dict,
    hero: { ...dict.hero, ...shared.hero },
    projects: {
      ...dict.projects,
      featured: { ...dict.projects.featured, ...shared.projects.featured },
      client: { ...dict.projects.client, ...shared.projects.client },
    },
    contact: { ...dict.contact, ...shared.contact },
    footer: { ...dict.footer, ...shared.footer, year: new Date().getFullYear() },
    socials: shared.socials,
  };
}

const CONTENT = {
  es: merge(es as Dict),
  en: merge(en as Dict),
};

export type Content = (typeof CONTENT)["es"];

export function getContent(locale?: string | null): Content {
  return CONTENT[normalizeLocale(locale)];
}
