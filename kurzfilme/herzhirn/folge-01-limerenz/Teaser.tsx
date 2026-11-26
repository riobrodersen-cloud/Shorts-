// Drei poppige Teaser-Shorts (1080×1920, ~18 s): schnelle Schnitte mit Punch-Zoom, große mitlaufende
// Untertitel mit Schlüsselwort, eigener Pop-Beat (scripts/popton.py), offenes Ende mit Verweis auf den Film.
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, Easing } from "remotion";
import { FPS, schnittliste } from "./Film";
import { Fenster, Hochkant, Schluss } from "./Shorts";
import { Handschrift, Schriften } from "../../../src/herzhirn/komponenten/Pinsel";
import t1 from "../../../public/herzhirn/folge01/short1_pop.json";
import t2 from "../../../public/herzhirn/folge01/short2_pop.json";
import t3 from "../../../public/herzhirn/folge01/short3_pop.json";

type Zeit = { dauer: number; zeilen: { id: string; text: string; start: number; ende: number }[] };
// ab = Sekunden nach Zeilenbeginn (für zusätzliche Schnitte mitten im Satz)
type Teil = { zeile: string; ab?: number; shot: string; versatz?: number; fokus?: number };
export type TeaserDef = { name: string; audio: string; zeit: Zeit; teile: Teil[]; stichwort: Record<string, string>; zaehler?: boolean };

const ENDE_RUHE = 0.8;
const shotStart = (name: string) => {
  const s = schnittliste().find((x) => x.name === name);
  if (!s) throw new Error("Einstellung fehlt: " + name);
  return s.von / FPS;
};

export const teaserFenster = (d: TeaserDef) => {
  const z = d.zeit.zeilen;
  const anf = d.teile.map((t, i) => (i === 0 ? 0 : z.find((l) => l.id === t.zeile)!.start + (t.ab ?? 0)));
  const schlussAb = z[z.length - 1].start;
  const fenster: Fenster[] = d.teile.map((t, i) => {
    const len = (i + 1 < anf.length ? anf[i + 1] : schlussAb) - anf[i];
    const von = shotStart(t.shot) + (t.versatz ?? 0);
    return { von, bis: von + len };
  });
  return { fenster, schnitte: anf, schlussAb, gesamt: d.zeit.dauer + ENDE_RUHE };
};

