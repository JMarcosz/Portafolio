// Genera, a partir de la foto real, todos los assets de "app" que pide SEO/compartir:
// favicon, apple-touch-icon, íconos de PWA y la tarjeta de Open Graph (1200x630).
// Se corre a mano cuando la foto cambie: `node scripts/generate-assets.mjs`.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(ROOT, "..", "public");
const PHOTO = path.join(PUBLIC_DIR, "foto_personal.webp");

const BG = "#050505";
const INK = "#f2f1ec";
const INK_DIM = "rgba(242,241,236,0.55)";

function circleMaskSvg(size) {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
}

/** Foto recortada a círculo, a `size`x`size` px, lista para componer. */
async function circularPhoto(size) {
  const resized = await sharp(PHOTO).resize(size, size, { fit: "cover" }).toBuffer();
  return sharp(resized)
    .composite([{ input: circleMaskSvg(size), blend: "dest-in" }])
    .png()
    .toBuffer();
}

// ---------- favicon + apple-touch-icon + PWA icons (todos circulares, foto real) ----------

async function buildIcon(size, outFile, { padding = 0 } = {}) {
  const photoSize = size - padding * 2;
  const photo = await circularPhoto(photoSize);

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: photo, left: padding, top: padding }])
    .png()
    .toFile(path.join(PUBLIC_DIR, outFile));

  console.log(`✓ ${outFile} (${size}x${size})`);
}

// ---------- tarjeta de Open Graph 1200x630 (1.91:1) ----------
//
// Se había cambiado a cuadrada por una suposición sin verificar sobre cómo decide
// WhatsApp entre tarjeta grande y chica — resultó incorrecta. La documentación real
// (developers.facebook.com/documentation/business-messaging/whatsapp/link-previews)
// pide exactamente esto para la tarjeta grande: ancho ≥300px, relación de aspecto
// ≤4:1, y recomienda 1200x630 (1.91:1) — el mismo estándar de Facebook/Twitter/
// LinkedIn, así que una sola imagen sirve para las cuatro plataformas. Confirmado
// además que el archivo pesa 77KB, muy por debajo del límite de 600KB.
//
// Si WhatsApp sigue mostrando la tarjeta chica después de esto, no es la imagen:
// es el caché de WhatsApp para esa URL exacta, que no tiene forma de limpiarse a
// mano y puede tardar días en vencer por su cuenta.

async function buildOgImage() {
  const photoSize = 400;
  // PNG, no WebP: el rasterizador de SVG que usa sharp (resvg) no decodifica WebP
  // embebido como data URI en <image>, así que salía en blanco.
  const photoBuf = await sharp(PHOTO).resize(photoSize, photoSize, { fit: "cover" }).png().toBuffer();
  const photoB64 = photoBuf.toString("base64");

  const cx = 975;
  const cy = 315;
  const r = photoSize / 2;

  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glow" cx="75%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </radialGradient>
        <clipPath id="circle">
          <circle cx="${cx}" cy="${cy}" r="${r}"/>
        </clipPath>
      </defs>

      <rect width="1200" height="630" fill="${BG}"/>
      <rect width="1200" height="630" fill="url(#glow)"/>

      <text x="90" y="260" font-family="Arial, sans-serif" font-size="26" letter-spacing="6"
            fill="${INK_DIM}">PORTAFOLIO PROFESIONAL</text>
      <text x="90" y="330" font-family="Arial, sans-serif" font-weight="700" font-size="60"
            fill="${INK}">Jean Marco Marte</text>
      <text x="90" y="382" font-family="Arial, sans-serif" font-size="30"
            fill="${INK_DIM}">Ingeniero de Software Full Stack</text>
      <text x="90" y="428" font-family="Arial, sans-serif" font-size="25"
            fill="${INK_DIM}">República Dominicana · Remoto</text>

      <circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="none" stroke="rgba(242,241,236,0.15)" stroke-width="2"/>
      <image x="${cx - r}" y="${cy - r}" width="${photoSize}" height="${photoSize}"
             href="data:image/png;base64,${photoB64}" clip-path="url(#circle)"/>
    </svg>
  `;

  await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(path.join(PUBLIC_DIR, "og-image.jpg"));
  console.log("✓ og-image.jpg (1200x630)");
}

// ---------- manifest ----------

async function buildManifest() {
  const manifest = {
    name: "Jean Marco Marte — Ingeniero de Software",
    short_name: "Jean Marco",
    description: "Portafolio profesional de Jean Marco Marte, Ingeniero de Software Full Stack.",
    start_url: "/",
    display: "standalone",
    background_color: BG,
    theme_color: BG,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
  await writeFile(path.join(PUBLIC_DIR, "site.webmanifest"), JSON.stringify(manifest, null, 2));
  console.log("✓ site.webmanifest");
}

await buildIcon(64, "favicon.png");
await buildIcon(180, "apple-touch-icon.png");
await buildIcon(192, "icon-192.png");
await buildIcon(512, "icon-512.png");
await buildOgImage();
await buildManifest();
