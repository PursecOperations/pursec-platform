// Renderiza SVG a PNG con Chromium (Playwright). Uso: node scripts/render.mjs entrada.svg salida.png
// En el entorno de trabajo de Claude: PLAYWRIGHT_BROWSERS_PATH ya apunta a Chromium.
import { readFile } from "node:fs/promises";

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error("Uso: node scripts/render.mjs entrada.svg salida.png");
  process.exit(1);
}
const { chromium } = await import("playwright");
const svg = await readFile(input, "utf8");
const w = Number(svg.match(/width="(\d+)"/)?.[1] || 1080);
const h = Number(svg.match(/height="(\d+)"/)?.[1] || 1350);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: h } });
await page.setContent(`<html><body style="margin:0;background:#050409">${svg}</body></html>`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: output });
await browser.close();
