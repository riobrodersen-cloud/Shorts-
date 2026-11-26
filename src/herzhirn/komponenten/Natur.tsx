import React from "react";
import { useCurrentFrame } from "remotion";
import { band, klecks, kurve, P, pfad } from "../lib/aquarell";
import { fbm1, gauss, rng, zwischen } from "../lib/zufall";
import { Lasur, Leuchten, Strich } from "./Pinsel";

// ---------------------------------------------------------------------------
// Baum: Stamm + Äste + Krone aus vielen Blattbüscheln, die einzeln im Wind schaukeln
// ---------------------------------------------------------------------------
export type BaumFarben = { schatten: string; mitte: string; licht: string; spitze: string; stamm: string; tusche: string };
export const SOMMER: BaumFarben = { schatten: "#2f6b4a", mitte: "#4f9a4f", licht: "#9cc957", spitze: "#e2e27a", stamm: "#6b4630", tusche: "#2c2118" };
export const ABEND: BaumFarben = { schatten: "#24503f", mitte: "#3f7a5a", licht: "#6fa05a", spitze: "#ffc86a", stamm: "#4b2a2c", tusche: "#24141a" };

export const Baum: React.FC<{
  x: number; // Fußpunkt
  y: number;
  hoehe: number;
  breite?: number;
  seed: string;
  farben?: BaumFarben;
  wind?: number; // Stärke
  lichtVon?: number; // -1 links .. 1 rechts
  bueschel?: number;
}> = ({ x, y, hoehe, breite, seed, farben = SOMMER, wind = 1, lichtVon = 0.6, bueschel = 26 }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const B = breite ?? hoehe * 0.8;
  const r = rng(seed);
  const s = hoehe / 400; // Skalierung für Strichstärken

  // Stamm leicht gebogen
  const neig = zwischen(r, -0.08, 0.08);
  const stammMitte: P[] = kurve([
    [x, y],
    [x + hoehe * neig * 0.3 + gauss(r) * 6 * s, y - hoehe * 0.25],
    [x + hoehe * neig * 0.8, y - hoehe * 0.5],
  ], 6);
  const kroneX = x + hoehe * neig * 0.8;
  const kroneY = y - hoehe * 0.66;

  // Büschel innerhalb einer unregelmäßigen Kronen-Ellipse verteilen
  const busch = React.useMemo(() => {
    const rr = rng(seed + "b");
    const arr: { cx: number; cy: number; rx: number; ry: number; tiefe: number; i: number; seed: string }[] = [];
    for (let i = 0; i < bueschel; i++) {
      const a = rr() * Math.PI * 2;
      const d = Math.sqrt(rr());
      const cx = kroneX + Math.cos(a) * d * B * 0.45;
      const cy = kroneY + Math.sin(a) * d * hoehe * 0.3;
      const gr = zwischen(rr, 0.16, 0.26) * B;
      // Tiefe: oben + Lichtseite = vorne/hell
      const tiefe = (kroneY - cy) / (hoehe * 0.3) * 0.5 + ((cx - kroneX) / (B * 0.45)) * lichtVon * 0.5 + gauss(rr) * 0.2;
      arr.push({ cx, cy, rx: gr, ry: gr * zwischen(rr, 0.7, 0.9), tiefe, i, seed: `${seed}-${i}` });
    }
    return arr.sort((p, q) => p.tiefe - q.tiefe);
  }, [seed, bueschel, kroneX, kroneY, B, hoehe, lichtVon]);

  // Wind: ganze Krone wiegt, jedes Büschel zusätzlich eigen
  const boe = fbm1(t * 0.35, seedNum(seed)) * 2.2 * wind;
  const kroneDreh = boe;

  return (
    <g>
      {/* Schlagschatten auf dem Boden */}
      <Lasur form={klecks(x + 30 * s, y + 4, B * 0.45, 18 * s, seed + "sch", 9, 0.15)} farbe="#3b4a2a" deckung={0.28} seed={seed + "sch"} schichten={5} kante={false} />
      <g transform={`rotate(${kroneDreh * 0.25} ${x} ${y})`}>
        <Lasur form={band(stammMitte, (u) => (1 - u * 0.55) * 26 * s)} farbe={farben.stamm} seed={seed + "st"} schichten={6} streuung={0.5} />
        <Strich punkte={stammMitte.filter((_, i) => i % 3 === 0).map(([a, b]) => [a + 10 * s, b] as P)} breite={3.2 * s} farbe={farben.tusche} deckung={0.7} seed={seed + "ts"} />
        {/* Äste */}
        {[0, 1, 2, 3].map((k) => {
          const rk = rng(seed + "ast" + k);
          const dir = k % 2 ? 1 : -1;
          const sy = y - hoehe * zwischen(rk, 0.42, 0.55);
          const sx = x + hoehe * neig * 0.7;
          const pts: P[] = [
            [sx, sy],
            [sx + dir * B * zwischen(rk, 0.12, 0.2), sy - hoehe * zwischen(rk, 0.08, 0.14)],
            [sx + dir * B * zwischen(rk, 0.22, 0.32), sy - hoehe * zwischen(rk, 0.16, 0.24)],
          ];
          return <Strich key={k} punkte={pts} breite={7 * s} farbe={farben.stamm} deckung={0.95} seed={seed + "a" + k} opts={{ thinning: 0.5, end: { taper: 40 * s } }} />;
        })}
        {/* Krone */}
        <g transform={`rotate(${kroneDreh} ${x} ${y - hoehe * 0.4})`}>
          {busch.map((b) => {
            const w = fbm1(t * 0.6 + b.i * 0.37, b.i) * 3 * wind;
            const farbe = b.tiefe < -0.25 ? farben.schatten : b.tiefe < 0.25 ? farben.mitte : farben.licht;
            return (
              <g key={b.i} transform={`rotate(${w} ${b.cx} ${b.cy + b.ry}) translate(${w * 0.6} 0)`}>
                <Lasur form={klecks(b.cx, b.cy, b.rx, b.ry, b.seed, 11, 0.22)} farbe={farbe} deckung={0.88} seed={b.seed} schichten={6} streuung={1.1} kante={farben.tusche} />
                {b.tiefe > 0.1 ? (
                  <Lasur form={klecks(b.cx + b.rx * 0.2 * lichtVon, b.cy - b.ry * 0.35, b.rx * 0.5, b.ry * 0.4, b.seed + "l", 8, 0.25)} farbe={farben.spitze} deckung={0.55} seed={b.seed + "l"} schichten={4} kante={false} />
                ) : null}
                <Blattkante cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} seed={b.seed} farbe={b.tiefe > 0 ? farben.licht : farben.mitte} s={s} />
              </g>
            );
          })}
        </g>
      </g>
    </g>
  );
};

