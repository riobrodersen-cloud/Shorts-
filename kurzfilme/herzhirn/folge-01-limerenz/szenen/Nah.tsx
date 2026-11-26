// Nahaufnahmen: Mikas Gesicht im Handylicht, das Auge (Übergang in die Innenwelt), das Handy-Display.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { Handschrift, Lasur, Leuchten, Papier, Schriften, Strich } from "../../../../src/herzhirn/komponenten/Pinsel";
import { Staub } from "../../../../src/herzhirn/komponenten/Natur";
import { Mika, MIKA_FARBEN, Mimik, POSEN } from "../../../../src/herzhirn/figuren/Mika";
import { klecks, kurve, P } from "../../../../src/herzhirn/lib/aquarell";
import { fbm1, rng } from "../../../../src/herzhirn/lib/zufall";
import { Silhouette } from "./GehirnTal";

const T = "#2e1d17";
const ip = (f: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(f, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

// Unscharfer Zimmer-Hintergrund mit Lichterketten-Bokeh
export const Bokeh: React.FC<{ tag?: boolean; seed?: string }> = ({ tag = false, seed = "bokeh" }) => {
  const frame = useCurrentFrame();
  const r = rng(seed);
  return (
    <g>
      <defs>
        <linearGradient id={`bk${seed}${tag}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tag ? "#f6c79a" : "#5a3060"} />
          <stop offset="0.6" stopColor={tag ? "#f3a98a" : "#9a4a62"} />
          <stop offset="1" stopColor={tag ? "#ffd9a0" : "#c9705a"} />
        </linearGradient>
        <filter id="weich"><feGaussianBlur stdDeviation="18" /></filter>
      </defs>
      <rect x={-100} y={-100} width={2120} height={1280} fill={`url(#bk${seed}${tag})`} />
      <Leuchten x={1650} y={800} r={420} farbe={tag ? "#9fd07a" : "#3f9a7a"} staerke={0.45} blend="normal" />
      <Leuchten x={260} y={560} r={380} ry={520} farbe={tag ? "#ffb08a" : "#e9785e"} staerke={0.45} blend="normal" />
      <Leuchten x={960} y={980} r={700} ry={260} farbe={tag ? "#ffe0a8" : "#c9605a"} staerke={0.35} blend="normal" />
      {Array.from({ length: 22 }).map((_, i) => {
        const x = r() * 1920;
        const y = 80 + r() * 300 + Math.sin(x / 300) * 60;
        const g = 30 + r() * 40;
        const fl = 0.6 + 0.4 * fbm1(frame / 10 + i, i);
        return <Leuchten key={i} x={x} y={y} r={g} farbe={tag ? "#fff2c0" : "#ffc56a"} staerke={0.7 * fl} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Gesicht nah – im Handylicht (Hook, Stille-Moment) oder im Morgenlicht (Lächeln)
// ---------------------------------------------------------------------------
export const GesichtNah: React.FC<{ mimik?: Mimik; licht?: "handy" | "morgen"; zoomVon?: number; zoomBis?: number; dauer?: number; dunkler?: number }> = ({ mimik = "sehnsuechtig", licht = "handy", zoomVon = 1, zoomBis = 1.08, dauer = 120, dunkler = 0 }) => {
  const frame = useCurrentFrame();
  const z = ip(frame, [0, dauer], [zoomVon, zoomBis]);
  const hl = licht === "handy" ? 0.8 + 0.2 * Math.sin(frame / 14) : 0;
  return (
    <AbsoluteFill>
      <Schriften />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Bokeh tag={licht === "morgen"} />
        {dunkler > 0 ? <rect x={0} y={0} width={1920} height={1080} fill="#2a1430" opacity={dunkler} /> : null}
        <g transform={`translate(960 560) scale(${z}) translate(-960 -560)`}>
          <Mika x={960} y={1500} skala={3.6} pose={{ ...POSEN.sitztHandy, blick: licht === "handy" ? [0.05, 0.8] : [0.2, -0.1], kopfNeig: licht === "handy" ? 5 : -3, ...(licht === "morgen" ? { hand: [[-70, -30], [70, -30]] as [P, P], ellbogen: [[-100, -100], [100, -100]] as [P, P] } : {}) }} mimik={mimik} handy={licht === "handy"} handyLicht={hl} seed="mika" ohneBeine lichtFarbe={licht === "handy" ? "#bfe6ff" : "#ffe2a0"} />
          {licht === "morgen" ? <Leuchten x={1300} y={420} r={700} farbe="#fff0c0" staerke={0.45} /> : null}
        </g>
        <Staub seed="nahstaub" bereich={[0, 0, 1920, 1080]} anzahl={30} farbe={licht === "handy" ? "#cfe8ff" : "#fff2c0"} groesse={3.5} />
      </svg>
      <Papier vignette={licht === "handy" ? "rgba(40,10,40,0.6)" : "rgba(120,60,40,0.3)"} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Auge nah: goldenes Glitzern, dann öffnet sich die Pupille wie ein Himmel
// ---------------------------------------------------------------------------
export const AugeNah: React.FC<{ oeffnen?: boolean; dauer?: number; glitzer?: number }> = ({ oeffnen = false, dauer = 90, glitzer = 1 }) => {
  const frame = useCurrentFrame();
  const F = MIKA_FARBEN;
  const z = ip(frame, [0, dauer], [1, oeffnen ? 1.25 : 1.12]);
  const pupille = oeffnen ? ip(frame, [dauer * 0.25, dauer], [95, 1400], Easing.in(Easing.cubic)) : 95 + Math.sin(frame / 8) * 4;
  const blinzel = 0;
  const cx = 960;
  const cy = 560;
  const r = rng("iris");
  const strahlen = React.useMemo(() => Array.from({ length: 70 }, (_, i) => ({ a: (i / 70) * Math.PI * 2 + r() * 0.05, l: 0.55 + r() * 0.4, f: r() > 0.5 ? "#a8683a" : "#5a3018" })), []);
  return (
    <AbsoluteFill style={{ background: F.haut }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <defs>
          <clipPath id="augeForm">
            <path d={`M${cx - 760} ${cy + 40} Q${cx - 300} ${cy - 430 + blinzel} ${cx + 40} ${cy - 400} Q${cx + 520} ${cy - 360} ${cx + 780} ${cy + 20} Q${cx + 360} ${cy + 400} ${cx - 40} ${cy + 380} Q${cx - 480} ${cy + 340} ${cx - 760} ${cy + 40}Z`} />
          </clipPath>
          <radialGradient id="pupHimmel">
            <stop offset="0" stopColor="#ffc07a" />
            <stop offset="0.5" stopColor="#a8558a" />
            <stop offset="1" stopColor="#3a2250" />
          </radialGradient>
        </defs>
        <g transform={`translate(${cx} ${cy}) scale(${z}) translate(${-cx} ${-cy})`}>
          {/* Haut mit Lasuren */}
          <Lasur form={klecks(cx, cy, 1100, 700, "hautN", 12, 0.1)} farbe="#eab48e" deckung={1} seed="hautN" schichten={5} kante={false} />
          <Lasur form={klecks(cx + 200, cy + 400, 700, 260, "hautS", 12, 0.15)} farbe={F.hautSchatten} deckung={0.35} seed="hautS" schichten={5} kante={false} />
          <Lasur form={klecks(cx - 400, cy + 420, 300, 120, "wangeN", 12, 0.15)} farbe={F.wange} deckung={0.12} seed="wangeN" schichten={4} kante={false} />
          {/* Braue */}
          <Strich punkte={[[cx - 640, cy - 470], [cx - 200, cy - 560], [cx + 300, cy - 560], [cx + 700, cy - 470]]} breite={70} farbe={F.haar} seed="braueN" zittern={1.5} opts={{ start: { taper: 40 }, end: { taper: 160 } }} />
          <g clipPath="url(#augeForm)">
            <rect x={0} y={0} width={1920} height={1080} fill="#fffaf0" />
            <Lasur form={klecks(cx, cy - 300, 800, 160, "augS", 10, 0.1)} farbe="#d8c8c0" deckung={0.5} seed="augS" schichten={4} kante={false} />
            {/* Iris mit Pinsel-Strahlen */}
            <circle cx={cx} cy={cy} r={330} fill="#7a4a2a" />
            {strahlen.map((s, i) => (
              <Strich key={i} punkte={[[cx + Math.cos(s.a) * 110, cy + Math.sin(s.a) * 110], [cx + Math.cos(s.a) * 330 * s.l, cy + Math.sin(s.a) * 330 * s.l]]} breite={10} farbe={s.f} deckung={0.6} seed={"is" + i} zittern={0.6} />
            ))}
            <circle cx={cx} cy={cy} r={330} fill="none" stroke="#2a140a" strokeWidth={22} opacity={0.8} />
            {/* Pupille – wird zum Himmel der Innenwelt */}
            <circle cx={cx} cy={cy} r={pupille} fill={oeffnen && pupille > 200 ? "url(#pupHimmel)" : "#120a07"} />
            {oeffnen && pupille > 200 ? (
              <g opacity={ip(frame, [dauer * 0.45, dauer * 0.7], [0, 1])}>
                {Array.from({ length: 40 }).map((_, i) => {
                  const rr = rng("pst" + i);
                  const a = rr() * Math.PI * 2;
                  const d = rr() * pupille * 0.9;
                  return <circle key={i} cx={cx + Math.cos(a) * d} cy={cy + Math.sin(a) * d} r={2 + rr() * 3} fill="#fff3d6" />;
                })}
              </g>
            ) : null}
            {/* Spiegelung: Handy-Rechteck + Lichtpunkte */}
            <path d={`M${cx + 70} ${cy - 210} L${cx + 160} ${cy - 214} L${cx + 166} ${cy - 90} L${cx + 74} ${cy - 86}Z`} fill="#eaf8ff" opacity={0.85} />
            <circle cx={cx - 150} cy={cy + 140} r={26} fill="#fff" opacity={0.8} />
            {/* goldenes Glitzern in der Iris */}
            {Array.from({ length: 26 }).map((_, i) => {
              const rr = rng("gl" + i);
              const a = rr() * Math.PI * 2;
              const d = 130 + rr() * 180;
              const t = (frame - rr() * 40) / 10;
              const on = Math.max(0, Math.sin(t)) * glitzer;
              const x = cx + Math.cos(a) * d;
              const y = cy + Math.sin(a) * d;
              const g = 10 + rr() * 16;
              return (
                <g key={i} opacity={on}>
                  <Leuchten x={x} y={y} r={g * 3} farbe="#ffc94a" staerke={0.9} />
                  <path d={`M${x - g} ${y} Q${x} ${y} ${x} ${y - g} Q${x} ${y} ${x + g} ${y} Q${x} ${y} ${x} ${y + g} Q${x} ${y} ${x - g} ${y}Z`} fill="#fff6c8" />
                </g>
              );
            })}
          </g>
          {/* Lidlinie + kurze Wimpern */}
          <Strich punkte={[[cx - 770, cy + 40], [cx - 300, cy - 400], [cx + 40, cy - 404], [cx + 520, cy - 364], [cx + 790, cy + 20]]} breite={34} farbe={T} seed="lidN" zittern={1.2} opts={{ start: { taper: 60 }, end: { taper: 160 } }} />
          <Strich punkte={[[cx - 700, cy + 80], [cx - 300, cy + 330], [cx + 300, cy + 360], [cx + 720, cy + 60]]} breite={12} farbe={F.hautSchatten} deckung={0.7} seed="unterlid" zittern={1} />
        </g>
      </svg>
      <Papier />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Handy-Display nah: online / schreibt … / Nachricht / Foto / umgedreht
// ---------------------------------------------------------------------------
export type HandyZustand = "online" | "schreibt" | "nachricht" | "foto" | "umgedreht" | "zaehler";
export const HandyNah: React.FC<{ zustand: HandyZustand; dauer?: number; tag?: boolean; notiz?: string }> = ({ zustand, dauer = 90, tag = false, notiz }) => {
  const frame = useCurrentFrame();
  const F = MIKA_FARBEN;
  const vib = zustand === "nachricht" && frame < 30 ? Math.sin(frame * 2.6) * 6 * (1 - frame / 30) : 0;
  const z = ip(frame, [0, dauer], [1, 1.06]);
  const umgedreht = zustand === "umgedreht";
  const dreh = umgedreht ? ip(frame, [10, 40], [0, 180]) : 0;
  const zeigtRueck = dreh > 90;
  const sx = Math.abs(Math.cos((dreh * Math.PI) / 180));
  return (
    <AbsoluteFill>
      <Schriften />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Bokeh tag={tag} seed="hbk" />
        {umgedreht ? <Lasur form={klecks(960, 760, 1100, 420, "deckeNah", 12, 0.12)} farbe="#2f8a86" deckung={0.95} seed="deckeNah" schichten={6} kante="#1d4f4c" /> : null}
        <g transform={`translate(960 560) scale(${z}) translate(-960 -560) translate(${vib} 0)`}>
          <g transform={`translate(960 540) rotate(${umgedreht ? ip(frame, [30, 60], [0, -14]) : 0}) scale(${sx * (umgedreht ? ip(frame, [30, 60], [1, 0.72]) : 1)} ${umgedreht ? ip(frame, [30, 60], [1, 0.72]) : 1}) translate(-960 -540)`}>
            {/* Gehäuse */}
            <Lasur form={kurve([[760, 120], [1160, 112], [1176, 980], [770, 990], [760, 120]], 4)} farbe={zeigtRueck ? "#3a6f8f" : "#2a2330"} deckung={1} seed="gehaeuse" schichten={4} streuung={0.15} kante="#120a10" />
            {!zeigtRueck ? (
              <g>
                {/* Display */}
                <Lasur form={kurve([[786, 160], [1140, 154], [1150, 944], [794, 952], [786, 160]], 4)} farbe={tag ? "#fbf6ec" : "#f3f0ea"} deckung={1} seed="display" schichten={3} streuung={0.1} kante={false} />
                <Leuchten x={968} y={540} r={560} ry={620} farbe="#bfe6ff" staerke={0.35} />
                {/* Kopfzeile mit Kontakt */}
                <Lasur form={kurve([[790, 164], [1140, 158], [1142, 270], [792, 276], [790, 164]], 3)} farbe="#e8e0d6" deckung={1} seed="kopf" schichten={2} kante={false} />
                <g transform="translate(850 222) scale(0.18)">
                  <Silhouette x={0} y={260} s={1} farbe="#6a4c93" rand="#c7b3e0" />
                </g>
                <Handschrift text="Jo" x={900} y={218} groesse={50} anker="start" farbe={T} schrift="hand" />
                {zustand === "online" || zustand === "schreibt" ? (
                  <g opacity={zustand === "online" ? ip(frame, [8, 16], [0, 1]) : 1}>
                    <Handschrift text={zustand === "schreibt" && frame > dauer * 0.55 ? "zuletzt online" : zustand === "schreibt" ? "schreibt …" : "online"} x={902} y={258} groesse={34} anker="start" farbe={zustand === "online" ? "#2f9a6a" : "#7a6a6a"} schrift="hand" />
                    {zustand === "online" ? <Leuchten x={960} y={248} r={90} ry={30} farbe="#9ff0c0" staerke={0.6 + 0.4 * Math.sin(frame / 5)} /> : null}
                  </g>
                ) : null}
                {/* Chatverlauf */}
                <Blase x={812} y={340} b={230} links text="war echt schön gestern" />
                <Blase x={900} y={450} b={220} text="fand ich auch!!" />
                <Blase x={930} y={540} b={190} text="und jetzt?" />
                {zustand === "nachricht" ? (
                  <g opacity={ip(frame, [4, 12], [0, 1])} transform={`translate(0 ${ip(frame, [4, 14], [30, 0])})`}>
                    <Blase x={812} y={650} b={260} links text="hey du :)" neu />
                  </g>
                ) : null}
                {zustand === "schreibt" && frame <= dauer * 0.55 ? (
                  <g>
                    <Lasur form={kurve([[812, 650], [930, 646], [934, 716], [816, 720], [812, 650]], 3)} farbe="#e8e0d6" deckung={1} seed="tipp" schichten={2} kante="#b8a898" />
                    {[0, 1, 2].map((k) => (
                      <circle key={k} cx={844 + k * 32} cy={684 - Math.max(0, Math.sin(frame / 4 - k)) * 8} r={9} fill="#7a6a6a" />
                    ))}
                  </g>
                ) : null}
                {zustand === "foto" ? (
                  <g opacity={ip(frame, [4, 14], [0, 1])}>
                    <Lasur form={kurve([[812, 620], [1120, 614], [1124, 900], [814, 906], [812, 620]], 3)} farbe="#f6c79a" deckung={1} seed="foto" schichten={3} kante="#8a5a3a" />
                    <Leuchten x={970} y={700} r={160} farbe="#fff0c0" staerke={0.6} />
                    <g transform="translate(920 900) scale(0.58)"><Silhouette x={0} y={0} farbe="#6a4c93" rand="#ffe2a0" /></g>
                    <g transform="translate(1030 900) scale(0.55)"><Silhouette x={0} y={0} farbe="#3a6f5f" rand="#ffe2a0" /></g>
                    <Handschrift text="haha" x={1060} y={660} groesse={34} farbe="#7a3a10" schrift="hand" drehung={8} />
                  </g>
                ) : null}
                {zustand === "zaehler" ? <Handschrift text="47×" x={968} y={820} groesse={140} farbe="#e86a52" drehung={-6} /> : null}
                {/* Tastatur-Andeutung */}
                <Lasur form={kurve([[794, 760], [1144, 756], [1148, 940], [796, 946], [794, 760]], 3)} farbe="#ddd6cc" deckung={zustand === "foto" ? 0 : 0.8} seed="tasten" schichten={2} kante={false} />
              </g>
            ) : (
              <g>
                <Lasur form={klecks(840, 200, 40, 40, "kamN", 8, 0.05)} farbe="#1a1420" deckung={1} seed="kamN" schichten={2} kante={false} />
                <Strich punkte={[[1120, 180], [1130, 900]]} breite={10} farbe="#8fc3e0" deckung={0.5} seed="glanzN" />
              </g>
            )}
          </g>
          {/* Hände */}
          {!umgedreht || frame < 30 ? (
            <g>
              <Lasur form={kurve([[650, 1100], [700, 760], [790, 700], [830, 760], [800, 900], [760, 1100]], 4)} farbe={F.haut} deckung={1} seed="handL" schichten={4} streuung={0.3} kante={F.hautSchatten} />
              <Lasur form={kurve([[1290, 1100], [1230, 780], [1150, 720], [1120, 790], [1170, 900], [1190, 1100]], 4)} farbe={F.haut} deckung={1} seed="handR" schichten={4} streuung={0.3} kante={F.hautSchatten} />
              <Lasur form={kurve([[560, 1120], [640, 900], [760, 940], [740, 1120]], 4)} farbe={F.hoodie} deckung={1} seed="aermL" schichten={4} kante={T} />
              <Lasur form={kurve([[1380, 1120], [1300, 900], [1180, 940], [1200, 1120]], 4)} farbe={F.hoodie} deckung={1} seed="aermR" schichten={4} kante={T} />
              <Strich punkte={[[770, 760], [840, 640]]} breite={34} farbe={F.haut} seed="daumenL" opts={{ thinning: 0.2, start: { taper: 0, cap: true }, end: { taper: 0, cap: true } }} />
            </g>
          ) : null}
        </g>
        {notiz ? <Handschrift text={notiz} x={1500} y={330} groesse={170} farbe="#ffd27a" drehung={-8} kontur="#6d2f3a" fortschritt={ip(frame, [10, 24], [0, 1], Easing.linear)} /> : null}
      </svg>
      <Papier vignette="rgba(40,10,40,0.45)" />
    </AbsoluteFill>
  );
};

const Blase: React.FC<{ x: number; y: number; b: number; text: string; links?: boolean; neu?: boolean }> = ({ x, y, b, text, links = false, neu = false }) => (
  <g>
    <Lasur form={kurve([[x, y], [x + b, y - 4], [x + b + 4, y + 70], [x + 4, y + 74], [x, y]], 3)} farbe={links ? (neu ? "#ffe9a8" : "#e8e0d6") : "#bfe6d8"} deckung={1} seed={"bl" + text} schichten={2} kante="#a89888" />
    <Handschrift text={text} x={x + 16} y={y + 48} groesse={32} anker="start" farbe="#2e1d17" schrift="hand" />
    {neu ? <Leuchten x={x + b / 2} y={y + 36} r={b * 0.7} ry={70} farbe="#ffd27a" staerke={0.5} /> : null}
  </g>
);
