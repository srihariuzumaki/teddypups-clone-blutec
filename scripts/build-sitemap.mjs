// Writes public/sitemap.xml and public/robots.txt. Usage: SITE_URL=https://example.com node scripts/build-sitemap.mjs
import fs from "node:fs";
const site = (process.env.SITE_URL || "https://teddypups-clone-blutec.vercel.app").replace(/\/$/, "");
const raw = JSON.parse(fs.readFileSync("src/data/puppies.json", "utf8"));
const pages = ["/", "/puppies", "/gone-home", "/happy-families", "/how-it-works", "/faq", "/contact", ...raw.available.map((p) => "/puppies/" + p.slug)];
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${site}${p === "/" ? "/" : p}</loc></url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync("public/sitemap.xml", xml);
fs.writeFileSync("public/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
console.log(pages.length, "urls");