const seedNum = (s: string) => s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

// Blatt: spitz zulaufende, runde Form entlang Richtung (ca, sa)
export const blattForm = (bx: number, by: number, ca: number, sa: number, L: number, w: number): P[] => {
  const q = (u: number, v: number): P => [bx + ca * L * u - sa * w * v, by + sa * L * u + ca * w * v];
  return [q(0, 0), q(0.2, 0.55), q(0.5, 0.75), q(0.8, 0.4), q(1, 0), q(0.8, -0.4), q(0.5, -0.75), q(0.2, -0.55)];
};

// Einzelne Blätter am Rand eines Büschels: macht aus Klecksen "echtes Laub"
const Blattkante: React.FC<{ cx: number; cy: number; rx: number; ry: number; seed: string; farbe: string; s: number }> = React.memo(({ cx, cy, rx, ry, seed, farbe, s }) => {
  const r = rng(seed + "bk");
  const blaetter: string[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const bx = cx + Math.cos(a) * rx * zwischen(r, 0.85, 1.1);
    const by = cy + Math.sin(a) * ry * zwischen(r, 0.85, 1.1);
    const L = zwischen(r, 9, 15) * Math.min(1.4, s * 1.2);
    const w = L * 0.45;
    const ang = a + gauss(r) * 0.6;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const p: P[] = blattForm(bx, by, ca, sa, L, w);
    blaetter.push(pfad(kurve([...p, p[0]], 4)));
  }
  return <path d={blaetter.join("")} fill={farbe} fillOpacity={0.7} />;
});

