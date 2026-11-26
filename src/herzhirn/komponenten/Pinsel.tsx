import React from "react";
import { getStroke } from "perfect-freehand";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { kurve, lasurPfade, LasurOpt, P } from "../lib/aquarell";
import { gauss, rng } from "../lib/zufall";

// ---------------------------------------------------------------------------
// Lasur: Aquarell-Fläche aus vielen transparenten Schichten + dunklerer Pigmentkante
// ---------------------------------------------------------------------------
export const Lasur: React.FC<
  LasurOpt & {
    form: P[];
    farbe: string;
    deckung?: number; // Gesamtdeckung 0..1
    kante?: string | false; // Farbe der Pigmentkante
    blend?: React.CSSProperties["mixBlendMode"];
  }
> = ({ form, farbe, deckung = 0.85, kante, blend, ...o }) => {
  const schichten = lasurPfade(form, o);
  // Deckung je Schicht so wählen, dass die Summe ungefähr "deckung" ergibt
  const n = schichten.length;
  const a = 1 - Math.pow(1 - deckung, 1 / n);
  return (
    <g style={blend ? { mixBlendMode: blend } : undefined}>
      {schichten.map((d, i) => (
        <path key={i} d={d} fill={farbe} fillOpacity={a} />
      ))}
      {kante !== false ? (
        <path d={schichten[0]} fill="none" stroke={kante ?? farbe} strokeOpacity={0.35} strokeWidth={1.6} />
      ) : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Strich: Tusche-/Pinsellinie mit Druckverlauf (perfect-freehand) und "Boiling"
// (die Linie wird alle 3 Frames minimal neu gezeichnet – typischer Zeichentrick-Effekt)
// ---------------------------------------------------------------------------
export const strichPfad = (pts: P[], size: number, opts: Partial<Parameters<typeof getStroke>[1]> = {}) => {
  const outline = getStroke(pts, {
    size,
    thinning: 0.62,
    smoothing: 0.6,
    streamline: 0.35,
    simulatePressure: true,
    start: { taper: size * 2.5, cap: true },
    end: { taper: size * 3, cap: true },
    ...opts,
  });
  if (!outline.length) return "";
  let d = `M${outline[0][0].toFixed(1)} ${outline[0][1].toFixed(1)}`;
  for (let i = 1; i < outline.length; i++) {
    const [x0, y0] = outline[i];
    const [x1, y1] = outline[(i + 1) % outline.length];
    d += `Q${x0.toFixed(1)} ${y0.toFixed(1)} ${((x0 + x1) / 2).toFixed(1)} ${((y0 + y1) / 2).toFixed(1)}`;
  }
  return d + "Z";
};

export const Strich: React.FC<{
  punkte: P[];
  breite?: number;
  farbe?: string;
  deckung?: number;
  seed?: string | number;
  zittern?: number; // Amplitude des Boilings in px
  weich?: boolean; // Kurve durch die Punkte legen
  fortschritt?: number; // 0..1 – Strich wird "gezeichnet"
  opts?: Partial<Parameters<typeof getStroke>[1]>;
}> = ({ punkte, breite = 4, farbe = "#3a2418", deckung = 0.9, seed = 0, zittern = 0.8, weich = true, fortschritt = 1, opts }) => {
  const frame = useCurrentFrame();
  const phase = Math.floor(frame / 3); // auf "Dreiern" animiert
  const r = rng(`${seed}-${phase}`);
  let pts = weich ? kurve(punkte, 6) : punkte;
  pts = pts.map(([x, y]) => [x + gauss(r) * zittern * 0.5, y + gauss(r) * zittern * 0.5] as P);
  if (fortschritt < 1) pts = pts.slice(0, Math.max(2, Math.ceil(pts.length * fortschritt)));
  if (fortschritt <= 0) return null;
  return <path d={strichPfad(pts, breite, opts)} fill={farbe} fillOpacity={deckung} />;
};

// ---------------------------------------------------------------------------
// Papier: Aquarellpapier + Pigmentkörnung + leichte Vignette über dem ganzen Bild
// ---------------------------------------------------------------------------
export const Papier: React.FC<{ staerke?: number; vignette?: string }> = ({ staerke = 1, vignette = "rgba(70,30,20,0.35)" }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <Img src={staticFile("herzhirn/texturen/koernung.png")} style={{ position: "absolute", width: "100%", height: "100%", mixBlendMode: "soft-light", opacity: 0.55 * staerke }} />
    <Img src={staticFile("herzhirn/texturen/papier.png")} style={{ position: "absolute", width: "100%", height: "100%", mixBlendMode: "multiply", opacity: 0.9 * staerke }} />
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 70% at 50% 48%, transparent 55%, ${vignette} 100%)`, mixBlendMode: "multiply" }} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// Leuchten: weicher Lichtschein (radialer Verlauf, keine teuren Blur-Filter)
// ---------------------------------------------------------------------------
let glowId = 0;
export const Leuchten: React.FC<{ x: number; y: number; r: number; farbe: string; staerke?: number; ry?: number; blend?: React.CSSProperties["mixBlendMode"] }> = ({ x, y, r, farbe, staerke = 1, ry, blend = "screen" }) => {
  const id = React.useMemo(() => `gl${glowId++}`, []);
  return (
    <g style={{ mixBlendMode: blend }}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={farbe} stopOpacity={Math.min(1, staerke)} />
          <stop offset="0.35" stopColor={farbe} stopOpacity={0.45 * staerke} />
          <stop offset="1" stopColor={farbe} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={r} ry={ry ?? r} fill={`url(#${id})`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// Handschrift: Schlüsselwörter, die wie mit Pinsel geschrieben erscheinen
// ---------------------------------------------------------------------------
export const Schriften: React.FC = () => (
  <style>{`
    @font-face { font-family: 'HerzPinsel'; src: url('${staticFile("herzhirn/fonts/CaveatBrush.woff2")}') format('woff2'); }
    @font-face { font-family: 'HerzHand'; src: url('${staticFile("herzhirn/fonts/Caveat-700.woff2")}') format('woff2'); font-weight: 700; }
  `}</style>
);

export const Handschrift: React.FC<{
  text: string;
  x: number;
  y: number;
  groesse?: number;
  farbe?: string;
  drehung?: number;
  fortschritt?: number; // 0..1 – Buchstaben erscheinen nacheinander
  schrift?: "pinsel" | "hand";
  anker?: "start" | "middle" | "end";
  kontur?: string;
}> = ({ text, x, y, groesse = 64, farbe = "#3a2418", drehung = 0, fortschritt = 1, schrift = "pinsel", anker = "middle", kontur }) => {
  const frame = useCurrentFrame();
  const wackel = Math.sin(Math.floor(frame / 3) * 1.7) * 0.25;
  const sichtbar = Math.ceil(text.length * Math.max(0, Math.min(1, fortschritt)));
  return (
    <text
      x={x}
      y={y}
      fontFamily={schrift === "pinsel" ? "HerzPinsel" : "HerzHand"}
      fontWeight={schrift === "hand" ? 700 : 400}
      fontSize={groesse}
      fill={farbe}
      textAnchor={anker}
      transform={`rotate(${drehung + wackel} ${x} ${y})`}
      style={kontur ? { paintOrder: "stroke", stroke: kontur, strokeWidth: groesse * 0.12, strokeLinejoin: "round" } : undefined}
    >
      {text.split("").map((c, i) => (
        <tspan key={i} opacity={i < sichtbar ? 1 : 0}>
          {c}
        </tspan>
      ))}
    </text>
  );
};
