// Toda la información editable del sitio vive aquí.
// Los proyectos siguen con placeholders del diseño original: reemplázalos cuando tengas los datos reales.

export const nav = [
  { label: "Inicio", href: "#inicio" },
  { label: "Sobre mí", href: "#sobre-mi" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Experiencia", href: "#experiencia" },
  { label: "Formación", href: "#formacion" },
  { label: "Certificados", href: "#certificados" },
  { label: "Habilidades", href: "#habilidades" },
  { label: "Contacto", href: "#contacto" },
];

export const hero = {
  eyebrow: "Portafolio profesional",
  title1: "Hola, soy",
  title2: "Jean Marco",
  description:
    "Ingeniero enfocado en construir soluciones digitales que resuelven problemas concretos. Combino criterio técnico con atención al detalle para entregar proyectos que funcionan bien y se ven bien.",
  cta: "Contáctame",
  photo: "/foto_personal.jpeg",
  cvLabel: "Ver CV",
  cvFile: "/CV Jean Marte Full Stack Spanish Version.pdf",
};

export type Certificate = {
  year: string;
  title: string;
  institution: string;
  description: string;
  tags: string[];
};

export const certificates: Certificate[] = [
  {
    year: "2025",
    title: "Desarrollo Web Front-End con Angular",
    institution: "ITLA",
    description:
      "Autenticación y validación de rutas con Guards, consumo dinámico de APIs, gestión de LocalStorage y componentes reutilizables con TailwindCSS.",
    tags: ["Angular", "TailwindCSS", "APIs REST"],
  },
  {
    year: "2024",
    title: "Analista de Datos - Power BI",
    institution: "Udemy",
    description:
      "Formación en análisis y visualización de datos con Power BI para la toma de decisiones de negocio.",
    tags: ["Power BI", "Análisis de Datos"],
  },
  {
    year: "2024",
    title: "English Certificate A2-Level",
    institution: "International English Test",
    description: "Certificación de nivel de inglés A2 (elemental).",
    tags: ["Inglés", "A2"],
  },
  {
    year: "2024",
    title: "Fundamentos de Scrum",
    institution: "soylider.net",
    description: "Principios y fundamentos del framework ágil Scrum.",
    tags: ["Scrum", "Agile"],
  },
  {
    year: "2026",
    title: "Community Management & Marketing Digital",
    institution: "ITLA",
    description: "Gestión de redes sociales y estrategias de marketing digital.",
    tags: ["Marketing Digital", "Redes Sociales"],
  },
  {
    year: "2022",
    title: "Cisco Certified IT Essentials",
    institution: "Cisco Networking Academy",
    description: "Fundamentos de hardware, software y redes de computadoras.",
    tags: ["Redes", "Hardware"],
  },
];

export const projects = {
  featured: {
    badge: "Proyecto destacado",
    title: "Zentra",
    subtitle: "Automatización fiscal para República Dominicana",
    description:
      "Plataforma SaaS que automatiza el ciclo completo de comprobantes fiscales: digitaliza facturas con OCR e IA (Google Gemini), clasifica gastos e ingresos según la normativa DGII y genera los archivos 606/607 listos para la Oficina Virtual.",
    tags: ["Vue 3", "NestJS", "PostgreSQL", "Gemini AI"],
    link: "https://github.com/JMarcosz/FacturasRD",
    demo: "https://zentra.jeanmarte.com",
    image: "/zentrav2.jpeg",
  },
  client: {
    badge: "Cliente",
    title: "Santoral Logistic",
    subtitle: "Para Maed Logistic Trading",
    description:
      "TMS + WMS + CRM que centraliza cotizaciones, embarques, inventario y facturación en un solo lugar.",
    tags: ["Laravel 12", "React 19", "PostgreSQL"],
    link: "https://github.com/JMarcosz/SantoralLogistic",
    demo: "https://santorallogistics.jeanmarte.com",
    image: "/santorallogisticsv2.jpeg",
  },
  toolset: {
    title: "Herramientas que uso",
    tags: ["TypeScript", "Docker", "PostgreSQL", "Git", "Tailwind CSS"],
  },
};

export type ExperienceItem = {
  period: string;
  role: string;
  company: string;
  location: string;
  bullets: string[];
  tags: string[];
};

export const experience: ExperienceItem[] = [
  {
    period: "OCT 2025 — PRESENTE",
    role: "Desarrollador de Software",
    company: "Ministerio de Hacienda y Economía",
    location: "Remoto",
    bullets: [
      "Desarrollo de soluciones web empresariales utilizando Nuxt.js / Vue.js en el frontend, integradas con servicios backend y APIs dentro de una arquitectura modular y escalable.",
      "Desarrollo de componentes e interfaces frontend reutilizables, enfocados en mantenibilidad, usabilidad y rendimiento para aplicaciones críticas del negocio.",
      "Integración de aplicaciones frontend con servicios RESTful y sistemas backend, gestionando el intercambio de datos mediante estructuras JSON.",
      "Contenerización de aplicaciones y estandarización de entornos de desarrollo y despliegue utilizando Docker.",
      "Trabajo con sistemas empresariales que incluyen módulos de recursos humanos, CRM, contabilidad y operaciones.",
    ],
    tags: ["Nuxt.js", "Vue.js", "Docker", "REST API", "JSON"],
  },
  {
    period: "NOV 2023 — SEP 2025",
    role: "Analista de Sistemas e Infraestructura",
    company: "Valiente Fernández",
    location: "Santo Domingo, RD",
    bullets: [
      "Lideré la implementación de Facturación Electrónica (DGII) en múltiples entornos, coordinando requerimientos de aplicación, base de datos e infraestructura.",
      "Administré SAP Business One en servidores Linux (openSUSE) y brindé soporte a entornos de producción con enfoque en continuidad operacional.",
      "Realicé mantenimiento de infraestructura, monitoreo diario de sistemas y soporte técnico basado en SLA.",
      "Desarrollé soluciones SQL avanzadas, incluyendo procedimientos almacenados, vistas, cubos de datos y reportes con SAP Crystal Reports.",
    ],
    tags: ["SAP Business One", "SQL Server", "Linux", "DGII", "Crystal Reports"],
  },
  {
    period: "2022 — PRESENTE",
    role: "Ingeniero de Software / Full Stack",
    company: "Freelance",
    location: "Remoto",
    bullets: [
      "Desarrollo de una plataforma integral de logística con React en el frontend y Laravel (PHP) en el backend.",
      "Aplicaciones full-stack y bots de mensajería automatizada integrando la WhatsApp Business API y Meta Suite, con Python como backend.",
      "Plataformas web y tiendas online con WordPress, Elementor y WooCommerce, incluyendo plantillas personalizadas en PHP.",
      "Automatización de procesos financieros con Google Apps Script y gestión integral de infraestructura: AWS, Azure, Hostinger, Cloudflare, servidores VPS con Apache, DNS y certificados SSL.",
    ],
    tags: ["React", "Laravel", "Python", "WordPress", "AWS"],
  },
];

export type EducationItem = {
  period: string;
  degree: string;
  institution: string;
};

export const education: EducationItem[] = [
  {
    period: "2025 — 2027",
    degree: "Ingeniería de Software",
    institution: "Universidad Domínico Americana (UNICDA)",
  },
  {
    period: "2022 — 2024",
    degree: "Tecnólogo en Desarrollo de Software",
    institution: "Instituto Tecnológico de las Américas (ITLA)",
  },
];

export type SkillItem = { label: string; percent: number };
export type SkillCategory = {
  index: string;
  title: string;
  description: string;
  skills: SkillItem[];
};

// Porcentajes estimados y editables a mano.
export const skillCategories: SkillCategory[] = [
  {
    index: "01",
    title: "Desarrollo frontend",
    description: "Interfaces, accesibilidad y rendimiento en el navegador",
    skills: [
      { label: "Angular", percent: 85 },
      { label: "React / Next.js", percent: 78 },
      { label: "Vue.js / Nuxt.js", percent: 80 },
      { label: "TypeScript", percent: 80 },
    ],
  },
  {
    index: "02",
    title: "Desarrollo backend",
    description: "APIs, bases de datos y lógica de servidor",
    skills: [
      { label: "Node.js", percent: 75 },
      { label: "Bases de datos", percent: 70 },
      { label: "APIs REST", percent: 80 },
      { label: "Autenticación", percent: 76 },
    ],
  },
  {
    index: "03",
    title: "Herramientas & procesos",
    description: "Control de versiones, despliegue y trabajo en equipo",
    skills: [
      { label: "Docker", percent: 78 },
      { label: "Git", percent: 85 },
      { label: "AWS / Azure", percent: 65 },
      { label: "Linux / VPS", percent: 72 },
    ],
  },
];

export const about = {
  eyebrow: "Quién soy",
  title1: "Sobre",
  title2: "Mi Trayectoria",
  paragraphs: [
    "Soy ingeniero y desarrollador. Mi trabajo consiste en llevar una idea desde la conversación inicial hasta algo que funciona en producción, sin perder por el camino ni la claridad ni el detalle.",
  ],
  highlight: "la ingeniería y el diseño se encuentran",
  paragraphAfterHighlight:
    ": sistemas que se sostienen técnicamente y que además resultan naturales para quien los usa. Cada proyecto lo trato como un problema a resolver, no como una plantilla a rellenar.",
  stats: [
    { value: "3+", label: "Años de experiencia" },
    { value: "20+", label: "Proyectos completados" },
    { value: "10+", label: "Clientes satisfechos" },
    { value: "5+", label: "Certificados obtenidos" },
  ],
};

export const contact = {
  eyebrow: "Hablemos",
  title1: "Creemos",
  title2: "Algo Nuevo",
  description:
    "¿Tienes un proyecto en mente o una idea que quieres poner en marcha? Cuéntame de qué se trata y te respondo con los siguientes pasos.",
  email: "jeanmarte22@gmail.com",
  location: "República Dominicana · Remoto",
};

export type SocialLink = {
  label: string;
  href: string;
  icon: "linkedin" | "instagram" | "whatsapp" | "email";
};

export const socials: SocialLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jean-marte-a6b070178/", icon: "linkedin" },
  { label: "Instagram", href: "https://www.instagram.com/jeanwebdesing/", icon: "instagram" },
  { label: "WhatsApp", href: "https://wa.me/18299069256", icon: "whatsapp" },
  { label: "Email", href: "mailto:jeanmarte22@gmail.com", icon: "email" },
];

export const footer = {
  name: "Jean Marco",
  role: "Ingeniero · Desarrollo web",
  year: new Date().getFullYear(),
};
