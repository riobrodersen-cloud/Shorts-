// Häuser, Fahrrad, Passanten, Wäscheleine – alles handgezeichnet und leicht schief.
import React from "react";
import { useCurrentFrame } from "remotion";
import { klecks, kurve, P, viereck } from "../lib/aquarell";
import { fbm1, gauss, rng, waehle, zwischen } from "../lib/zufall";
import { Lasur, Leuchten, Strich } from "./Pinsel";
import { Topfpflanze } from "./Natur";

const T = "#2e1d17";

export const HAUS_FARBEN = ["#f2b38a", "#f4d58d", "#9fd3c7", "#e98b7a", "#f6e6c8", "#c7b3e0", "#f0a868"];
export const DACH_FARBEN = ["#b3503e", "#8a4a5a", "#c0643a", "#5d7f8a", "#a3452e"];

export const Haus: React.FC<{
  x: number; // Mitte unten
  y: number;
  b: number;
  h: number;
  seed: string;
  farbe?: string;
  dach?: string;
  schief?: number; // Neigung oben in px
  stockwerke?: number;
  spalten?: number;
  balkon?: boolean;
  licht?: number; // -1 Sonne von links, 1 von rechts
  abend?: number; // 0..1 warmes Fensterlicht
  detail?: number; // 0..1 (weit entfernte Häuser einfacher)
}> = ({ x, y, b, h, seed, farbe, dach, schief, stockwerke, spalten, balkon, licht = -1, abend = 0.2, detail = 1 }) => {
  const frame = useCurrentFrame();
  const r = rng(seed);
  const F = farbe ?? waehle(r, HAUS_FARBEN);
  const D = dach ?? waehle(r, DACH_FARBEN);
  const sch = schief ?? gauss(r) * b * 0.03;
  const st = stockwerke ?? Math.max(1, Math.round(h / (b * 0.42)));
  const sp = spalten ?? Math.max(1, Math.round(b / (h / st) / 0.9));
  const l = x - b / 2;
  const rr = x + b / 2;
  const top = y - h;
  const s = b / 300; // Strichskala

  const fassade = viereck([[l + sch, top], [rr + sch, top + gauss(r) * 2 * s], [rr, y], [l, y]], seed + "f", 2.5 * s);
  const dachH = h * zwischen(r, 0.28, 0.42);
  const spitze = x + sch + gauss(r) * b * 0.06;
  const ueber = b * 0.08;
  const dachForm: P[] = [[l + sch - ueber, top + 6 * s], [spitze - b * 0.08, top - dachH], [spitze + b * 0.1, top - dachH * 0.97], [rr + sch + ueber, top + 6 * s], [rr + sch + ueber * 0.6, top + 16 * s], [l + sch - ueber * 0.6, top + 16 * s]];
  const kamin = r() > 0.4;
  const kx = spitze + b * (r() > 0.5 ? 0.18 : -0.22);

  const fenster: React.ReactNode[] = [];
  const zh = h / st;
  const zb = b / sp;
  for (let j = 0; j < st; j++) {
    for (let i = 0; i < sp; i++) {
      const tuerHier = j === st - 1 && i === Math.floor(sp / 2) && detail > 0.3;
      const cx = l + zb * (i + 0.5) + sch * (1 - (j + 0.5) / st);
      const cy = top + zh * (j + 0.5);
      if (tuerHier) {
        const tw = zb * 0.42;
        const th = zh * 0.78;
        fenster.push(
          <g key={`t${j}${i}`}>
            <Lasur form={kurve([[cx - tw / 2, y], [cx - tw / 2, y - th * 0.75], [cx, y - th], [cx + tw / 2, y - th * 0.75], [cx + tw / 2, y]], 4)} farbe={waehle(r, ["#2f8a86", "#6a4c93", "#c0643a", "#3d6b9a"])} deckung={1} seed={`${seed}t`} schichten={3} streuung={0.2} kante={T} />
            <circle cx={cx + tw * 0.28} cy={y - th * 0.4} r={2.5 * s + 1} fill="#f2d27a" />
            {detail > 0.6 ? <Topfpflanze x={cx + tw * 0.85} y={y - 14 * s} groesse={0.28 * s} seed={seed + "tp"} /> : null}
          </g>,
        );
        continue;
      }
      const fw = zb * zwischen(r, 0.42, 0.52);
      const fh = zh * zwischen(r, 0.48, 0.58);
      const ecken: [P, P, P, P] = [[cx - fw / 2, cy - fh / 2], [cx + fw / 2, cy - fh / 2 + gauss(r) * s], [cx + fw / 2, cy + fh / 2], [cx - fw / 2, cy + fh / 2]];
      const warm = r() < abend;
      const flimmer = warm ? 0.8 + 0.2 * fbm1(frame / 30 + i + j * 3, i + j) : 1;
      fenster.push(
        <g key={`f${j}${i}`}>
          <Lasur form={viereck([[ecken[0][0] - 5 * s, ecken[0][1] - 5 * s], [ecken[1][0] + 5 * s, ecken[1][1] - 5 * s], [ecken[2][0] + 5 * s, ecken[2][1] + 5 * s], [ecken[3][0] - 5 * s, ecken[3][1] + 5 * s]], seed + "fr" + i + j, 1.2 * s)} farbe="#fbf1df" deckung={1} seed={seed + "fr" + i + j} schichten={2} streuung={0.2} kante={T} />
          <Lasur form={viereck(ecken, seed + "gl" + i + j, 1 * s)} farbe={warm ? "#ffcf7a" : licht < 0 ? "#7fb8c4" : "#9cc7d0"} deckung={flimmer} seed={seed + "gl" + i + j} schichten={2} streuung={0.2} kante={false} />
          {!warm ? <Strich punkte={[[ecken[0][0] + fw * 0.15, ecken[0][1] + fh * 0.7], [ecken[0][0] + fw * 0.55, ecken[0][1] + fh * 0.15]]} breite={3 * s + 1} farbe="#eaf8ff" deckung={0.6} seed={seed + "sp" + i + j} /> : <Leuchten x={cx} y={cy} r={fw * 1.2} farbe="#ffc56a" staerke={0.35} />}
          {detail > 0.5 ? <Strich punkte={[[cx, cy - fh / 2], [cx, cy + fh / 2]]} breite={2.6 * s + 0.6} farbe="#fbf1df" seed={seed + "kr" + i + j} opts={{ thinning: 0.1 }} /> : null}
          {detail > 0.5 && r() > 0.55 ? (
            <Lasur form={kurve([[ecken[0][0], ecken[0][1]], [ecken[0][0] + fw * 0.35, ecken[0][1]], [ecken[0][0] + fw * 0.2, ecken[3][1]], [ecken[0][0], ecken[3][1]], [ecken[0][0], ecken[0][1]]], 3)} farbe={waehle(r, ["#e86a52", "#f6e6c8", "#f2b84b"])} deckung={0.85} seed={seed + "vh" + i + j} schichten={2} kante={false} />
          ) : null}
          {/* Blumenkasten */}
          {detail > 0.5 && r() > 0.5 ? (
            <g>
              <Lasur form={viereck([[cx - fw * 0.6, cy + fh / 2 + 4 * s], [cx + fw * 0.6, cy + fh / 2 + 4 * s], [cx + fw * 0.55, cy + fh / 2 + 16 * s], [cx - fw * 0.55, cy + fh / 2 + 16 * s]], seed + "bk" + i + j, 1)} farbe="#a3452e" deckung={1} seed={seed + "bk" + i + j} schichten={2} kante={T} />
              {Array.from({ length: 6 }).map((_, k) => (
                <circle key={k} cx={cx - fw * 0.5 + (k / 5) * fw} cy={cy + fh / 2 + 2 * s - Math.abs(Math.sin(k * 2.3)) * 6 * s} r={(3 + (k % 2) * 2) * s + 0.8} fill={k % 3 === 0 ? "#f6e6c8" : k % 3 === 1 ? "#e9576a" : "#4f9a4f"} />
              ))}
            </g>
          ) : null}
        </g>,
      );
    }
  }

  const balkonJ = st > 1 && (balkon ?? r() > 0.45) && detail > 0.5 ? Math.max(0, st - 2) : -1;
  return (
    <g>
      {/* Fassade */}
      <Lasur form={fassade} farbe={F} deckung={1} seed={seed + "f"} schichten={6} streuung={0.35} kante={T} />
      {/* Schattenseite + gemalte Flecken */}
      <Lasur form={viereck([licht < 0 ? [rr + sch - b * 0.28, top] : [l + sch, top], licht < 0 ? [rr + sch, top] : [l + sch + b * 0.28, top], licht < 0 ? [rr, y] : [l + b * 0.28, y], licht < 0 ? [rr - b * 0.28, y] : [l, y]], seed + "sch", 3 * s)} farbe="#7a3e5a" deckung={0.22} seed={seed + "sch"} schichten={5} streuung={0.8} kante={false} />
      <Lasur form={klecks(x - b * 0.2 * -licht, top + h * 0.3, b * 0.25, h * 0.2, seed + "lf", 9, 0.2)} farbe="#fff1cf" deckung={0.25} seed={seed + "lf"} schichten={4} kante={false} />
      {/* Dachschatten unter der Traufe */}
      <Lasur form={viereck([[l + sch, top], [rr + sch, top], [rr + sch, top + 20 * s], [l + sch, top + 26 * s]], seed + "ts", 2 * s)} farbe="#5a2e3a" deckung={0.3} seed={seed + "ts"} schichten={3} kante={false} />
      {fenster}
      {/* Balkon mit Geländer und Pflanzen */}
      {balkonJ >= 0 ? (
        <g>
          {(() => {
            const by = top + zh * (balkonJ + 1) - zh * 0.12;
            const bl = l + b * 0.12 + sch * 0.4;
            const br = rr - b * 0.12 + sch * 0.4;
            return (
              <g>
                <Lasur form={viereck([[bl - 8 * s, by], [br + 8 * s, by], [br + 4 * s, by + 12 * s], [bl - 4 * s, by + 12 * s]], seed + "bp", 1.5)} farbe="#e9e0d0" deckung={1} seed={seed + "bp"} schichten={3} kante={T} />
                <Strich punkte={[[bl - 6 * s, by - zh * 0.32], [br + 6 * s, by - zh * 0.32]]} breite={3.4 * s + 0.6} farbe={T} deckung={0.85} seed={seed + "gel"} />
                {Array.from({ length: Math.round((br - bl) / (14 * s)) }).map((_, k) => (
                  <Strich key={k} punkte={[[bl + k * 14 * s, by], [bl + k * 14 * s + gauss(r) * s, by - zh * 0.32]]} breite={1.8 * s + 0.4} farbe={T} deckung={0.7} seed={seed + "gs" + k} zittern={0.3} opts={{ thinning: 0.2 }} />
                ))}
                <Topfpflanze x={bl + 22 * s} y={by - 10 * s} groesse={0.3 * s} seed={seed + "bpf1"} />
                <Topfpflanze x={br - 30 * s} y={by - 10 * s} groesse={0.26 * s} seed={seed + "bpf2"} blattFarbe="#6ab36a" topfFarbe="#2f8a86" />
              </g>
            );
          })()}
        </g>
      ) : null}
      {/* Kamin */}
      {kamin ? (
        <g>
          <Lasur form={viereck([[kx - 14 * s, top - dachH * 0.55], [kx + 14 * s, top - dachH * 0.57], [kx + 15 * s, top - dachH * 0.15], [kx - 13 * s, top - dachH * 0.15]], seed + "k", 1.5)} farbe="#8a4a3a" deckung={1} seed={seed + "k"} schichten={3} kante={T} />
        </g>
      ) : null}
      {/* Dach */}
      <Lasur form={kurve([...dachForm, dachForm[0]], 3)} farbe={D} deckung={1} seed={seed + "d"} schichten={6} streuung={0.4} kante={T} />
      {detail > 0.4
        ? Array.from({ length: 4 }).map((_, k) => {
            const u = (k + 1) / 5;
            const yy = top - dachH * (1 - u) + 6 * s;
            const halb = (b / 2 + ueber) * u;
            return <Strich key={k} punkte={[[spitze - halb + 8 * s, yy], [spitze + halb - 8 * s, yy + gauss(r) * 2]]} breite={2.2 * s + 0.4} farbe="#5a2a22" deckung={0.45} seed={seed + "z" + k} />;
          })
        : null}
      <Lasur form={klecks(spitze - b * 0.12 * -licht, top - dachH * 0.6, b * 0.12, dachH * 0.2, seed + "dl", 8, 0.2)} farbe="#ffd6a0" deckung={0.3} seed={seed + "dl"} schichten={3} kante={false} />
    </g>
  );
};