// ---------------------------------------------------------------------------
// Vögel: kleine Pinsel-"V"s, die mit Flügelschlag über den Himmel ziehen
// ---------------------------------------------------------------------------
export const Voegel: React.FC<{ anzahl?: number; seed: string; y: number; tempo?: number; groesse?: number; farbe?: string; breite?: number }> = ({ anzahl = 5, seed, y, tempo = 1, groesse = 14, farbe = "#3a2a22", breite = 1920 }) => {
  const frame = useCurrentFrame();
  const r = rng(seed);
  return (
    <g>
      {Array.from({ length: anzahl }).map((_, i) => {
        const off = r() * breite;
        const dy = gauss(r) * 40;
        const sp = zwischen(r, 1.6, 2.6) * tempo;
        const g = groesse * zwischen(r, 0.7, 1.2);
        const px = ((off + frame * sp) % (breite + 200)) - 100;
        const py = y + dy + Math.sin(frame / 25 + i) * 8;
        const fl = Math.sin(frame * 0.45 + i * 2) * 0.8; // Flügelschlag
        return (
          <path
            key={i}
            d={`M${px - g} ${py - g * 0.3 * fl} Q${px - g * 0.45} ${py - g * 0.55 * fl - 2} ${px} ${py} Q${px + g * 0.45} ${py - g * 0.55 * fl - 2} ${px + g} ${py - g * 0.3 * fl}`}
            stroke={farbe}
            strokeWidth={2.6}
            strokeLinecap="round"
            fill="none"
            opacity={0.85}
          />
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Partikel: Staub im Licht, Glühwürmchen, fliegende Blätter – alles aus dem Frame berechnet
// ---------------------------------------------------------------------------
export const Staub: React.FC<{ anzahl?: number; seed: string; bereich: [number, number, number, number]; farbe?: string; groesse?: number }> = ({ anzahl = 40, seed, bereich, farbe = "#fff4d6", groesse = 2.6 }) => {
  const frame = useCurrentFrame();
  const r = rng(seed);
  const [x0, y0, w, h] = bereich;
  return (
    <g style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: anzahl }).map((_, i) => {
        const bx = r() * w;
        const by = r() * h;
        const sp = zwischen(r, 0.1, 0.35);
        const ph = r() * 100;
        const gx = (bx + fbm1(frame / 90 + ph, i) * 40 + frame * sp * 0.4) % w;
        const gy = (by - frame * sp + h * 10) % h;
        const fl = 0.35 + 0.65 * Math.abs(Math.sin(frame / 20 + ph));
        return <circle key={i} cx={x0 + gx} cy={y0 + gy} r={groesse * zwischen(r, 0.5, 1.3)} fill={farbe} opacity={fl * 0.8} />;
      })}
    </g>
  );
};

export const Gluehwuermchen: React.FC<{
  anzahl?: number;
  seed: string;
  pfadPunkte: P[]; // Strömungsbahn (z. B. entlang des Flusses)
  tempo?: number; // 0 = schweben
  streuung?: number;
  farbe?: string;
  helligkeit?: number;
  groesse?: number;
  start?: number; // Frame, ab dem sie strömen
}> = ({ anzahl = 60, seed, pfadPunkte, tempo = 1, streuung = 80, farbe = "#ffb52e", helligkeit = 1, groesse = 5, start = 0 }) => {
  const frame = useCurrentFrame();
  const bahn = React.useMemo(() => kurve(pfadPunkte, 20), [pfadPunkte]);
  const r = rng(seed);
  const f = Math.max(0, frame - start);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      {Array.from({ length: anzahl }).map((_, i) => {
        const u0 = r();
        const sp = zwischen(r, 0.5, 1.4) * tempo;
        const ox = gauss(r) * streuung;
        const oy = gauss(r) * streuung * 0.5;
        const ph = r() * 10;
        const u = (u0 + f * sp * 0.0016) % 1;
        const idx = u * (bahn.length - 1);
        const a = bahn[Math.floor(idx)];
        const b = bahn[Math.min(bahn.length - 1, Math.floor(idx) + 1)];
        const k = idx - Math.floor(idx);
        const px = a[0] + (b[0] - a[0]) * k + ox + fbm1(frame / 40 + ph, i) * 25;
        const py = a[1] + (b[1] - a[1]) * k + oy + fbm1(frame / 35 + ph, i + 9) * 18 - Math.sin(u * Math.PI) * 10;
        const blink = 0.45 + 0.55 * Math.max(0, Math.sin(frame / 7 + ph * 3));
        const g = groesse * zwischen(r, 0.6, 1.3) * (0.4 + 0.6 * Math.sin(u * Math.PI));
        return (
          <g key={i} opacity={blink * helligkeit}>
            <circle cx={px} cy={py} r={g * 5} fill={farbe} opacity={0.12} />
            <circle cx={px} cy={py} r={g * 2.4} fill={farbe} opacity={0.35} />
            <circle cx={px} cy={py} r={g * 1.1} fill="#ffe9a0" opacity={0.9} />
            <circle cx={px} cy={py} r={g * 0.55} fill="#fffdf0" />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Lichterkette: durchhängende Schnur mit flackernden Birnchen
// ---------------------------------------------------------------------------
export const Lichterkette: React.FC<{ von: P; bis: P; durchhang?: number; birnen?: number; seed: string; farbe?: string; schnur?: string; helligkeit?: number; glanz?: number }> = ({ von, bis, durchhang = 80, birnen = 14, seed, farbe = "#ffcf6e", schnur = "#3a2a22", helligkeit = 1, glanz = 1 }) => {
  const frame = useCurrentFrame();
  const pkt = (u: number): P => [von[0] + (bis[0] - von[0]) * u, von[1] + (bis[1] - von[1]) * u + Math.sin(u * Math.PI) * durchhang];
  const linie = Array.from({ length: 12 }, (_, i) => pkt(i / 11));
  return (
    <g>
      <Strich punkte={linie} breite={2.2} farbe={schnur} deckung={0.8} seed={seed} zittern={0.4} opts={{ thinning: 0.2, start: { taper: 0 }, end: { taper: 0 } }} />
      {Array.from({ length: birnen }).map((_, i) => {
        const u = (i + 0.5) / birnen;
        const [bx, by] = pkt(u);
        const fl = 0.75 + 0.25 * fbm1(frame / 6 + i * 3.1, i);
        return (
          <g key={i}>
            <Leuchten x={bx} y={by + 8} r={46 * glanz} farbe={farbe} staerke={0.55 * fl * helligkeit} />
            <ellipse cx={bx} cy={by + 8} rx={4.5} ry={6.5} fill="#fff6d8" opacity={0.9 * fl} />
            <ellipse cx={bx} cy={by + 8} rx={7} ry={9} fill={farbe} opacity={0.45 * fl} />
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Dampf: weiche, aufsteigende Schwaden (z. B. über der Tasse)
// ---------------------------------------------------------------------------
export const Dampf: React.FC<{ x: number; y: number; hoehe?: number; farbe?: string }> = ({ x, y, hoehe = 90, farbe = "#fff8ec" }) => {
  const frame = useCurrentFrame();
  return (
    <g style={{ mixBlendMode: "screen" }}>
      {[0, 1, 2].map((k) => {
        const pts: P[] = Array.from({ length: 7 }, (_, i) => {
          const u = i / 6;
          return [x + (k - 1) * 8 + Math.sin(u * 5 + frame / 14 + k * 2) * 10 * u + fbm1(frame / 30 + k, k) * 6, y - u * hoehe] as P;
        });
        const fade = 0.5 + 0.3 * Math.sin(frame / 18 + k);
        return <Strich key={k} punkte={pts} breite={7} farbe={farbe} deckung={0.35 * fade} seed={`dampf${k}`} zittern={0} opts={{ start: { taper: 10 }, end: { taper: 60 } }} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Pflanze im Topf / hängende Ranke
// ---------------------------------------------------------------------------
export const Topfpflanze: React.FC<{ x: number; y: number; groesse?: number; seed: string; blattFarbe?: string; topfFarbe?: string; licht?: string }> = ({ x, y, groesse = 1, seed, blattFarbe = "#3f8a5a", topfFarbe = "#c8653f", licht = "#9fd07a" }) => {
  const frame = useCurrentFrame();
  const r = rng(seed);
  const g = groesse;
  const blaetter = Array.from({ length: 9 }, (_, i) => {
    const ang = -Math.PI / 2 + (i - 4) * 0.33 + gauss(r) * 0.12;
    const L = zwischen(r, 70, 120) * g;
    return { ang, L, i };
  });
  return (
    <g>
      {blaetter.map(({ ang, L, i }) => {
        const sw = fbm1(frame / 50 + i, i) * 0.06;
        const a = ang + sw;
        const sx = x;
        const sy = y - 10 * g;
        const ex = sx + Math.cos(a) * L;
        const ey = sy + Math.sin(a) * L;
        const nx = -Math.sin(a);
        const ny = Math.cos(a);
        const w = L * 0.32;
        const blatt: P[] = [
          [sx + Math.cos(a) * L * 0.35, sy + Math.sin(a) * L * 0.35],
          [sx + Math.cos(a) * L * 0.6 + nx * w, sy + Math.sin(a) * L * 0.6 + ny * w],
          [ex, ey],
          [sx + Math.cos(a) * L * 0.6 - nx * w * 0.8, sy + Math.sin(a) * L * 0.6 - ny * w * 0.8],
        ];
        return (
          <g key={i}>
            <Strich punkte={[[sx, sy], [sx + Math.cos(a) * L * 0.4, sy + Math.sin(a) * L * 0.4]]} breite={3 * g} farbe="#2f5a3a" seed={seed + "s" + i} />
            <Lasur form={kurve([...blatt, blatt[0]], 4)} farbe={i % 3 ? blattFarbe : "#2e6a48"} seed={seed + "b" + i} schichten={4} streuung={0.5} grundTiefe={1} schichtTiefe={1} kante="#1f3a28" />
            <Strich punkte={[blatt[0], [ex - Math.cos(a) * 6, ey - Math.sin(a) * 6]]} breite={1.6 * g} farbe={licht} deckung={0.6} seed={seed + "r" + i} />
          </g>
        );
      })}
      <Lasur form={kurve([[x - 42 * g, y - 14 * g], [x + 44 * g, y - 16 * g], [x + 34 * g, y + 46 * g], [x - 30 * g, y + 48 * g], [x - 42 * g, y - 14 * g]], 4)} farbe={topfFarbe} seed={seed + "t"} schichten={6} streuung={0.4} kante="#5a2a18" />
      <Lasur form={klecks(x - 14 * g, y + 6 * g, 12 * g, 22 * g, seed + "tl", 8, 0.1)} farbe="#f0a070" deckung={0.4} seed={seed + "tl"} schichten={3} kante={false} />
    </g>
  );
};

export const Ranke: React.FC<{ x: number; y: number; laenge: number; seed: string; farbe?: string }> = ({ x, y, laenge, seed, farbe = "#4f9a5a" }) => {
  const frame = useCurrentFrame();
  const r = rng(seed);
  const pend = fbm1(frame / 70, seedNum(seed)) * 10;
  const linie: P[] = Array.from({ length: 8 }, (_, i) => {
    const u = i / 7;
    return [x + Math.sin(u * 3 + r() * 0.5) * 18 + pend * u * u, y + u * laenge] as P;
  });
  const voll = kurve(linie, 5);
  return (
    <g>
      <Strich punkte={linie} breite={2.4} farbe="#2f5a3a" seed={seed} opts={{ thinning: 0.3 }} />
      {voll.filter((_, i) => i % 3 === 1).map(([bx, by], i) => {
        const side = i % 2 ? 1 : -1;
        const L = 18 + (i % 3) * 3;
        const p: P[] = [[bx, by], [bx + side * L * 0.6, by - 6], [bx + side * L, by + 4], [bx + side * L * 0.5, by + 10]];
        return <Lasur key={i} form={kurve([...p, p[0]], 3)} farbe={i % 4 ? farbe : "#2e6a48"} seed={seed + i} schichten={3} grundTiefe={1} schichtTiefe={1} streuung={0.4} kante="#1f3a28" />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Wolke: Aquarell-Wolke aus mehreren Klecksen, zieht langsam
// ---------------------------------------------------------------------------
export const Wolke: React.FC<{ x: number; y: number; b: number; seed: string; farbe?: string; schatten?: string; tempo?: number; deckung?: number }> = ({ x, y, b, seed, farbe = "#fff6ea", schatten = "#e7b9a8", tempo = 0.15, deckung = 0.9 }) => {
  const frame = useCurrentFrame();
  const r = rng(seed);
  const dx = frame * tempo;
  const teile = Array.from({ length: 6 }, (_, i) => ({
    cx: x + (i - 2.5) * b * 0.16 + gauss(r) * b * 0.04,
    cy: y - Math.sin(((i + 0.5) / 6) * Math.PI) * b * 0.12 + gauss(r) * 6,
    rr: b * zwischen(r, 0.14, 0.22),
  }));
  return (
    <g transform={`translate(${dx} 0)`}>
      <Lasur form={klecks(x, y + b * 0.06, b * 0.5, b * 0.1, seed + "s", 10, 0.1)} farbe={schatten} deckung={0.55 * deckung} seed={seed + "s"} schichten={5} kante={false} />
      {teile.map((t, i) => (
        <Lasur key={i} form={klecks(t.cx, t.cy, t.rr, t.rr * 0.8, seed + i, 10, 0.12)} farbe={farbe} deckung={0.75 * deckung} seed={seed + i} schichten={5} kante={false} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Blumen & Gräser: Büschel im Vordergrund, die im Wind nicken
// ---------------------------------------------------------------------------
export const Blumenbeet: React.FC<{ x: number; y: number; b: number; seed: string; dichte?: number; skala?: number }> = ({ x, y, b, seed, dichte = 1, skala = 1 }) => {
  const frame = useCurrentFrame();
  const r = rng(seed);
  const n = Math.round(26 * dichte);
  const farben = ["#e9576a", "#f6e6c8", "#f2b84b", "#c7b3e0", "#e86a52", "#fff4dc"];
  const halme = Array.from({ length: n }, (_, i) => {
    const hx = x + (r() - 0.5) * b;
    const hy = y + (r() - 0.5) * 30 * skala;
    const h = zwischen(r, 30, 80) * skala;
    const bl = r() > 0.45;
    return { hx, hy, h, bl, f: waehle2(r, farben), i, ph: r() * 10 };
  }).sort((a, c) => a.hy - c.hy);
  return (
    <g>
      <Lasur form={klecks(x, y + 6 * skala, b * 0.55, 22 * skala, seed + "g", 10, 0.2)} farbe="#4f8a3f" deckung={0.7} seed={seed + "g"} schichten={4} kante={false} />
      {halme.map(({ hx, hy, h, bl, f, i, ph }) => {
        const w = fbm1(frame / 40 + ph, i) * 8 * skala + Math.sin(frame / 25 + ph) * 3 * skala;
        const top: P = [hx + w, hy - h];
        return (
          <g key={i}>
            <Strich punkte={[[hx, hy], [hx + w * 0.4, hy - h * 0.5], top]} breite={2.4 * skala} farbe={i % 3 ? "#3f7a3a" : "#6aa84f"} seed={seed + "h" + i} zittern={0.3} opts={{ thinning: 0.5 }} />
            {bl ? (
              <g>
                {[0, 1, 2, 3, 4].map((k) => {
                  const a = (k / 5) * Math.PI * 2 + ph;
                  return <ellipse key={k} cx={top[0] + Math.cos(a) * 5 * skala} cy={top[1] + Math.sin(a) * 5 * skala} rx={4.5 * skala} ry={3 * skala} transform={`rotate(${(a * 180) / Math.PI} ${top[0] + Math.cos(a) * 5 * skala} ${top[1] + Math.sin(a) * 5 * skala})`} fill={f} opacity={0.92} />;
                })}
                <circle cx={top[0]} cy={top[1]} r={2.6 * skala} fill="#f2b84b" />
              </g>
            ) : null}
          </g>
        );
      })}
    </g>
  );
};
const waehle2 = <T,>(r: () => number, arr: readonly T[]) => arr[Math.floor(r() * arr.length)];
