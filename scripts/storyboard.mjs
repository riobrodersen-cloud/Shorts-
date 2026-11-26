// Storyboard: rendert pro Einstellung ein Standbild (Mitte der Einstellung) aus der Film-Komposition
// und baut daraus Kontaktbögen. Aufruf: node scripts/storyboard.mjs <KompositionsId> <ausgabeOrdner> <framesJson>
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";

const [, , id = "Folge01Limerenz", aus = "out/storyboard", framesDatei] = process.argv;
const frames = JSON.parse(fs.readFileSync(framesDatei, "utf8")); // [{name, frame}]
fs.mkdirSync(aus, { recursive: true });
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
let i = 0;
for (const f of frames) {
  const datei = path.join(aus, `${String(++i).padStart(2, "0")}.png`);
  await renderStill({ composition, serveUrl, output: datei, frame: f.frame, browserExecutable, scale: 0.5 });
  console.log(datei, f.name, f.frame);
}