// Wäscheleine zwischen zwei Punkten, Kleidung flattert im Wind
export const Waescheleine: React.FC<{ von: P; bis: P; seed: string; skala?: number }> = ({ von, bis, seed, skala = 1 }) => {
  const frame = useCurrentFrame();
  const r = rng(seed);
  const dh = 30 * skala;
  const pkt = (u: number): P => [von[0] + (bis[0] - von[0]) * u, von[1] + (bis[1] - von[1]) * u + Math.sin(u * Math.PI) * dh];
  const teile = [0.18, 0.34, 0.5, 0.66, 0.82].map((u, i) => ({ u, art: i % 3, farbe: waehle(r, ["#e86a52", "#f6e6c8", "#2f8a86", "#f2b84b", "#c7b3e0", "#5d7fb8"]) }));
  return (
    <g>
      <Strich punkte={Array.from({ length: 10 }, (_, i) => pkt(i / 9))} breite={1.8 * skala + 0.4} farbe={T} deckung={0.8} seed={seed} opts={{ thinning: 0.1 }} />
      {teile.map((t, i) => {
        const [px, py] = pkt(t.u);
        const w = fbm1(frame / 20 + i * 1.3, i) * 14;
        const g = 26 * skala;
        const form: P[] =
          t.art === 0
            ? [[px - g * 0.5, py], [px + g * 0.5, py], [px + g * 0.55 + w * 0.3, py + g * 1.1], [px - g * 0.5 + w * 0.3, py + g * 1.1]]
            : t.art === 1
              ? [[px - g * 0.7, py], [px + g * 0.7, py], [px + g * 0.5 + w * 0.2, py + g * 0.5], [px + g * 0.35 + w * 0.4, py + g * 1.2], [px - g * 0.35 + w * 0.4, py + g * 1.2], [px - g * 0.5 + w * 0.2, py + g * 0.5]]
              : [[px - g * 0.3, py], [px + g * 0.3, py], [px + g * 0.25 + w * 0.5, py + g * 0.9], [px - g * 0.3 + w * 0.5, py + g * 0.9]];
        return (
          <g key={i}>
            <Lasur form={kurve([...form, form[0]], 3)} farbe={t.farbe} deckung={0.95} seed={seed + i} schichten={3} streuung={0.3} kante={T} />
            <Strich punkte={[[px - 3, py - 4], [px - 2, py + 5]]} breite={3} farbe="#8a5a3a" seed={seed + "kl" + i} />
          </g>
        );
      })}
    </g>
  );
};

