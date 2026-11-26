// Hirnscanner-Studie, Körperreaktionen (Herz + Schmetterlinge), schlaflose Nacht (3:12).
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { Handschrift, Lasur, Leuchten, Papier, Schriften, Strich } from "../../../../src/herzhirn/komponenten/Pinsel";
import { Lichterkette, Staub, Topfpflanze } from "../../../../src/herzhirn/komponenten/Natur";
import { Mika, MIKA_FARBEN, POSEN } from "../../../../src/herzhirn/figuren/Mika";
import { klecks, kurve, P, viereck } from "../../../../src/herzhirn/lib/aquarell";
import { fbm1, rng } from "../../../../src/herzhirn/lib/zufall";

const T = "#2e1d17";
const ip = (f: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(f, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

// Gemaltes Gehirn in Seitenansicht mit Windungen; Regionen können golden aufleuchten
export const GehirnSeite: React.FC<{ x: number; y: number; s: number; leuchten: number }> = ({ x, y, s, leuchten }) => {
  const frame = useCurrentFrame();
  const umriss: P[] = kurve([[-300, 40], [-320, -80], [-240, -200], [-80, -250], [100, -240], [250, -170], [320, -40], [290, 80], [200, 120], [120, 110], [60, 170], [-20, 150], [-140, 140], [-260, 120], [-300, 40]], 5);
  const r = rng("windungen");
  const puls = 0.85 + 0.15 * Math.sin(frame / 6);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Lasur form={umriss} farbe="#f0a8a8" deckung={1} seed="hirn" schichten={7} streuung={0.3} kante="#8a3a4a" />
      <Lasur form={klecks(60, -60, 200, 120, "hirnL", 10, 0.2)} farbe="#ffd0c0" deckung={0.45} seed="hirnL" schichten={5} kante={false} />
      {/* Kleinhirn + Stamm */}
      <Lasur form={klecks(200, 140, 90, 50, "klein", 10, 0.1)} farbe="#e08a9a" deckung={1} seed="klein" schichten={4} kante="#8a3a4a" />
      <Strich punkte={[[100, 120], [110, 220], [100, 300]]} breite={46} farbe="#e8a0a0" seed="stamm" opts={{ thinning: 0.2 }} />
      {Array.from({ length: 22 }).map((_, i) => {
        const x0 = -260 + r() * 500;
        const y0 = -200 + r() * 280;
        const pts: P[] = Array.from({ length: 6 }, (_, k) => [x0 + k * 16 + Math.sin(k + i) * 10, y0 + Math.cos(k * 1.3 + i) * 18] as P);
        return <Strich key={i} punkte={pts} breite={5} farbe="#a84a5a" deckung={0.55} seed={"wd" + i} zittern={0.5} />;
      })}
      {/* Belohnungs-Regionen (tief innen) */}
      {[[0, 40, 70], [-60, 0, 50], [70, 80, 40]].map(([rx, ry, rr], i) => (
        <g key={i} opacity={leuchten * puls}>
          <Leuchten x={rx} y={ry} r={rr * 3.2} farbe="#ffc23a" staerke={1} />
          <Lasur form={klecks(rx, ry, rr, rr * 0.7, "reg" + i, 9, 0.12)} farbe="#ffd860" deckung={0.9} seed={"reg" + i} schichten={4} kante="#c07a10" />
        </g>
      ))}
    </g>
  );
};

export const Scanner: React.FC<{ dauer?: number; nah?: boolean }> = ({ dauer = 150, nah = false }) => {
  const frame = useCurrentFrame();
  const z = nah ? ip(frame, [0, dauer], [2.0, 2.25]) : ip(frame, [0, dauer], [1, 1.1]);
  const leuchten = nah ? ip(frame, [6, 30], [0, 1]) : 0;
  const F = MIKA_FARBEN;
  return (
    <AbsoluteFill style={{ background: "#f6e2c8" }}>
      <Schriften />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <g transform={nah ? `translate(960 560) scale(${z}) translate(-1480 -440)` : `translate(960 560) scale(${z}) translate(-960 -560)`}>
          {/* Raum: warme Wand, Fenster mit Grün */}
          <Lasur form={klecks(960, 400, 1200, 520, "swand", 12, 0.1)} farbe="#9fd3c7" deckung={0.55} seed="swand" schichten={8} streuung={0.8} kante={false} />
          <Lasur form={klecks(300, 300, 300, 200, "sw2", 12, 0.2)} farbe="#f2b38a" deckung={0.3} seed="sw2" schichten={6} kante={false} />
          <Topfpflanze x={140} y={880} groesse={1.6} seed="spf" />
          {/* Scanner: Gehäuse + Röhre mit Tiefe */}
          <Lasur form={klecks(640, 540, 380, 400, "gehaeuseS", 14, 0.03)} farbe="#f3ece0" deckung={1} seed="gehaeuseS" schichten={5} streuung={0.3} kante={T} />
          <Lasur form={klecks(880, 560, 110, 300, "seiteS", 10, 0.08)} farbe="#c9bfb0" deckung={0.5} seed="seiteS" schichten={4} kante={false} />
          <Lasur form={klecks(640, 540, 230, 250, "roehre", 16, 0.02)} farbe="#2f5a6a" deckung={1} seed="roehre" schichten={4} kante={T} />
          <Lasur form={klecks(660, 540, 170, 190, "roehreI", 16, 0.02)} farbe="#4f8a9a" deckung={1} seed="roehreI" schichten={3} kante={false} />
          <Leuchten x={660} y={540} r={200} farbe="#bff0ff" staerke={0.55} />
          <Strich punkte={[[640, 300], [520, 380], [470, 540], [520, 700], [640, 780]]} breite={10} farbe="#9fd3c7" deckung={0.6} seed="ringlicht" />
          {/* Liege mit Person */}
          <Lasur form={viereck([[560, 600], [1350, 590], [1362, 640], [556, 652]], "liege", 3)} farbe="#e8e0d6" deckung={1} seed="liege" schichten={4} kante={T} />
          <Strich punkte={[[1300, 650], [1310, 880]]} breite={22} farbe="#a8a090" seed="liegeBein" />
          <Lasur form={kurve([[700, 596], [1240, 572], [1290, 600], [700, 612], [700, 596]], 3)} farbe="#5d7fb8" deckung={1} seed="deckeS" schichten={3} kante={T} />
          <Lasur form={kurve([[1250, 560], [1290, 556], [1300, 596], [1252, 600], [1250, 560]], 3)} farbe={F.schuh} deckung={1} seed="fuesse" schichten={2} kante={T} />
          <Lasur form={klecks(640, 570, 46, 36, "kopfS", 9, 0.06)} farbe={F.haar} deckung={1} seed="kopfS" schichten={3} kante={false} />
          {/* Bildschirm mit Gehirn */}
          <Lasur form={viereck([[1180, 140], [1780, 130], [1790, 520], [1176, 532]], "monitor", 3)} farbe="#2a2a3a" deckung={1} seed="monitor" schichten={4} kante={T} />
          <GehirnSeite x={1480} y={350} s={0.62} leuchten={leuchten} />
          <Strich punkte={[[1480, 532], [1470, 600]]} breite={14} farbe="#3a3a4a" seed="fuss" />
          <Handschrift text="frisch verliebt" x={1480} y={110} groesse={56} farbe="#4a2240" drehung={-3} fortschritt={ip(frame, [10, 34], [0, 1], Easing.linear)} />
          <Handschrift text="Helen Fisher" x={560} y={940} groesse={62} farbe="#7a2e22" drehung={-2} fortschritt={ip(frame, [4, 26], [0, 1], Easing.linear)} />
          <g opacity={leuchten}>
            <Handschrift text="Verlangen" x={1500} y={640} groesse={70} farbe="#c07a10" drehung={-4} kontur="#fff3d6" />
            <Strich punkte={[[1500, 580], [1490, 470], [1470, 400]]} breite={6} farbe="#c07a10" seed="vpfeil" fortschritt={leuchten} />
          </g>
        </g>
      </svg>
      <Papier />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Körper: Herz pocht schneller, Schmetterlinge flattern im Magen
// ---------------------------------------------------------------------------
const Schmetterling: React.FC<{ x: number; y: number; s: number; phase: number; farbe: string; seed: string }> = ({ x, y, s, phase, farbe, seed }) => {
  const fl = Math.abs(Math.sin(phase));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g transform={`scale(${0.25 + fl * 0.75} 1)`}>
        <Lasur form={kurve([[0, 0], [-26, -30], [-46, -20], [-40, 6], [0, 0]], 3)} farbe={farbe} deckung={0.95} seed={seed + "a"} schichten={2} kante={T} />
        <Lasur form={kurve([[0, 0], [26, -30], [46, -20], [40, 6], [0, 0]], 3)} farbe={farbe} deckung={0.95} seed={seed + "b"} schichten={2} kante={T} />
        <Lasur form={kurve([[0, 2], [-30, 24], [-16, 36], [0, 4]], 3)} farbe={farbe} deckung={0.8} seed={seed + "c"} schichten={2} kante={T} />
        <Lasur form={kurve([[0, 2], [30, 24], [16, 36], [0, 4]], 3)} farbe={farbe} deckung={0.8} seed={seed + "d"} schichten={2} kante={T} />
      </g>
      <Strich punkte={[[0, -14], [0, 22]]} breite={5} farbe={T} seed={seed + "k"} />
    </g>
  );
};

export const Koerper: React.FC<{ dauer?: number }> = ({ dauer = 150 }) => {
  const frame = useCurrentFrame();
  const F = MIKA_FARBEN;
  const bpm = ip(frame, [0, dauer * 0.5], [70, 120]);
  const t = (frame / 30) * (bpm / 60);
  const schlag = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2)), 6) + 0.6 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 - 0.9)), 6);
  const vib = Math.floor(frame / 45) % 2 === 0 && frame % 45 < 12 ? Math.sin(frame * 3) * 4 : 0;
  const z = ip(frame, [0, dauer], [1, 1.07]);
  return (
    <AbsoluteFill style={{ background: "#5e3a6a" }}>
      <Schriften />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <defs>
          <radialGradient id="kgrund">
            <stop offset="0" stopColor="#d9707a" />
            <stop offset="1" stopColor="#5e3a6a" />
          </radialGradient>
        </defs>
        <rect x={0} y={0} width={1920} height={1080} fill="url(#kgrund)" />
        <g transform={`translate(960 560) scale(${z}) translate(-960 -560)`}>
          {/* Mika als halbtransparente Aquarell-Silhouette */}
          <g opacity={0.55}>
            <Mika x={960} y={1110} skala={1.9} pose={POSEN.stehtHandy} mimik="nervoes" handy handyLicht={0.6} seed="mika" ohneBeine />
          </g>
          {/* Herz: organischer, warm leuchtender Muskel */}
          <g transform={`translate(${910 + vib} 850) scale(${1 + schlag * 0.18})`}>
            <Leuchten x={0} y={0} r={240} farbe="#ff8a7a" staerke={0.5 + schlag * 0.5} />
            <Lasur form={kurve([[0, 80], [-80, 10], [-90, -50], [-50, -84], [-10, -60], [10, -80], [60, -88], [92, -40], [78, 20], [0, 80]], 5)} farbe="#c8323f" deckung={1} seed="muskel" schichten={7} streuung={0.3} kante="#6a1020" />
            <Lasur form={klecks(-30, -30, 40, 30, "mlicht", 8, 0.2)} farbe="#ff9a8a" deckung={0.5} seed="mlicht" schichten={3} kante={false} />
            <Strich punkte={[[-20, -70], [-24, -120], [-4, -150]]} breite={22} farbe="#a8283a" seed="aorta" />
            <Strich punkte={[[30, -76], [44, -130]]} breite={18} farbe="#5a6ab8" seed="vene" />
            <Strich punkte={[[-50, -10], [-10, 20], [40, 0]]} breite={4} farbe="#7a1828" deckung={0.6} seed="kranz" />
          </g>
          <Handschrift text="Herz" x={740} y={760} groesse={70} farbe="#fff3d6" drehung={-6} kontur="#6a1020" fortschritt={ip(frame, [8, 26], [0, 1], Easing.linear)} />
          <Handschrift text={`${Math.round(bpm)}`} x={1100} y={760} groesse={54} farbe="#ffd27a" drehung={4} schrift="hand" />
          {/* Magen mit Schmetterlingen */}
          <g opacity={ip(frame, [dauer * 0.35, dauer * 0.5], [0, 1])}>
            <Lasur form={kurve([[860, 1000], [980, 960], [1080, 990], [1060, 1080], [900, 1090], [860, 1000]], 4)} farbe="#e88a6a" deckung={0.8} seed="magen" schichten={4} kante="#8a3a2a" />
            {Array.from({ length: 7 }).map((_, i) => {
              const r = rng("sm" + i);
              const px = 900 + r() * 180 + Math.sin(frame / (8 + i) + i) * 40;
              const py = 980 + r() * 70 + Math.cos(frame / (7 + i) + i * 2) * 30;
              return <Schmetterling key={i} x={px} y={py} s={0.7 + r() * 0.4} phase={frame * 0.7 + i} farbe={["#f2b84b", "#9fd3c7", "#e9a8a0", "#c7b3e0"][i % 4]} seed={"sm" + i} />;
            })}
            <Handschrift text="Magen" x={1150} y={960} groesse={64} farbe="#fff3d6" drehung={-4} kontur="#6a2a2a" />
          </g>
        </g>
      </svg>
      <Papier vignette="rgba(40,10,40,0.5)" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Nacht: Mika wälzt sich im Bett, Uhr springt auf 3:12
// ---------------------------------------------------------------------------
export const Bett: React.FC<{ dauer?: number }> = ({ dauer = 120 }) => {
  const frame = useCurrentFrame();
  const F = MIKA_FARBEN;
  const waelz = Math.sin(frame / 22) * 10 + (frame > dauer * 0.5 ? Math.sin(frame / 9) * 6 : 0);
  const zeit = frame < dauer * 0.35 ? "1:47" : frame < dauer * 0.65 ? "2:38" : "3:12";
  const z = ip(frame, [0, dauer], [1.05, 1.15]);
  return (
    <AbsoluteFill style={{ background: "#4a3062" }}>
      <Schriften />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <defs>
          <linearGradient id="nachtW" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5a3a72" />
            <stop offset="1" stopColor="#9a5a7a" />
          </linearGradient>
        </defs>
        <g transform={`translate(960 600) scale(${z}) translate(-960 -600)`}>
          <rect x={-100} y={-100} width={2120} height={1300} fill="url(#nachtW)" />
          <Lichterkette von={[-40, 120]} bis={[1960, 90]} durchhang={110} birnen={20} seed="blk" helligkeit={0.6} />
          {/* Mondlicht-Fleck */}
          <Lasur form={kurve([[1200, 200], [1600, 180], [1700, 700], [1250, 760], [1200, 200]], 4)} farbe="#bcd8f0" deckung={0.18} seed="mondfleck" schichten={5} kante={false} />
          {/* Bett von oben schräg */}
          <Lasur form={kurve([[300, 400], [1500, 380], [1560, 1100], [260, 1120], [300, 400]], 5)} farbe="#f1dcc4" deckung={1} seed="laken" schichten={6} streuung={0.3} kante={T} />
          <Lasur form={klecks(560, 470, 220, 110, "kissenB", 12, 0.08)} farbe="#f6e8d6" deckung={1} seed="kissenB" schichten={5} kante={T} />
          {/* Mika liegt (gedreht), Kopf auf dem Kissen */}
          <g transform={`rotate(${-80 + waelz} 600 520)`}>
            <Mika x={600} y={820} skala={0.9} pose={{ ...POSEN.stehen, blick: [0.4, -0.6] }} mimik="erschoepft" seed="mika" />
          </g>
          {/* Decke, verknautscht, bewegt sich mit */}
          <Lasur form={kurve([[700 + waelz * 2, 400], [1400, 420 + waelz], [1500, 1000], [760, 1060], [640 + waelz, 700], [700 + waelz * 2, 400]], 5)} farbe="#2f8a86" deckung={0.97} seed="deckeB" schichten={6} streuung={0.5} kante="#1d4f4c" />
          {Array.from({ length: 5 }).map((_, i) => <Strich key={i} punkte={[[760 + i * 140, 430 + waelz], [800 + i * 140, 700], [780 + i * 140, 1020]]} breite={6} farbe={i % 2 ? "#f2c36b" : "#e9806a"} deckung={0.8} seed={"dmB" + i} />)}
          {/* Nachttisch mit Wecker */}
          <Lasur form={viereck([[1560, 560], [1860, 552], [1870, 800], [1556, 808]], "nt", 3)} farbe="#8a4a3a" deckung={1} seed="nt" schichten={4} kante={T} />
          <Lasur form={kurve([[1620, 430], [1800, 424], [1808, 560], [1616, 564], [1620, 430]], 4)} farbe="#2a2330" deckung={1} seed="wecker" schichten={3} kante={T} />
          <Leuchten x={1712} y={494} r={160} ry={90} farbe="#ff8a6a" staerke={0.6} />
          <Handschrift text={zeit} x={1712} y={524} groesse={86} farbe="#ffb08a" schrift="hand" />
          {/* Handy auf dem Kissen leuchtet kurz */}
          <g opacity={Math.floor(frame / 50) % 2 === 0 ? 1 : 0.3}>
            <Lasur form={kurve([[380, 560], [440, 556], [442, 650], [382, 654], [380, 560]], 3)} farbe="#cfefff" deckung={1} seed="hk" schichten={2} kante={T} />
            <Leuchten x={410} y={600} r={120} farbe="#bfe6ff" staerke={0.5} />
          </g>
        </g>
        <Staub seed="bstaub" bereich={[1100, 150, 700, 700]} anzahl={25} farbe="#dfeeff" />
      </svg>
      <Papier vignette="rgba(30,10,40,0.55)" />
    </AbsoluteFill>
  );
};
