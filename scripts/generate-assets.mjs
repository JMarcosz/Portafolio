// Genera, a partir de la foto real, todos los assets de "app" que pide SEO/compartir:
// favicon, apple-touch-icon, íconos de PWA y la tarjeta de Open Graph (1200x1200,
// cuadrada — ver nota en buildOgImage sobre por qué no panorámica).
// Se corre a mano cuando la foto cambie: `node scripts/generate-assets.mjs`.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, "..", "public");
const PHOTO = path.join(PUBLIC_DIR, "foto_personal.webp");
const LOGO = path.join(PUBLIC_DIR, "logo-web.jpeg");

const BG = "#050505";
const INK = "#f2f1ec";
const INK_DIM = "rgba(242,241,236,0.55)";

// ---------- favicon + apple-touch-icon + PWA icons (desde logo-web.jpeg) ----------

async function buildLogoIcon(size, outFile) {
  await sharp(LOGO)
    .resize(size, size, { fit: "contain" })
    .png({ quality: 100 })
    .toFile(path.join(PUBLIC_DIR, outFile));

  console.log(`✓ ${outFile} (${size}x${size})`);
}

// ---------- tarjeta de Open Graph, CUADRADA (1200x1200) ----------
//
// Probado dos veces: con 1200x630 (el estándar 1.91:1 de Facebook/Twitter/
// LinkedIn) WhatsApp seguía mostrando la tarjeta chica incluso con la URL
// cache-busteada (?v=2), así que no era caché. La prueba que lo confirmó: el
// HTML fuente de yoelbaez.com (la referencia que sí se ve grande) no tiene NI
// UN tag Open Graph — WhatsApp cae de vuelta a su <link rel="icon">, que mide
// 2134x2134 (cuadrado). Conclusión verificada, no supuesta: para el crawler de
// WhatsApp la imagen tiene que ser cuadrada, sin importar lo que diga el spec
// de Open Graph que usan Facebook/Twitter/LinkedIn — esas tres plataformas
// aceptan cuadrada igual de bien (solo exigen un mínimo).

async function buildOgImage() {
  const size = 1200;
  const photoSize = 520;

  // PNG, no WebP: el rasterizador de SVG que usa sharp (resvg) no decodifica WebP
  // embebido como data URI en <image>, así que salía en blanco.
  const photoBuf = await sharp(PHOTO).resize(photoSize, photoSize, { fit: "cover" }).png().toBuffer();
  const photoB64 = photoBuf.toString("base64");

  const cx = size / 2;
  const cy = 430;
  const r = photoSize / 2;

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="50%" cy="34%" r="55%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.09"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
        <clipPath id="circle">
          <circle cx="${cx}" cy="${cy}" r="${r}"/>
        </clipPath>
      </defs>

      <rect width="${size}" height="${size}" fill="${BG}"/>
      <rect width="${size}" height="${size}" fill="url(#glow)"/>

      <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="rgba(242,241,236,0.15)" stroke-width="2"/>
      <image x="${cx - r}" y="${cy - r}" width="${photoSize}" height="${photoSize}"
             href="data:image/png;base64,${photoB64}" clip-path="url(#circle)"/>

      <text x="${cx}" y="810" font-family="Arial, sans-serif" font-size="26" letter-spacing="6"
            text-anchor="middle" fill="${INK_DIM}">PORTAFOLIO PROFESIONAL</text>
      <text x="${cx}" y="880" font-family="Arial, sans-serif" font-weight="700" font-size="66"
            text-anchor="middle" fill="${INK}">Jean Marco Marte</text>
      <text x="${cx}" y="935" font-family="Arial, sans-serif" font-size="34"
            text-anchor="middle" fill="${INK_DIM}">Ingeniero de Software Full Stack</text>
      <text x="${cx}" y="985" font-family="Arial, sans-serif" font-size="27"
            text-anchor="middle" fill="${INK_DIM}">República Dominicana · Remoto</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(path.join(PUBLIC_DIR, "og-image.jpg"));
  console.log(`✓ og-image.jpg (${size}x${size})`);
}

// ---------- manifest ----------

async function buildManifest() {
  const manifest = {
    name: "Jean Marte — Desarrollo de Software y Sistemas Empresariales",
    short_name: "Jean Marte",
    description: "Portafolio profesional de Jean Marte (Jean Marco Marte), Ingeniero de Software Full Stack.",
    start_url: "/",
    display: "standalone",
    background_color: BG,
    theme_color: BG,
    icons: [
      { src: "/favicon-48x48.png", sizes: "48x48", type: "image/png", purpose: "any" },
      { src: "/favicon-96x96.png", sizes: "96x96", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
  await writeFile(path.join(PUBLIC_DIR, "site.webmanifest"), JSON.stringify(manifest, null, 2));
  console.log("✓ site.webmanifest");
}

await buildLogoIcon(48, "favicon-48x48.png");
await buildLogoIcon(96, "favicon-96x96.png");
await buildLogoIcon(144, "favicon-144x144.png");
await buildLogoIcon(96, "favicon.png");
await buildLogoIcon(180, "apple-touch-icon.png");
await buildLogoIcon(192, "icon-192.png");
await buildLogoIcon(512, "icon-512.png");
await buildOgImage();
await buildManifest();