// Fahrrad mit drehenden Rädern und Kurbel
export const Fahrrad: React.FC<{ x: number; y: number; skala?: number; winkel: number; farbe?: string }> = ({ x, y, skala = 1, winkel, farbe = "#2f8a86" }) => {
  const rad = (cx: number, cy: number, k: string) => {
    const pts: P[] = Array.from({ length: 25 }, (_, i) => [cx + Math.cos((i / 24) * Math.PI * 2) * 92, cy + Math.sin((i / 24) * Math.PI * 2) * 92] as P);
    return (
      <g key={k}>
        <Strich punkte={pts} breite={10} farbe="#2a2228" seed={"reifen" + k} zittern={0.6} opts={{ thinning: 0.15, start: { taper: 0 }, end: { taper: 0 } }} />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = winkel + (i / 8) * Math.PI;
          return <line key={i} x1={cx - Math.cos(a) * 84} y1={cy - Math.sin(a) * 84} x2={cx + Math.cos(a) * 84} y2={cy + Math.sin(a) * 84} stroke="#c9c2b8" strokeWidth={1.6} opacity={0.8} />;
        })}
        <Lasur form={klecks(cx, cy, 9, 9, "nabe" + k, 7, 0.05)} farbe="#6a6470" deckung={1} seed={"nabe" + k} schichten={2} kante={false} />
      </g>
    );
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${skala})`}>
      {rad(-90, 150, "h")}
      {rad(230, 150, "v")}
      {/* Rahmen */}
      <Strich punkte={[[-90, 150], [80, 140], [-6, 6]]} breite={11} farbe={farbe} seed="rahmen1" weich={false} opts={{ thinning: 0.1, start: { taper: 0 }, end: { taper: 0 } }} />
      <Strich punkte={[[80, 140], [196, 20], [-6, 18]]} breite={11} farbe={farbe} seed="rahmen2" weich={false} opts={{ thinning: 0.1, start: { taper: 0 }, end: { taper: 0 } }} />
      <Strich punkte={[[-90, 150], [-6, 18]]} breite={8} farbe={farbe} seed="rahmen3" opts={{ thinning: 0.1, start: { taper: 0 }, end: { taper: 0 } }} />
      <Strich punkte={[[196, 20], [230, 150]]} breite={9} farbe={farbe} seed="gabel" opts={{ thinning: 0.1, start: { taper: 0 }, end: { taper: 0 } }} />
      <Strich punkte={[[196, 20], [186, -40], [160, -50]]} breite={8} farbe="#2a2228" seed="lenker" />
      <Lasur form={klecks(-10, 0, 34, 10, "sattel", 8, 0.06)} farbe="#5a2e22" deckung={1} seed="sattel" schichten={2} kante={T} />
      {/* Korb vorne mit Blumen */}
      <Lasur form={kurve([[198, -34], [262, -36], [254, 12], [204, 14], [198, -34]], 3)} farbe="#c99a5a" deckung={1} seed="korb" schichten={3} kante={T} />
      {[0, 1, 2].map((k) => (
        <Strich key={k} punkte={[[204, -20 + k * 12], [256, -22 + k * 12]]} breite={2} farbe="#8a5a2a" seed={"kb" + k} />
      ))}
      {/* Kurbel */}
      <Strich punkte={[[80 - Math.cos(winkel) * 38, 140 - Math.sin(winkel) * 38], [80 + Math.cos(winkel) * 38, 140 + Math.sin(winkel) * 38]]} breite={6} farbe="#2a2228" seed="kurbel" />
      <Lasur form={klecks(80, 140, 16, 16, "kettenblatt", 8, 0.05)} farbe="#6a6470" deckung={1} seed="kettenblatt" schichten={2} kante={T} />
    </g>
  );
};

// Passant: einfache, gemalte Figur im Hintergrund, die läuft
export const Passant: React.FC<{ x: number; y: number; skala?: number; seed: string; richtung?: 1 | -1; tempo?: number }> = ({ x, y, skala = 1, seed, richtung = 1, tempo = 1 }) => {
  const frame = useCurrentFrame();
  const r = rng(seed);
  const jacke = waehle(r, ["#e86a52", "#2f8a86", "#6a4c93", "#f2b84b", "#5d7fb8"]);
  const haut = waehle(r, ["#f1c7a5", "#c68a62", "#8a5a3e", "#eab48e"]);
  const haar = waehle(r, ["#2a1c19", "#6a3a22", "#d8b26a", "#4a3a30"]);
  const ph = frame * 0.22 * tempo;
  const dx = frame * 0.9 * tempo * richtung;
  const bob = Math.abs(Math.sin(ph)) * 3;
  const schritt = Math.sin(ph) * 14;
  return (
    <g transform={`translate(${x + dx} ${y - bob}) scale(${skala * richtung} ${skala})`}>
      <Lasur form={klecks(0, 4 + bob, 22, 5, seed + "s", 7, 0.1)} farbe="#4a3040" deckung={0.25} seed={seed + "s"} schichten={2} kante={false} />
      <Strich punkte={[[-4, -50], [-4 + schritt, 0]]} breite={9} farbe="#3a3450" seed={seed + "b1"} opts={{ thinning: 0.1 }} />
      <Strich punkte={[[4, -50], [4 - schritt, 0]]} breite={9} farbe="#3a3450" seed={seed + "b2"} opts={{ thinning: 0.1 }} />
      <Lasur form={kurve([[-16, -100], [16, -102], [20, -46], [-18, -44], [-16, -100]], 3)} farbe={jacke} deckung={1} seed={seed + "j"} schichten={3} kante={T} />
      <Strich punkte={[[14, -94], [18 - schritt * 0.6, -56]]} breite={8} farbe={jacke} seed={seed + "a"} />
      <Lasur form={klecks(0, -116, 13, 15, seed + "k", 8, 0.06)} farbe={haut} deckung={1} seed={seed + "k"} schichten={2} kante={T} />
      <Lasur form={klecks(-2, -126, 14, 9, seed + "h", 8, 0.12)} farbe={haar} deckung={1} seed={seed + "h"} schichten={2} kante={false} />
    </g>
  );
};

// Laterne: geschwungener Mast, Glaskopf
export const Laterne: React.FC<{ x: number; y: number; skala?: number; seed: string; an?: number }> = ({ x, y, skala = 1, seed, an = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${skala})`}>
    <Strich punkte={[[0, 0], [-4, -150], [6, -300], [40, -330], [70, -318]]} breite={11} farbe="#2f4a4a" seed={seed} opts={{ thinning: 0.25 }} />
    <Lasur form={klecks(0, 0, 22, 8, seed + "f", 7, 0.1)} farbe="#2f4a4a" deckung={1} seed={seed + "f"} schichten={2} kante={T} />
    <Lasur form={kurve([[56, -318], [86, -318], [92, -286], [50, -286], [56, -318]], 3)} farbe="#f6e6c8" deckung={1} seed={seed + "k"} schichten={3} kante={T} />
    <Lasur form={kurve([[46, -322], [70, -340], [96, -322], [46, -322]], 3)} farbe="#2f4a4a" deckung={1} seed={seed + "d"} schichten={2} kante={T} />
    {an > 0 ? <Leuchten x={70} y={-300} r={90} farbe="#ffd27a" staerke={an} /> : null}
  </g>
);