// Untertitel im Shorts-Stil: immer 2–4 Wörter, groß, im Sprechrhythmus; Schlüsselwort farbig
const ERSETZ: [RegExp, string][] = [[/siebenundvierzig Mal/g, "47×"], [/\s*–\s*,?/g, ", "], [/\s+,/g, ","], [/,\s*,/g, ","]];
const Untertitel: React.FC<{ def: TeaserDef }> = ({ def }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const z = def.zeit.zeilen;
  const akt = z.find((l, i) => t >= l.start - 0.05 && t < (i + 1 < z.length ? z[i + 1].start : 999));
  if (!akt || akt === z[z.length - 1]) return null;
  let text = akt.text;
  for (const [r, e] of ERSETZ) text = text.replace(r, e);
  const woerter = text.split(/\s+/).filter(Boolean);
  const stuecke: string[] = [];
  let cur: string[] = [];
  for (const w of woerter) {
    if (cur.length >= 3 || (cur.join(" ").length + w.length > 14 && cur.length > 0)) { stuecke.push(cur.join(" ")); cur = []; }
    cur.push(w);
    if (/[.,?!]$/.test(w) && cur.length >= 2) { stuecke.push(cur.join(" ")); cur = []; }
  }
  if (cur.length) stuecke.push(cur.join(" "));
  // ein einzelnes kurzes Wort am Ende an das vorige Stück hängen
  if (stuecke.length > 1 && stuecke[stuecke.length - 1].split(" ").length === 1 && stuecke[stuecke.length - 1].length <= 7) {
    const l = stuecke.pop()!;
    stuecke[stuecke.length - 1] += " " + l;
  }
  const gesamt = stuecke.reduce((a, x) => a + x.length + 3, 0);
  const dauer = akt.ende - akt.start;
  let acc = akt.start;
  let idx = stuecke.length - 1;
  let beginn = akt.start;
  for (let i = 0; i < stuecke.length; i++) {
    const d = ((stuecke[i].length + 3) / gesamt) * dauer;
    if (t < acc + d) { idx = i; beginn = acc; break; }
    acc += d;
  }
  const stueck = stuecke[idx];
  const seit = (t - beginn) * FPS;
  const pop = interpolate(seit, [0, 3, 6], [0.6, 1.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stich = (def.stichwort[akt.id] ?? "").toLowerCase();
  const hat = stich !== "" && stueck.toLowerCase().includes(stich);
  const gr = Math.min(128, 1500 / Math.max(8, stueck.length));
  const y = 1480;
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <Schriften />
      <g transform={`translate(540 ${y}) scale(${pop}) rotate(${hat ? -4 : -2}) translate(-540 ${-y})`}>
        <Handschrift text={stueck} x={540} y={y} groesse={hat ? gr * 1.12 : gr} farbe={hat ? "#ffd25a" : "#fff8ea"} kontur="#2a1030" />
      </g>
    </svg>
  );
};

export const Teaser: React.FC<{ def: TeaserDef }> = ({ def }) => {
  const f = useCurrentFrame();
  const { fenster, schnitte, schlussAb } = teaserFenster(def);
  const ab = Math.round(schlussAb * FPS);
  // Punch-Zoom: bei jedem Schnitt kurz hineinspringen, dann weich zurück
  const letzter = Math.max(...schnitte.map((s) => Math.round(s * FPS)).filter((s) => s <= f));
  const punch = 1 + 0.07 * Math.exp(-(f - letzter) / 5);
  const blitz = interpolate(f - letzter, [0, 3], [0.35, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#2a1430" }}>
      <Sequence durationInFrames={ab + 4}>
        <AbsoluteFill style={{ transform: `scale(${punch})` }}>
          <Hochkant fenster={fenster} stimme={false} ton={false} zaehler={def.zaehler ?? false} fokus={def.teile.map((t) => t.fokus)} />
        </AbsoluteFill>
        {f > 2 ? <AbsoluteFill style={{ background: "#fff6e0", opacity: blitz }} /> : null}
      </Sequence>
      <Sequence from={ab}>
        <Schluss zeilen={["Ganzer Film", "auf meinem", "Kanal ♥"]} />
      </Sequence>
      <Untertitel def={def} />
      <Audio src={staticFile(def.audio)} />
    </AbsoluteFill>
  );
};

export const TEASER: TeaserDef[] = [
  {
    name: "Teaser1", audio: "herzhirn/folge01/short1_mix.mp3", zeit: t1 as Zeit, zaehler: true,
    stichwort: { a: "Handy", b: "Nachricht", c: "Hoffnung", d: "Programm", e: "gemeinste" },
    teile: [
      { zeile: "a", shot: "Zimmer – 47×" },
      { zeile: "b", shot: "Gesicht im Handylicht" },
      { zeile: "c", shot: "Auge – goldenes Glitzern" },
      { zeile: "d", shot: "Flug durchs Auge", versatz: 0.6 },
      { zeile: "d", ab: 1.6, shot: "Innenwelt – Blick ins Tal", versatz: 1.0 },
      { zeile: "e", shot: "Wetter + Spielautomat", versatz: 5.6, fokus: 1300 },
      { zeile: "e", ab: 1.3, shot: "Innenwelt – Strudel-Teaser", versatz: 0.4 },
    ],
  },
  {
    name: "Teaser2", audio: "herzhirn/folge01/short2_mix.mp3", zeit: t2 as Zeit,
    stichwort: { a: "manchmal", b: "sofort", c: "Vielleicht", d: "Spielautomaten" },
    teile: [
      { zeile: "a", shot: "Handy – schreibt …" },
      { zeile: "a", ab: 2.3, shot: "Bus – online", versatz: 0.9, fokus: 930 },
      { zeile: "b", shot: "Dopamin-Flut", versatz: 1.6, fokus: 1000 },
      { zeile: "c", shot: "Wetter + Spielautomat", versatz: 0.3, fokus: 560 },
      { zeile: "c", ab: 2.0, shot: "Körper – Herz + Magen", versatz: 2.5 },
      { zeile: "d", shot: "Wetter + Spielautomat", versatz: 4.6, fokus: 1420 },
    ],
  },
  {
    name: "Teaser3", audio: "herzhirn/folge01/short3_mix.mp3", zeit: t3 as Zeit,
    stichwort: { a: "nicht", b: "Hirnscanner", c: "Verlangen", d: "wirklich" },
    teile: [
      { zeile: "a", shot: "Stille – Gesicht" },
      { zeile: "a", ab: 1.5, shot: "Kernsatz – ganz nah" },
      { zeile: "b", shot: "Hirnscanner", fokus: 1480 },
      { zeile: "c", shot: "Scanner – Regionen leuchten" },
      { zeile: "d", shot: "Gedankenschleife", versatz: 0.5 },
    ],
  },
];
