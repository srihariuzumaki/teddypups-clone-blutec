// Resized WebP variants of everything in public/media, so pages download ~30-100 KB instead of multi-MB originals.
//   node scripts/make-variants.mjs   (runs automatically as part of `npm run build`)
// Writes public/media-opt/<path>-<width>.webp (gitignored, copied to dist by Vite) and src/data/media-variants.json
// ({ "/media/x.jpg": [320, 640, ...] }), which src/lib/images.ts turns into srcset attributes.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const WIDTHS = [320, 480, 640, 960, 1280];
const MAX = 1600; // largest variant (also what the full-screen viewer would need)
const SRC = "public/media", OUT = "public/media-opt";
const IMG = /\.(jpe?g|png|webp|avif)$/i;

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(SRC).filter((f) => IMG.test(f));
const manifest = {};
const t0 = Date.now();
let made = 0, reused = 0;

await Promise.all(
  files.map(async (file, i) => {
    // modest concurrency: sharp already uses a thread pool
    await new Promise((r) => setTimeout(r, 0));
    const rel = path.relative("public", file).split(path.sep).join("/"); // media/xxx/yyy.jpg
    const key = "/" + rel;
    const base = rel.replace(/^media\//, "").replace(/\.[^.]+$/, "");
    const meta = await sharp(file).metadata();
    const w0 = meta.width ?? 0;
    if (!w0) return;
    const widths = [...WIDTHS.filter((w) => w < Math.min(w0, MAX)), Math.min(w0, MAX)];
    manifest[key] = widths;
    for (const w of widths) {
      const out = path.join(OUT, `${base}-${w}.webp`);
      if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(file).mtimeMs) { reused++; continue; }
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await sharp(file).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toFile(out);
      made++;
    }
  }),
);

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync("src/data/media-variants.json", JSON.stringify(sorted));
console.log(`media variants: ${files.length} images, ${made} written, ${reused} reused, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
