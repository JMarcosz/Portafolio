// Optimiza los assets de /public para lo que realmente se muestra en pantalla.
//
// El problema no era el peso de descarga sino el de DECODIFICACIÓN: una captura
// de 1200x6456 recortada por CSS a un 16:9 de ~570px seguía ocupando 31 MB de
// bitmap en memoria. Sumadas, las 8 imágenes del sitio eran ~100 MB de bitmaps
// vivos a la vez — y todas se cargaban de entrada, porque en el túnel los cinco
// grupos son `inset: 0` y `loading="lazy"` no excluye lo que está dentro del
// viewport aunque sea invisible.
import sharp from "sharp";
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";

const PUB = "public";
const CERTS = path.join(PUB, "Certificados Portafolio");
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

async function report(label, from, to) {
  const a = (await stat(from)).size;
  const b = (await stat(to)).size;
  console.log(`  ${label}\n    ${path.basename(from)} ${kb(a)}  ->  ${path.basename(to)} ${kb(b)}`);
}

// 1. Miniaturas de proyecto: exactamente la franja que el card deja ver.
//    El card es aspect-video con object-cover/object-top, así que a 1200 de
//    ancho la región visible es justo el recorte superior de 1200x675.
for (const name of ["zentrav2", "santorallogisticsv2"]) {
  const src = path.join(PUB, `${name}.webp`);
  const out = path.join(PUB, `${name}-card.webp`);
  await sharp(src).extract({ left: 0, top: 0, width: 1200, height: 675 }).webp({ quality: 82 }).toFile(out);
  await report("thumb de proyecto", src, out);
}

// 2. Certificados: se muestran en cards de ~380px de ancho. Estaban a 1650px y
//    en JPG. 900px cubre retina de sobra.
const certJpgs = (await readdir(CERTS)).filter((f) => f.endsWith(".jpg"));
for (const f of certJpgs) {
  const src = path.join(CERTS, f);
  const out = path.join(CERTS, f.replace(/\.jpg$/, ".webp"));
  await sharp(src).resize({ width: 900, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
  await report("certificado", src, out);
  await unlink(src); // derivado del PDF que queda al lado; además está en git
}

// 3. Foto del hero: se muestra a 384px como máximo (lg:h-96) en desktop, 288px en tablet, 224px en mobile.
{
  const src = path.join(PUB, "foto_personal.webp");
  const out384 = path.join(PUB, "foto_personal_384.webp");
  const out768 = path.join(PUB, "foto_personal_768.webp");
  await sharp(src).resize({ width: 384, height: 384, fit: "cover" }).webp({ quality: 80, effort: 6 }).toFile(out384);
  await report("foto hero 384w", src, out384);
  await sharp(src).resize({ width: 768, height: 768, fit: "cover" }).webp({ quality: 80, effort: 6 }).toFile(out768);
  await report("foto hero 768w", src, out768);
}

// 4. Icono del manifest: 106 KB para un PNG de 512x512 es palette sin optimizar.
{
  const src = path.join(PUB, "icon-512.png");
  const out = path.join(PUB, "icon-512.opt.png");
  await sharp(src).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(out);
  await report("icono 512", src, out);
}
