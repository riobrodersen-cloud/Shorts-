// Aquarell-Lasuren nach der Technik von Tyler Hobbs ("A Guide to Simulating Watercolor Paint"):
// Ein Grundpolygon wird rekursiv an den Kantenmitten verschoben; daraus entstehen viele leicht
// unterschiedliche, halbtransparente Schichten. Übereinander gelegt ergeben sie weiche,
// ausblutende Ränder und dunklere Pigment-Kanten – wie echte Farbe auf nassem Papier.
import { gauss, rng, Rng, zwischen } from "./zufall";

export type P = [number, number];
type PV = [number, number, number]; // x, y, Varianz

const verformen = (pts: PV[], tiefe: number, staerke: number, r: Rng): PV[] => {
  let cur = pts;
  for (let d = 0; d < tiefe; d++) {
    const neu: PV[] = [];
    for (let i = 0; i < cur.length; i++) {
      const a = cur[i];
      const b = cur[(i + 1) % cur.length];
      neu.push(a);
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = Math.hypot(dx, dy);
      const v = (a[2] + b[2]) / 2;
      // Verschiebung überwiegend senkrecht zur Kante -> Ausfransen statt Zacken
      const nx = -dy / (len || 1);
      const ny = dx / (len || 1);
      const off = gauss(r) * len * v * staerke;
      const tang = gauss(r) * len * 0.08;
      neu.push([
        a[0] + dx * 0.5 + nx * off + (dx / (len || 1)) * tang,
        a[1] + dy * 0.5 + ny * off + (dy / (len || 1)) * tang,
        v * zwischen(r, 0.75, 1.15),
      ]);
    }
    cur = neu;
  }
  return cur;
};

// Geschlossener, weich gerundeter Pfad (quadratische Kurven durch die Kantenmitten)
const zuPfad = (pts: PV[] | P[]): string => {
  const n = pts.length;
  const m = (i: number) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  const s0 = m(n - 1);
  let s = `M${s0[0].toFixed(1)} ${s0[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const c = m(i);
    s += `Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`;
  }
  return s + "Z";
};

export type LasurOpt = {
  seed: string | number;
  schichten?: number; // Anzahl transparenter Schichten
  grundTiefe?: number; // Rekursionstiefe für die Grundform
  schichtTiefe?: number; // zusätzliche Tiefe pro Schicht
  streuung?: number; // wie stark die Ränder ausfransen (0.3 – 2)
};

const cache = new Map<string, string[]>();

/** Liefert SVG-Pfade (d-Strings) für die Schichten einer Aquarell-Lasur. */
export const lasurPfade = (form: P[], o: LasurOpt): string[] => {
  const key = `${o.seed}|${o.schichten}|${o.grundTiefe}|${o.schichtTiefe}|${o.streuung}|${form.length}|${form[0]?.[0]}|${form[0]?.[1]}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = rng(o.seed);
  const st = o.streuung ?? 1;
  const basis = verformen(
    form.map(([x, y]) => [x, y, zwischen(r, 0.5, 1.4)] as PV),
    o.grundTiefe ?? 2,
    0.13 * st,
    r,
  );
  const n = o.schichten ?? 8;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(zuPfad(verformen(basis, o.schichtTiefe ?? 2, 0.1 * st, r)));
  }
  cache.set(key, out);
  return out;
};

// ---------- Formen-Helfer (alle bewusst unregelmäßig) ----------

/** Unregelmäßiger Klecks um einen Mittelpunkt. */
export const klecks = (cx: number, cy: number, rx: number, ry: number, seed: string | number, n = 10, unruhe = 0.18, drehung = 0): P[] => {
  const r = rng(seed);
  const pts: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + drehung;
    const k = 1 + gauss(r) * unruhe;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
};

/** Handgezeichnetes Viereck (z. B. Fenster, Buch) – Ecken leicht verschoben, Kanten mit Zwischenpunkten. */
export const viereck = (ecken: [P, P, P, P], seed: string | number, wackel = 3): P[] => {
  const r = rng(seed);
  const out: P[] = [];
  for (let i = 0; i < 4; i++) {
    const a = ecken[i];
    const b = ecken[(i + 1) % 4];
    for (let t = 0; t < 3; t++) {
      const f = t / 3;
      out.push([a[0] + (b[0] - a[0]) * f + gauss(r) * wackel, a[1] + (b[1] - a[1]) * f + gauss(r) * wackel]);
    }
  }
  return out;
};

/** Band entlang einer Mittellinie (Straße, Fluss, Ast) mit variabler Breite. */
export const band = (mitte: P[], breite: (t: number) => number): P[] => {
  const links: P[] = [];
  const rechts: P[] = [];
  for (let i = 0; i < mitte.length; i++) {
    const a = mitte[Math.max(0, i - 1)];
    const b = mitte[Math.min(mitte.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const w = breite(i / (mitte.length - 1)) / 2;
    links.push([mitte[i][0] - (dy / l) * w, mitte[i][1] + (dx / l) * w]);
    rechts.push([mitte[i][0] + (dy / l) * w, mitte[i][1] - (dx / l) * w]);
  }
  return [...links, ...rechts.reverse()];
};

/** Catmull-Rom: macht aus wenigen Stützpunkten eine weiche Kurve. */
export const kurve = (pts: P[], proSegment = 8): P[] => {
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < proSegment; s++) {
      const t = s / proSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};

export const pfad = (pts: P[], zu = true) => {
  let s = "";
  pts.forEach((p, i) => (s += (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)));
  return zu ? s + "Z" : s;
};
