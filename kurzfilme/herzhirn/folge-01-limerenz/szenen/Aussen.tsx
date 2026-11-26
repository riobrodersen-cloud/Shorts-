// Außenwelt: Gartenparty (Rückblende), Bus, Titelkarte „Limerenz“.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { Handschrift, Lasur, Leuchten, Papier, Schriften, Strich } from "../../../../src/herzhirn/komponenten/Pinsel";
import { Baum, Blumenbeet, Lichterkette, Staub, Voegel, Wolke, ABEND } from "../../../../src/herzhirn/komponenten/Natur";
import { Haus, Passant } from "../../../../src/herzhirn/komponenten/Stadt";
import { Ebene, Kamera } from "../../../../src/herzhirn/komponenten/Kamera";
import { Mika, MIKA_FARBEN, Mimik, POSEN, Pose } from "../../../../src/herzhirn/figuren/Mika";
import { klecks, kurve, P, viereck } from "../../../../src/herzhirn/lib/aquarell";
import { fbm1, rng } from "../../../../src/herzhirn/lib/zufall";
import { Silhouette } from "./GehirnTal";

const T = "#2e1d17";
const ip = (f: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(f, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

export const Herz: React.FC<{ x: number; y: number; s: number; farbe?: string; seed?: string }> = ({ x, y, s, farbe = "#e9576a", seed = "herz" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Lasur form={kurve([[0, 34], [-38, 2], [-34, -24], [-12, -30], [0, -14], [12, -30], [34, -24], [38, 2], [0, 34]], 5)} farbe={farbe} deckung={1} seed={seed} schichten={4} streuung={0.25} kante="#7a1a2a" />
    <Strich punkte={[[-22, -18], [-28, -4]]} breite={5} farbe="#ffd0d0" deckung={0.8} seed={seed + "gl"} />
  </g>
);

// ---------------------------------------------------------------------------
// Gartenparty bei Abendsonne: Lichterketten zwischen Bäumen, Gäste, Gespräch mit der Person
// ---------------------------------------------------------------------------
export const Party: React.FC<{ dauer?: number; uhr?: number; mimik?: Mimik; herzen?: boolean }> = ({ dauer = 150, uhr = -1, mimik = "aufgeregt", herzen = true }) => {
  const frame = useCurrentFrame();
  const z = ip(frame, [0, dauer], [1.0, 1.1]);
  const px = ip(frame, [0, dauer], [-40, 30]);
  const gest = Math.sin(frame / 9) * 10;
  const mikaPose: Pose = { ...POSEN.stehen, kopfNeig: -4 + Math.sin(frame / 30) * 2, drehung: 0.45, blick: [0.8, -0.1], ellbogen: [[-98, -104], [130, -120]], hand: [[-90, -18], [150 + gest, -190]] };
  return (
    <AbsoluteFill>
      <Schriften />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <defs>
          <linearGradient id="partyHimmel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f29a7a" />
            <stop offset="0.5" stopColor="#ffc987" />
            <stop offset="1" stopColor="#ffe7b0" />
          </linearGradient>
        </defs>
        <Kamera kam={{ x: px, y: 0, zoom: z, fx: 1000, fy: 600 }}>
          <Ebene tiefe={0.05}>
            <rect x={-300} y={-300} width={2520} height={1200} fill="url(#partyHimmel)" />
            <Leuchten x={1500} y={480} r={520} farbe="#fff0b0" staerke={0.9} />
            <Wolke x={500} y={180} b={460} seed="pw1" farbe="#ffe6d0" schatten="#e9907a" tempo={0.12} />
            <Voegel seed="pvg" y={220} anzahl={4} />
          </Ebene>
          <Ebene tiefe={0.3}>
            <Lasur form={kurve([[-300, 640], [200, 580], [700, 610], [1200, 570], [1700, 600], [2200, 580], [2200, 800], [-300, 800]], 5)} farbe="#8aa86a" deckung={0.9} seed="ph1" schichten={6} kante={false} />
            <Haus x={240} y={640} b={300} h={260} seed="ph" farbe="#f6e6c8" abend={0.6} />
            <Baum x={1700} y={640} hoehe={300} seed="pb0" farben={ABEND} bueschel={18} />
          </Ebene>
          <Ebene tiefe={0.6}>
            {/* Rasen */}
            <Lasur form={[[-300, 660], [2200, 650], [2200, 1300], [-300, 1300]]} farbe="#6aa25a" deckung={1} seed="rasen" schichten={6} streuung={0.2} kante={false} />
            <Lasur form={klecks(1100, 760, 900, 120, "rl", 12, 0.2)} farbe="#c8d870" deckung={0.45} seed="rl" schichten={5} kante={false} />
            <Baum x={380} y={760} hoehe={520} seed="pb1" farben={ABEND} bueschel={26} />
            <Baum x={1560} y={770} hoehe={560} seed="pb2" farben={ABEND} bueschel={26} lichtVon={-0.6} />
            <Lichterkette von={[420, 380]} bis={[1000, 330]} durchhang={90} birnen={14} seed="plk1" glanz={0.8} />
            <Lichterkette von={[1000, 330]} bis={[1520, 370]} durchhang={80} birnen={12} seed="plk2" farbe="#ffb36a" glanz={0.8} />
            {/* Tisch mit Gläsern und Limonade */}
            <Lasur form={viereck([[240, 820], [560, 812], [566, 840], [236, 846]], "ptisch", 2)} farbe="#f6e6c8" deckung={1} seed="ptisch" schichten={4} kante={T} />
            <Strich punkte={[[260, 840], [256, 960]]} breite={9} farbe="#8a5a3a" seed="ptb1" />
            <Strich punkte={[[540, 836], [546, 960]]} breite={9} farbe="#8a5a3a" seed="ptb2" />
            <Lasur form={kurve([[300, 760], [340, 758], [344, 816], [302, 818], [300, 760]], 3)} farbe="#ffd06a" deckung={0.8} seed="krug" schichten={3} kante={T} />
            {[400, 440, 480].map((gx, i) => <Lasur key={i} form={kurve([[gx, 784], [gx + 22, 782], [gx + 20, 816], [gx + 2, 818], [gx, 784]], 2)} farbe={i === 1 ? "#f29a7a" : "#ffe08a"} deckung={0.75} seed={"glas" + i} schichten={2} kante={T} />)}
            <Passant x={700} y={800} skala={0.95} seed="gast1" tempo={0} />
            <Passant x={1320} y={790} skala={0.9} seed="gast2" tempo={0} richtung={-1} />
            <Passant x={1420} y={800} skala={0.95} seed="gast3" tempo={0} />
          </Ebene>
          <Ebene tiefe={1}>
            <Mika x={820} y={1000} skala={0.95} pose={mikaPose} mimik={mimik} seed="mika" />
            <Silhouette x={1170} y={1010} s={1.12} />
            {herzen ? [0, 1, 2].map((k) => {
              const t = ((frame + k * 40) % 120) / 120;
              return <g key={k} opacity={Math.sin(t * Math.PI)}><Herz x={980 + Math.sin(t * 6 + k) * 30} y={640 - t * 260} s={0.5 + t * 0.4} seed={"ph" + k} /></g>;
            }) : null}
            <Blumenbeet x={160} y={1050} b={360} seed="pbb" skala={1.2} />
            <Blumenbeet x={1780} y={1060} b={320} seed="pbb2" skala={1.2} />
            <Staub seed="pstaub" bereich={[0, 200, 1920, 800]} anzahl={40} farbe="#fff2c0" />
          </Ebene>
        </Kamera>
        {uhr >= 0 ? (
          <g opacity={ip(frame, [uhr, uhr + 8], [0, 1])}>
            <Lasur form={klecks(1600, 220, 110, 110, "uhr", 14, 0.04)} farbe="#fff6e6" deckung={0.95} seed="uhr" schichten={4} kante={T} />
            <Strich punkte={[[1600, 220], [1600, 150]]} breite={8} farbe={T} seed="z1" />
            <Strich punkte={[[1600, 220], [1600 + Math.cos(ip(frame, [uhr, uhr + 60], [-1.57, 1.57]) ) * 80, 220 + Math.sin(ip(frame, [uhr, uhr + 60], [-1.57, 1.57])) * 80]]} breite={6} farbe="#e86a52" seed="z2" />
            <Handschrift text="20 Min." x={1600} y={390} groesse={70} farbe="#7a2e22" kontur="#fff3d6" fortschritt={ip(frame, [uhr + 6, uhr + 24], [0, 1], Easing.linear)} />
          </g>
        ) : null}
      </svg>
      <Papier vignette="rgba(120,50,40,0.3)" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Bus: Mika starrt aufs Handy, draußen zieht die Stadt vorbei, „online“ -> Herz springt
// ---------------------------------------------------------------------------
export const Bus: React.FC<{ dauer?: number; online?: number; mimik?: Mimik }> = ({ dauer = 150, online = 50, mimik = "sehnsuechtig" }) => {
  const frame = useCurrentFrame();
  const z = ip(frame, [0, dauer], [1.0, 1.08]);
  const ruckel = Math.sin(frame * 0.9) * 1.5 + fbm1(frame / 6, 3) * 2;
  const sprung = frame >= online ? ip(frame, [online, online + 6, online + 16, online + 40], [0, 1.4, 1, 0.9]) : 0;
  const herzY = frame >= online ? ip(frame, [online, online + 10, online + 40], [0, -120, -90]) : 0;
  const v = frame * 9; // Fahrtgeschwindigkeit draußen
  return (
    <AbsoluteFill>
      <Schriften />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <g transform={`translate(960 600) scale(${z}) translate(-960 -600) translate(0 ${ruckel})`}>
          {/* Draußen: Himmel + vorbeiziehende Stadt (drei Ebenen) */}
          <defs>
            <clipPath id="busFenster">
              <path d="M80 150 Q960 120 1840 150 L1850 560 Q960 590 70 560Z" />
            </clipPath>
            <linearGradient id="busHimmel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7fc6c8" />
              <stop offset="1" stopColor="#ffd9a0" />
            </linearGradient>
          </defs>
          <rect x={-100} y={-100} width={2120} height={1300} fill="#e8c49a" />
          <g clipPath="url(#busFenster)">
            <rect x={0} y={100} width={1920} height={500} fill="url(#busHimmel)" />
            <g transform={`translate(${-(v * 0.15) % 1400} 0)`}>
              {[0, 1, 2].map((k) => <Wolke key={k} x={300 + k * 700} y={220} b={360} seed={"bw" + k} tempo={0} />)}
            </g>
            <g transform={`translate(${-((v * 0.5) % 1600)} 0)`}>
              {Array.from({ length: 10 }).map((_, i) => <Haus key={i} x={100 + i * 330} y={560} b={260} h={240 + (i % 3) * 50} seed={"bh" + (i % 5)} detail={0.6} />)}
            </g>
            <g transform={`translate(${-((v * 1.2) % 1800)} 0)`}>
              {Array.from({ length: 6 }).map((_, i) => <Baum key={i} x={200 + i * 600} y={600} hoehe={330} seed={"bb" + (i % 3)} bueschel={14} />)}
            </g>
          </g>
          {/* Fensterrahmen, Wand, Haltestangen */}
          <Strich punkte={[[70, 150], [960, 120], [1850, 150]]} breite={22} farbe="#3f7a78" seed="fr1" opts={{ thinning: 0.1, start: { taper: 0 }, end: { taper: 0 } }} />
          <Strich punkte={[[70, 562], [960, 590], [1850, 560]]} breite={26} farbe="#3f7a78" seed="fr2" opts={{ thinning: 0.1, start: { taper: 0 }, end: { taper: 0 } }} />
          {[620, 1300].map((x, i) => <Strich key={i} punkte={[[x, 130], [x + 4, 360], [x, 580]]} breite={16} farbe="#3f7a78" seed={"steg" + i} opts={{ thinning: 0.1 }} />)}
          <Lasur form={[[-100, 580], [2020, 580], [2020, 1300], [-100, 1300]]} farbe="#d99a6a" deckung={1} seed="buswand" schichten={5} streuung={0.2} kante={false} />
          {/* Sitzbank */}
          <Lasur form={kurve([[380, 640], [1500, 630], [1520, 820], [1460, 860], [400, 870], [360, 820], [380, 640]], 5)} farbe="#2f8a86" deckung={1} seed="bank" schichten={6} streuung={0.3} kante="#1d4f4c" />
          {Array.from({ length: 12 }).map((_, i) => <Strich key={i} punkte={[[420 + i * 90, 660], [430 + i * 90, 840]]} breite={3} farbe="#f2b84b" deckung={0.5} seed={"mu" + i} />)}
          <Strich punkte={[[1700, -50], [1712, 500], [1706, 1100]]} breite={20} farbe="#f2b84b" seed="stange" opts={{ thinning: 0.05, start: { taper: 0 }, end: { taper: 0 } }} />
          {[400, 900, 1400].map((x, i) => {
            const sw = Math.sin(frame / 12 + i) * 8;
            return <g key={i}><Strich punkte={[[x, 60], [x + sw * 0.5, 130]]} breite={4} farbe="#3a3a3a" seed={"gs" + i} /><Lasur form={klecks(x + sw, 150, 22, 26, "griff" + i, 8, 0.05)} farbe="#f2b84b" deckung={1} seed={"griff" + i} schichten={2} kante={T} /></g>;
          })}
          {/* Mitfahrende */}
          <g opacity={0.95}>
            <Passant x={1300} y={960} skala={2.2} seed="mf1" tempo={0} />
            <Passant x={520} y={960} skala={2.1} seed="mf2" tempo={0} richtung={-1} />
          </g>
          <Mika x={930} y={900} skala={1.25} pose={POSEN.sitztBus} mimik={frame >= online ? "staunend" : mimik} handy handyLicht={frame >= online ? 1 : 0.7} kopfhoerer seed="mika" />
          {/* "online" über dem Handy */}
          {frame >= online ? (
            <g opacity={ip(frame, [online, online + 4], [0, 1])}>
              <Lasur form={kurve([[1060, 760], [1290, 752], [1296, 830], [1066, 836], [1060, 760]], 3)} farbe="#fff6e6" deckung={1} seed="onl" schichten={3} kante={T} />
              <Strich punkte={[[1070, 820], [1040, 836], [1020, 850]]} breite={5} farbe={T} seed="onlz" />
              <Handschrift text="online" x={1178} y={810} groesse={56} farbe="#2f9a6a" schrift="hand" />
              <Leuchten x={1178} y={796} r={170} ry={70} farbe="#9ff0c0" staerke={0.6} />
            </g>
          ) : null}
          {/* Herz macht einen Sprung */}
          {sprung > 0 ? (
            <g>
              <Leuchten x={760} y={800 + herzY} r={120 * sprung} farbe="#ffb0a0" staerke={0.7} />
              <Herz x={760} y={800 + herzY} s={1.3 * sprung} seed="busherz" />
              {[0, 1, 2].map((k) => (
                <Strich key={k} punkte={[[760 + Math.cos(-2.4 + k * 0.8) * 80, 800 + herzY + Math.sin(-2.4 + k * 0.8) * 80], [760 + Math.cos(-2.4 + k * 0.8) * 120, 800 + herzY + Math.sin(-2.4 + k * 0.8) * 120]]} breite={6} farbe="#e9576a" seed={"sp" + k} fortschritt={ip(frame, [online + 4, online + 12], [0, 1])} />
              ))}
            </g>
          ) : null}
        </g>
      </svg>
      <Papier vignette="rgba(90,40,40,0.35)" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Titelkarte: „Limerenz“ schreibt sich in eine aufblühende Aquarellwolke
// ---------------------------------------------------------------------------
export const Titel: React.FC<{ teil?: "wort" | "tennov" | "besessen"; dauer?: number }> = ({ teil = "wort", dauer = 120 }) => {
  const frame = useCurrentFrame();
  const bluete = ip(frame, [0, 30], [0.3, 1], Easing.out(Easing.cubic));
  const z = ip(frame, [0, dauer], [1, 1.06]);
  const r = rng("fäden");
  return (
    <AbsoluteFill style={{ background: "#f6ead6" }}>
      <Schriften />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <g transform={`translate(960 520) scale(${z}) translate(-960 -520)`}>
          <g transform={`translate(960 520) scale(${bluete}) translate(-960 -520)`}>
            <Lasur form={klecks(960, 520, 760, 330, "bl1", 14, 0.22)} farbe="#f29a7a" deckung={0.55} seed="bl1" schichten={12} streuung={1.4} kante={false} />
            <Lasur form={klecks(1100, 480, 520, 260, "bl2", 14, 0.22)} farbe="#f6c25a" deckung={0.5} seed="bl2" schichten={10} streuung={1.4} kante={false} />
            <Lasur form={klecks(760, 600, 420, 200, "bl3", 14, 0.22)} farbe="#c97a9a" deckung={0.4} seed="bl3" schichten={10} streuung={1.4} kante={false} />
          </g>
          <Handschrift text="Limerenz" x={960} y={590} groesse={250} farbe="#4a2240" drehung={-4} fortschritt={ip(frame, [6, 36], [0, 1], Easing.linear)} />
          <Strich punkte={[[560, 650], [960, 672], [1380, 630]]} breite={14} farbe="#e86a52" seed="unter" fortschritt={ip(frame, [30, 48], [0, 1])} />
          {teil !== "wort" ? (
            <g opacity={ip(frame, [0, 10], [0, 1])}>
              {/* Buch von Tennov */}
              <g transform={`translate(1460 860) rotate(-8)`}>
                <Lasur form={viereck([[-120, -160], [120, -164], [126, 160], [-118, 164]], "buch", 3)} farbe="#2f8a86" deckung={1} seed="buch" schichten={5} kante={T} />
                <Lasur form={viereck([[-100, -140], [100, -142], [102, -40], [-100, -38]], "buchl", 2)} farbe="#f6e6c8" deckung={1} seed="buchl" schichten={3} kante={false} />
                <Handschrift text="Love and" x={0} y={-104} groesse={34} farbe={T} schrift="hand" />
                <Handschrift text="Limerence" x={0} y={-66} groesse={36} farbe="#e86a52" schrift="hand" />
                <Herz x={0} y={50} s={1.1} seed="buchherz" />
              </g>
              <Handschrift text="Dorothy Tennov · 1979" x={560} y={860} groesse={64} farbe="#7a2e22" drehung={-3} fortschritt={ip(frame, [6, 30], [0, 1], Easing.linear)} />
            </g>
          ) : null}
          {teil === "besessen" ? (
            <g>
              {/* Rote Fäden, die sich um das Wort wickeln */}
              {Array.from({ length: 4 }).map((_, i) => {
                const pts: P[] = Array.from({ length: 12 }, (_, k) => [380 + k * 105, 540 + Math.sin(k * 0.9 + i * 1.6) * (110 + i * 18)] as P);
                return <Strich key={i} punkte={pts} breite={5} farbe="#c0392b" deckung={0.85} seed={"faden" + i} fortschritt={ip(frame, [4 + i * 6, 40 + i * 6], [0, 1])} />;
              })}
              <Handschrift text="≈ Besessenheit" x={960} y={300} groesse={84} farbe="#c0392b" drehung={3} fortschritt={ip(frame, [10, 34], [0, 1], Easing.linear)} kontur="#fff3d6" />
            </g>
          ) : null}
          {void r}
        </g>
      </svg>
      <Papier />
    </AbsoluteFill>
  );
};
