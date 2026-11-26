// Drei ~20-s-Teaser-Shorts (1080×1920): eigener Sprechertext, Bilder aus dem Film (hochkant neu kadriert),
// großer Hook-Text am Anfang, offenes Ende mit Verweis auf den ganzen Film.
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, Easing } from "remotion";
import { FPS, schnittliste } from "./Film";
import { Fenster, Hochkant, Schluss } from "./Shorts";
import { Handschrift, Schriften } from "../../../src/herzhirn/komponenten/Pinsel";
import t1 from "../../../public/herzhirn/folge01/short1.json";
import t2 from "../../../public/herzhirn/folge01/short2.json";
import t3 from "../../../public/herzhirn/folge01/short3.json";

type Zeit = { dauer: number; zeilen: { id: string; start: number; ende: number }[] };
type Teil = { zeile: string; shot: string; versatz?: number; fokus?: number };
export type TeaserDef = { name: string; audio: string; zeit: Zeit; teile: Teil[]; hook: string[]; hookY?: number };

const shotStart = (name: string) => {
  const s = schnittliste().find((x) => x.name === name);
  if (!s) throw new Error("Einstellung fehlt: " + name);
  return s.von / FPS;
};

const ENDE_RUHE = 1.6; // Schlusskarte bleibt nach dem letzten Wort stehen

export const teaserFenster = (d: TeaserDef): { fenster: Fenster[]; schlussAb: number; gesamt: number } => {
  const z = d.zeit.zeilen;
  const fenster: Fenster[] = [];
  d.teile.forEach((t, i) => {
    const a = z.findIndex((l) => l.id === t.zeile);
    const len = (a + 1 < z.length ? z[a + 1].start : d.zeit.dauer) - (i === 0 ? 0 : z[a].start);
    const von = shotStart(t.shot) + (t.versatz ?? 0);
    fenster.push({ von, bis: von + len });
  });
  const schlussAb = z[z.length - 1].start;
  return { fenster, schlussAb, gesamt: d.zeit.dauer + ENDE_RUHE };
};

const Hook: React.FC<{ zeilen: string[]; y: number }> = ({ zeilen, y }) => {
  const f = useCurrentFrame();
  const pop = interpolate(f, [0, 6, 10], [0.6, 1.12, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(2)) });
  const weg = interpolate(f, [70, 82], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const gr = Math.min(150, 1750 / Math.max(...zeilen.map((z) => z.length)));
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: weg }}>
      <Schriften />
      <g transform={`translate(540 ${y}) scale(${pop}) translate(-540 ${-y})`}>
        {zeilen.map((t, i) => (
          <Handschrift key={i} text={t} x={540} y={y + i * gr} groesse={gr} farbe="#fff3d6" drehung={-4} kontur="#3a1430" />
        ))}
      </g>
    </svg>
  );
};

export const Teaser: React.FC<{ def: TeaserDef }> = ({ def }) => {
  const { fenster, schlussAb } = teaserFenster(def);
  const ab = Math.round(schlussAb * FPS);
  return (
    <AbsoluteFill style={{ background: "#2a1430" }}>
      <Sequence durationInFrames={ab + 6}>
        <Hochkant fenster={fenster} stimme={false} fokus={def.teile.map((t) => t.fokus)} />
      </Sequence>
      <Sequence from={ab}>
        <Schluss zeilen={["Den ganzen Film", "findest du auf", "meinem Kanal ♥"]} />
      </Sequence>
      <Sequence durationInFrames={90}>
        <Hook zeilen={def.hook} y={def.hookY ?? 1250} />
      </Sequence>
      <Audio src={staticFile(def.audio)} />
    </AbsoluteFill>
  );
};

export const TEASER: TeaserDef[] = [
  {
    name: "Teaser1", audio: "herzhirn/folge01/short1.mp3", zeit: t1 as Zeit, hook: ["WARUM DU NICHT", "AUFHÖREN KANNST"], hookY: 1450,
    teile: [
      { zeile: "a", shot: "Zimmer – 47×" },
      { zeile: "b", shot: "Gesicht im Handylicht" },
      { zeile: "c", shot: "Auge – goldenes Glitzern" },
      { zeile: "d", shot: "Innenwelt – Blick ins Tal" },
      { zeile: "e", shot: "Innenwelt – Strudel-Teaser" },
    ],
  },
  {
    name: "Teaser2", audio: "herzhirn/folge01/short2.mp3", zeit: t2 as Zeit, hook: ["SIE ANTWORTET", "NUR MANCHMAL?"], hookY: 1180,
    teile: [
      { zeile: "a", shot: "Handy – schreibt …" },
      { zeile: "b", shot: "Dopamin-Flut", versatz: 1.6, fokus: 1240 },
      { zeile: "c", shot: "Wetter + Spielautomat", versatz: 0.3, fokus: 470 },
      { zeile: "d", shot: "Wetter + Spielautomat", versatz: 4.6, fokus: 1420 },
    ],
  },
  {
    name: "Teaser3", audio: "herzhirn/folge01/short3.mp3", zeit: t3 as Zeit, hook: ["DU BIST NICHT", "VERLIEBT?"], hookY: 1450,
    teile: [
      { zeile: "a", shot: "Stille – Gesicht" },
      { zeile: "b", shot: "Hirnscanner", fokus: 1480 },
      { zeile: "c", shot: "Scanner – Regionen leuchten" },
      { zeile: "d", shot: "Gedankenschleife" },
    ],
  },
];
