// Deterministischer Zufall: gleicher Seed -> gleiches Bild in jedem Frame und jedem Render.
export type Rng = () => number;

export const seedAus = (s: string | number): number => {
  const str = String(s);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const rng = (seed: string | number): Rng => {
  let a = seedAus(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const gauss = (r: Rng): number => {
  const u = 1 - r();
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

export const zwischen = (r: Rng, a: number, b: number) => a + (b - a) * r();
export const waehle = <T,>(r: Rng, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];

// Glatte 1D-Werte-Rauschkurve (für Wind, Atmen, Flackern) – nur aus Zahl t berechnet.
const hash1 = (n: number, s: number) => {
  const x = Math.sin(n * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const rauschen1 = (t: number, seed = 0): number => {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return (hash1(i, seed) * (1 - u) + hash1(i + 1, seed) * u) * 2 - 1;
};
export const fbm1 = (t: number, seed = 0) =>
  rauschen1(t, seed) * 0.6 + rauschen1(t * 2.1, seed + 3) * 0.28 + rauschen1(t * 4.3, seed + 7) * 0.12;
