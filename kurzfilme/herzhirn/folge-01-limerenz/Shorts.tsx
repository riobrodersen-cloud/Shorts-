// Shorts/TikTok-Zubringer (1080×1920): Ausschnitte aus dem Hauptfilm, fürs Hochformat neu kadriert
// (pro Einstellung eigener Bildausschnitt), Ende ohne Auflösung + Hinweis auf den ganzen Film.
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import zeiten from "./ton/zeiten.json";
import { Film, FPS, schnittliste } from "./Film";
import { Handschrift, Papier, Schriften, Strich } from "../../../src/herzhirn/komponenten/Pinsel";
import { Gluehwuermchen } from "../../../src/herzhirn/komponenten/Natur";

type Z = { id: string; start: number; ende: number };
const Zt = zeiten as { dauer: number; zeilen: Z[]; schaetzung?: boolean };
const zl = (id: string) => Zt.zeilen.find((l) => l.id === id)!;

// Bildmitte (x im 1920er-Raster) je Einstellung fürs Hochformat
const FOKUS: Record<string, number> = {
  "Zimmer – 47×": 1130, "Gesicht im Handylicht": 960, "Auge – goldenes Glitzern": 960, "Innenwelt – Blick ins Tal": 900,
  "Innenwelt – Strudel-Teaser": 905, "Flug durchs Auge": 960, "Dopamin-Flut": 860, "Hirnscanner": 1300,
  "Handy – schreibt …": 968, "Wolke zieht auf": 900, "Wetter + Spielautomat": 1250, "Körper – Herz + Magen": 960, "Nacht – 3:12": 900,
};

const fokusBei = (filmFrame: number) => {
  const l = schnittliste();
  let akt = l[0];
  for (const x of l) if (x.von <= filmFrame) akt = x;
  return FOKUS[akt.name] ?? 960;
};

export type Fenster = { von: number; bis: number }; // Sekunden im Hauptfilm

const Hochkant: React.FC<{ fenster: Fenster[] }> = ({ fenster }) => {
  const f = useCurrentFrame();
  // welche Filmstelle läuft gerade?
  let rest = f;
  let filmFrame = 0;
  for (const w of fenster) {
    const len = Math.round((w.bis - w.von) * FPS);
    if (rest < len) { filmFrame = Math.round(w.von * FPS) + rest; break; }
    rest -= len;
  }
  const s = 1920 / 1080;
  const fx = Math.min(1920 - 540 / s, Math.max(540 / s, fokusBei(filmFrame)));
  const tx = 540 - fx * s;
  let start = 0;
  return (
    <AbsoluteFill style={{ background: "#2a1430", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `translate(${tx}px, 0px) scale(${s})` }}>
        {fenster.map((w, i) => {
          const len = Math.round((w.bis - w.von) * FPS);
          const el = (
            <Sequence key={i} from={start} durationInFrames={len}>
              <Sequence from={-Math.round(w.von * FPS)}>
                <Film />
              </Sequence>
            </Sequence>
          );
          start += len;
          return el;
        })}
      </div>
      {(() => {
        const l = schnittliste();
        const ende = l[1].von;
        if (filmFrame >= ende) return null;
        const n = Math.round(interpolate(filmFrame, [10, ende * 0.75], [39, 47], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
        return (
          <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <Schriften />
            <Handschrift text={`${n}×`} x={540} y={430} groesse={260} farbe="#ffd27a" drehung={-6} kontur="#6d2f3a" />
          </svg>
        );
      })()}
    </AbsoluteFill>
  );
};

// Schlusskarte: kein Auflösen, nur der Hinweis auf den ganzen Film
const Schluss: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#4a2a5e" }}>
      <Schriften />
      <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
        <defs>
          <radialGradient id="sk"><stop offset="0" stopColor="#c9605a" /><stop offset="1" stopColor="#3e1f4a" /></radialGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#sk)" />
        <Gluehwuermchen seed="skg" pfadPunkte={[[100, 1500], [400, 1100], [700, 900], [1000, 500]]} anzahl={60} tempo={0.6} streuung={200} groesse={8} />
        <Handschrift text="Den ganzen Film" x={540} y={860} groesse={120} farbe="#ffe9a0" drehung={-4} kontur="#3a1430" fortschritt={interpolate(f, [0, 18], [0, 1], { extrapolateRight: "clamp" })} />
        <Handschrift text="findest du auf" x={540} y={990} groesse={110} farbe="#ffe9a0" drehung={-4} kontur="#3a1430" fortschritt={interpolate(f, [10, 28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        <Handschrift text="YouTube ♥" x={540} y={1140} groesse={140} farbe="#ff8a7a" drehung={-4} kontur="#3a1430" fortschritt={interpolate(f, [20, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        <Strich punkte={[[260, 1180], [540, 1200], [820, 1170]]} breite={12} farbe="#ff8a7a" seed="sku" fortschritt={interpolate(f, [34, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      </svg>
      <Papier />
    </AbsoluteFill>
  );
};

export const SCHLUSS_SEK = 3.4;
export const SHORT_A: Fenster[] = Zt.schaetzung ? [{ von: 0, bis: 10 }] : [
  { von: 0, bis: zl("hook6").ende + 0.4 }, // Hook
  { von: zl("p1a").start - 0.25, bis: zl("p1e").ende + 0.3 }, // Phase 1
];
export const SHORT_B: Fenster[] = Zt.schaetzung ? [{ von: 0, bis: 10 }] : [
  { von: zl("p2a").start - 0.3, bis: zl("p2j").ende + 0.4 }, // Phase 2
];
export const shortDauer = (fe: Fenster[]) => Math.round((fe.reduce((a, w) => a + (w.bis - w.von), 0) + SCHLUSS_SEK) * FPS);

export const Short: React.FC<{ fenster: Fenster[] }> = ({ fenster }) => {
  const lang = Math.round(fenster.reduce((a, w) => a + (w.bis - w.von), 0) * FPS);
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={lang}>
        <Hochkant fenster={fenster} />
      </Sequence>
      <Sequence from={lang - 6}>
        <Schluss />
        {!Zt.schaetzung ? <Audio src={staticFile("herzhirn/folge01/short-schluss.mp3")} /> : null}
      </Sequence>
    </AbsoluteFill>
  );
};
