// Mikas Zimmer bei Nacht – warm, voller Leben: Lichterkette, Mondlicht, Pflanzen, Bücher.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { Lasur, Leuchten, Papier, Strich, Schriften, Handschrift } from "../../../../src/herzhirn/komponenten/Pinsel";
import { Dampf, Lichterkette, Ranke, Staub, Topfpflanze, Voegel } from "../../../../src/herzhirn/komponenten/Natur";
import { Ebene, Kamera } from "../../../../src/herzhirn/komponenten/Kamera";
import { Mika, Mimik, POSEN } from "../../../../src/herzhirn/figuren/Mika";
import { band, klecks, kurve, P, viereck } from "../../../../src/herzhirn/lib/aquarell";
import { fbm1, rng, zwischen } from "../../../../src/herzhirn/lib/zufall";

const T = "#2e1d17"; // Tusche

// ---------- Wand, Boden, Licht ----------
const Wand: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="wandVerlauf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6d3d5e" />
        <stop offset="0.45" stopColor="#a8586a" />
        <stop offset="1" stopColor="#d98c62" />
      </linearGradient>
    </defs>
    <rect x={-200} y={-200} width={2320} height={1100} fill="url(#wandVerlauf)" />
    {/* Lasuren für gemalte Wandstruktur */}
    <Lasur form={klecks(1450, 420, 820, 460, "w1", 14, 0.12)} farbe="#f0a26a" deckung={0.32} seed="w1" schichten={12} streuung={0.9} kante={false} />
    <Lasur form={klecks(260, 120, 700, 320, "w2", 14, 0.12)} farbe="#5a2f58" deckung={0.22} seed="w2" schichten={12} streuung={0.9} kante={false} />
    <Lasur form={klecks(900, 520, 600, 300, "w3", 14, 0.12)} farbe="#c96a5c" deckung={0.2} seed="w3" schichten={12} streuung={0.9} kante={false} />
    <Lasur form={klecks(1900, 160, 360, 420, "w4", 14, 0.12)} farbe="#7a3e62" deckung={0.22} seed="w4" schichten={12} streuung={0.9} kante={false} />
    <Leuchten x={1200} y={560} r={700} ry={420} farbe="#ffb070" staerke={0.25} blend="soft-light" />
  </g>
);

const Boden: React.FC = () => {
  const dielen = Array.from({ length: 14 }, (_, i) => i);
  return (
    <g>
      <Lasur form={[[-200, 770], [700, 752], [2120, 770], [2120, 1300], [-200, 1300]]} farbe="#8a4f36" deckung={1} seed="boden" schichten={7} streuung={0.15} kante={false} />
      <Lasur form={klecks(1100, 960, 900, 110, "bl", 12, 0.12)} farbe="#c47848" deckung={0.45} seed="bl" schichten={6} kante={false} />
      {/* Dielenfugen in Perspektive */}
      {dielen.map((i) => {
        const x0 = -300 + i * 190;
        return <Strich key={i} punkte={[[960 + (x0 - 960) * 0.55, 770], [x0 + (x0 - 960) * 0.4, 1090]]} breite={2.2} farbe="#4e2a1c" deckung={0.45} seed={"diele" + i} opts={{ thinning: 0.4 }} />;
      })}
      {/* Fußleiste */}
      <Strich punkte={[[-100, 768], [600, 754], [1300, 758], [2050, 770]]} breite={9} farbe="#f1d3b0" deckung={0.7} seed="leiste" opts={{ thinning: 0.2, start: { taper: 0 }, end: { taper: 0 } }} />
      {/* Teppich */}
      <Lasur form={klecks(560, 990, 420, 90, "tep", 14, 0.08)} farbe="#2f8a86" deckung={0.85} seed="tep" schichten={6} streuung={0.6} kante="#1d4f4c" />
      {[0, 1, 2].map((k) => (
        <Strich key={k} punkte={[[200 + k * 10, 985 + k * 22 - 40], [560, 975 + k * 22 - 40], [930 - k * 10, 985 + k * 22 - 40]]} breite={5} farbe={k === 1 ? "#f2c36b" : "#e9806a"} deckung={0.75} seed={"tm" + k} />
      ))}
    </g>
  );
};

// Fenster mit Nachthimmel (Mond, Sterne, Ast, Häuser mit warmen Fenstern)
const Fenster: React.FC = () => {
  const frame = useCurrentFrame();
  const innen = viereck([[262, 196], [612, 186], [620, 548], [256, 556]], "fi", 2);
  const sterne = rng("sterne");
  return (
    <g>
      <defs>
        <clipPath id="fensterClip">
          <polygon points={innen.map((p) => p.join(",")).join(" ")} />
        </clipPath>
        <linearGradient id="nacht" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a5f8e" />
          <stop offset="0.7" stopColor="#5f8fa8" />
          <stop offset="1" stopColor="#d48a7a" />
        </linearGradient>
      </defs>
      {/* Rahmen */}
      <Lasur form={viereck([[236, 172], [640, 162], [648, 574], [230, 584]], "fr", 3)} farbe="#f3dcc0" deckung={1} seed="fr" schichten={5} streuung={0.4} kante={T} />
      <g clipPath="url(#fensterClip)">
        <rect x={200} y={150} width={480} height={450} fill="url(#nacht)" />
        <Lasur form={klecks(420, 300, 220, 90, "nh", 10, 0.2)} farbe="#5d4f8a" deckung={0.35} seed="nh" schichten={5} kante={false} />
        {Array.from({ length: 22 }).map((_, i) => {
          const x = 270 + sterne() * 340;
          const y = 200 + sterne() * 200;
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(frame / (10 + i) + i));
          return <path key={i} d={`M${x - 3} ${y} L${x + 3} ${y} M${x} ${y - 3} L${x} ${y + 3}`} stroke="#fff3cf" strokeWidth={1.4} opacity={tw} />;
        })}
        {/* Mond */}
        <Leuchten x={520} y={270} r={120} farbe="#fff1c9" staerke={0.7} />
        <Lasur form={klecks(520, 270, 36, 36, "mond", 12, 0.04)} farbe="#fff4d8" deckung={1} seed="mond" schichten={4} streuung={0.3} kante="#e8c98a" />
        <Lasur form={klecks(510, 262, 10, 8, "mk", 8, 0.1)} farbe="#e8cf9a" deckung={0.6} seed="mk" schichten={2} kante={false} />
        {/* Ferne Häuser mit warmen Fenstern */}
        <Lasur form={[[250, 470], [300, 430], [330, 445], [380, 405], [430, 440], [470, 420], [540, 452], [590, 430], [640, 460], [640, 600], [250, 600]]} farbe="#3b3456" deckung={0.95} seed="fh" schichten={4} streuung={0.3} kante={false} />
        {[[300, 470], [350, 455], [405, 440], [460, 470], [520, 480], [575, 468], [330, 510], [440, 505], [560, 515]].map(([x, y], i) => (
          <g key={i} opacity={0.6 + 0.4 * Math.abs(fbm1(frame / 40 + i, i))}>
            <Leuchten x={x} y={y} r={14} farbe="#ffc56a" staerke={0.8} />
            <path d={`M${x - 4} ${y - 5} L${x + 5} ${y - 6} L${x + 4} ${y + 5} L${x - 5} ${y + 5}Z`} fill="#ffd27a" />
          </g>
        ))}
        {/* Ast mit Blättern vor dem Fenster, im Wind */}
        <g transform={`rotate(${fbm1(frame / 45, 2) * 3} 640 230)`}>
          <Strich punkte={[[660, 228], [560, 250], [470, 238], [400, 262]]} breite={9} farbe="#2c2433" seed="ast" />
          {Array.from({ length: 11 }).map((_, i) => {
            const u = i / 10;
            const x = 650 - u * 250;
            const y = 232 + Math.sin(u * 6) * 12;
            const s = i % 2 ? 1 : -1;
            return <Lasur key={i} form={kurve([[x, y], [x - 12, y + s * 14], [x - 30, y + s * 18], [x - 16, y + s * 4], [x, y]], 3)} farbe="#2f3b47" deckung={0.9} seed={"fb" + i} schichten={2} streuung={0.3} kante={false} />;
          })}
        </g>
      </g>
      {/* Fensterkreuz */}
      <Strich punkte={[[438, 190], [436, 300], [440, 552]]} breite={12} farbe="#f3dcc0" deckung={1} seed="kreuz1" opts={{ thinning: 0.1, start: { taper: 0 }, end: { taper: 0 } }} />
      <Strich punkte={[[258, 372], [440, 368], [616, 366]]} breite={12} farbe="#f3dcc0" deckung={1} seed="kreuz2" opts={{ thinning: 0.1, start: { taper: 0 }, end: { taper: 0 } }} />
      <Strich punkte={[[262, 196], [612, 186], [620, 548], [256, 556], [262, 196]]} breite={3} farbe={T} deckung={0.6} seed="fk" weich={false} />
      {/* Fensterbank mit Pflanzen */}
      <Lasur form={viereck([[210, 572], [670, 562], [676, 598], [206, 606]], "bank", 2)} farbe="#f6e2c8" deckung={1} seed="bank" schichten={4} streuung={0.3} kante={T} />
      <Topfpflanze x={300} y={548} groesse={0.55} seed="fp1" />
      <Topfpflanze x={580} y={544} groesse={0.45} seed="fp2" blattFarbe="#5aa36a" topfFarbe="#2f8a86" />
    </g>
  );
};

// Vorhänge, die sanft im Luftzug wehen
const Vorhang: React.FC<{ x: number; seite: 1 | -1; seed: string }> = ({ x, seite, seed }) => {
  const frame = useCurrentFrame();
  const w = fbm1(frame / 60, seed.length) * 14;
  const pts: P[] = [
    [x, 130], [x + seite * 120, 128], [x + seite * (110 + w), 330], [x + seite * (80 + w * 1.6), 560], [x + seite * (120 + w * 2), 760], [x - seite * 10, 770], [x - seite * 30 + w, 450], [x - seite * 10, 130],
  ];
  return (
    <g>
      <Lasur form={kurve(pts, 5)} farbe="#e9785e" deckung={0.92} seed={seed} schichten={7} streuung={0.5} kante="#7a2e22" />
      {[0.25, 0.5, 0.75].map((k, i) => (
        <Strich key={i} punkte={[[x + seite * 120 * k, 140], [x + seite * (110 * k + w * 0.6), 420], [x + seite * (115 * k + w * 1.6), 750]]} breite={5} farbe="#b04a3a" deckung={0.5} seed={seed + "f" + i} />
      ))}
      <Strich punkte={[[x + seite * 30, 150], [x + seite * 60 + w * 0.5, 400]]} breite={10} farbe="#ffb48a" deckung={0.35} seed={seed + "l"} />
    </g>
  );
};

// Regal mit schiefen Büchern, Poster, Fotos
const Regal: React.FC = () => {
  const r = rng("buecher");
  const farben = ["#2f8a86", "#e86a52", "#f2b84b", "#6a4c93", "#e9a8a0", "#3d6b9a", "#f3e2c2", "#9c3f4a"];
  let x = 1462;
  const buecher: React.ReactNode[] = [];
  let i = 0;
  while (x < 1790) {
    const b = zwischen(r, 18, 34);
    const h = zwischen(r, 80, 120);
    const kipp = i === 5 ? 18 : i === 9 ? -12 : zwischen(r, -3, 3);
    const f = farben[i % farben.length];
    buecher.push(
      <g key={i} transform={`rotate(${kipp} ${x + b / 2} 420)`}>
        <Lasur form={viereck([[x, 420 - h], [x + b, 421 - h], [x + b, 420], [x, 421]], "bu" + i, 1.2)} farbe={f} deckung={1} seed={"bu" + i} schichten={3} streuung={0.2} kante={T} />
        <Strich punkte={[[x + 4, 420 - h * 0.75], [x + b - 4, 420 - h * 0.75]]} breite={2.4} farbe="#fff3dd" deckung={0.7} seed={"bs" + i} />
      </g>,
    );
    x += b + (i === 5 ? 22 : 3);
    i++;
  }
  return (
    <g>
      {/* Poster mit gemaltem Sonnenuntergang */}
      <g transform="rotate(-2 1200 320)">
        <Lasur form={viereck([[1060, 160], [1340, 168], [1334, 480], [1056, 472]], "poster", 2)} farbe="#f6e6c8" deckung={1} seed="poster" schichten={4} streuung={0.3} kante={T} />
        <Lasur form={klecks(1200, 300, 110, 110, "psonne", 12, 0.05)} farbe="#f29a4a" deckung={0.9} seed="psonne" schichten={6} kante={false} />
        <Lasur form={[[1070, 380], [1150, 300], [1210, 350], [1270, 290], [1330, 370], [1330, 465], [1066, 462]]} farbe="#2f8a86" deckung={0.9} seed="pberg" schichten={5} streuung={0.6} kante={false} />
        <Handschrift text="somewhere" x={1198} y={226} groesse={34} farbe="#7a2e22" schrift="hand" />
        <Strich punkte={[[1180, 156], [1200, 170], [1222, 156]]} breite={8} farbe="#f3e7b5" deckung={0.8} seed="tape" />
      </g>
      {/* Polaroids */}
      {[[930, 260, -8, "#9bd0c6"], [1000, 300, 6, "#f4b8a0"]].map(([px, py, rot, f], k) => (
        <g key={k} transform={`rotate(${rot} ${px} ${py})`}>
          <Lasur form={viereck([[Number(px) - 34, Number(py) - 40], [Number(px) + 34, Number(py) - 41], [Number(px) + 34, Number(py) + 44], [Number(px) - 34, Number(py) + 44]], "pol" + k, 1.2)} farbe="#fbf3e4" deckung={1} seed={"pol" + k} schichten={3} kante={T} />
          <Lasur form={viereck([[Number(px) - 26, Number(py) - 33], [Number(px) + 26, Number(py) - 33], [Number(px) + 26, Number(py) + 22], [Number(px) - 26, Number(py) + 22]], "polb" + k, 1)} farbe={String(f)} deckung={1} seed={"polb" + k} schichten={3} kante={false} />
        </g>
      ))}
      {/* Regalbrett */}
      <Lasur form={viereck([[1440, 420], [1820, 416], [1822, 440], [1438, 444]], "brett", 1.5)} farbe="#b8784a" deckung={1} seed="brett" schichten={4} streuung={0.3} kante={T} />
      {buecher}
      <Topfpflanze x={1770} y={390} groesse={0.45} seed="regalpfl" topfFarbe="#f2b84b" />
      <Ranke x={1480} y={440} laenge={230} seed="ranke1" />
      <Ranke x={1560} y={440} laenge={160} seed="ranke2" farbe="#68b06a" />
    </g>
  );
};

// Schreibtisch mit Lampe, dampfender Tasse; Stuhl mit Klamotten
const Schreibtisch: React.FC = () => {
  const frame = useCurrentFrame();
  const lampFl = 0.92 + 0.08 * fbm1(frame / 8, 4);
  return (
    <g>
      {/* Lampenlicht-Kegel */}
      <path d="M690 452 L560 690 L840 690Z" fill="#ffd98a" opacity={0.18 * lampFl} style={{ mixBlendMode: "screen" }} />
      <Leuchten x={700} y={640} r={260} ry={120} farbe="#ffc56a" staerke={0.6 * lampFl} />
      {/* Tisch */}
      <Lasur form={viereck([[120, 640], [880, 630], [884, 662], [118, 668]], "tisch", 2)} farbe="#a8643e" deckung={1} seed="tisch" schichten={5} streuung={0.4} kante={T} />
      <Strich punkte={[[150, 664], [146, 860]]} breite={14} farbe="#7a4428" seed="tb1" opts={{ thinning: 0.1 }} />
      <Strich punkte={[[850, 660], [856, 860]]} breite={14} farbe="#7a4428" seed="tb2" opts={{ thinning: 0.1 }} />
      {/* Lampe: organischer Schirm auf geschwungenem Arm */}
      <Strich punkte={[[760, 632], [770, 560], [720, 470]]} breite={7} farbe="#2f5a5a" seed="larm" />
      <Lasur form={klecks(764, 630, 40, 10, "lfuss", 8, 0.08)} farbe="#2f8a86" deckung={1} seed="lfuss" schichten={3} kante={T} />
      <Lasur form={kurve([[650, 470], [700, 420], [760, 430], [780, 476], [700, 486], [650, 470]], 4)} farbe="#2f8a86" deckung={1} seed="lschirm" schichten={5} streuung={0.4} kante={T} />
      <Leuchten x={712} y={480} r={60} ry={26} farbe="#fff0c0" staerke={lampFl} />
      {/* Bücherstapel, Tasse mit Dampf */}
      <Lasur form={viereck([[500, 600], [640, 596], [642, 632], [498, 634]], "st1", 1.5)} farbe="#e86a52" deckung={1} seed="st1" schichten={3} kante={T} />
      <Lasur form={viereck([[510, 572], [630, 570], [632, 600], [508, 602]], "st2", 1.5)} farbe="#f2b84b" deckung={1} seed="st2" schichten={3} kante={T} />
      <Lasur form={kurve([[400, 584], [460, 582], [456, 630], [406, 632], [400, 584]], 3)} farbe="#f3e2c2" deckung={1} seed="tasse" schichten={4} streuung={0.3} kante={T} />
      <Strich punkte={[[458, 594], [478, 600], [476, 616], [457, 620]]} breite={5} farbe="#f3e2c2" seed="henkel" />
      <Lasur form={klecks(430, 590, 26, 6, "kaffee", 8, 0.05)} farbe="#6a3a22" deckung={0.9} seed="kaffee" schichten={2} kante={false} />
      <Dampf x={430} y={576} hoehe={110} />
      {/* Stuhl mit Klamotten (vorne links) */}
      <Strich punkte={[[200, 700], [192, 560], [210, 520]]} breite={12} farbe="#6a3a22" seed="lehne1" />
      <Strich punkte={[[330, 700], [340, 560], [326, 520]]} breite={12} farbe="#6a3a22" seed="lehne2" />
      <Strich punkte={[[196, 560], [336, 556]]} breite={10} farbe="#6a3a22" seed="lehne3" />
      <Lasur form={kurve([[170, 700], [360, 692], [372, 724], [168, 732], [170, 700]], 4)} farbe="#8a4a2e" deckung={1} seed="sitz" schichten={4} kante={T} />
      <Strich punkte={[[186, 728], [180, 900]]} breite={11} farbe="#5e3220" seed="sb1" />
      <Strich punkte={[[355, 722], [364, 900]]} breite={11} farbe="#5e3220" seed="sb2" />
      {/* Jeansjacke über der Lehne */}
      <Lasur form={kurve([[180, 520], [345, 514], [356, 590], [320, 650], [250, 640], [196, 660], [176, 590], [180, 520]], 4)} farbe="#5d7fb8" deckung={0.95} seed="jacke" schichten={6} streuung={0.5} kante="#2e3f66" />
      <Strich punkte={[[200, 540], [250, 590], [236, 640]]} breite={4} farbe="#2e3f66" deckung={0.6} seed="jf" />
      {/* Schal hängt herunter */}
      <Lasur form={kurve([[290, 516], [318, 520], [326, 640], [314, 790], [294, 792], [302, 640], [290, 516]], 4)} farbe="#f2b84b" deckung={0.95} seed="schal" schichten={5} kante="#8a5a1a" />
      {[0, 1, 2, 3].map((k) => (
        <Strich key={k} punkte={[[300, 560 + k * 56], [320, 566 + k * 56]]} breite={4} farbe="#e86a52" deckung={0.8} seed={"ss" + k} />
      ))}
      {/* Turnschuhe auf dem Boden */}
      <Lasur form={kurve([[600, 870], [660, 862], [700, 880], [696, 896], [600, 896], [600, 870]], 3)} farbe="#f3eadb" deckung={1} seed="ts1" schichten={3} kante={T} />
      <Lasur form={kurve([[640, 900], [700, 890], [744, 908], [740, 924], [640, 926], [640, 900]], 3)} farbe="#f3eadb" deckung={1} seed="ts2" schichten={3} kante={T} />
      <Strich punkte={[[620, 884], [670, 878]]} breite={5} farbe="#e86a52" seed="ts1a" />
      <Strich punkte={[[660, 914], [710, 906]]} breite={5} farbe="#e86a52" seed="ts2a" />
    </g>
  );
};

// Bett mit Decke, Kissen
const Bett: React.FC = () => (
  <g>
    {/* Kopfteil */}
    <Lasur form={kurve([[1560, 560], [1640, 520], [1760, 516], [1860, 560], [1870, 760], [1550, 770], [1560, 560]], 5)} farbe="#7a4a3a" deckung={1} seed="kopfteil" schichten={5} streuung={0.4} kante={T} />
    {/* Matratze/Bettrahmen */}
    <Lasur form={kurve([[820, 800], [1000, 740], [1500, 720], [1880, 740], [1900, 960], [1600, 1010], [900, 1000], [820, 800]], 5)} farbe="#f1dcc4" deckung={1} seed="matratze" schichten={6} streuung={0.4} kante={T} />
    {/* Decke mit Muster */}
    <Lasur form={kurve([[800, 830], [980, 790], [1300, 800], [1560, 770], [1720, 810], [1760, 980], [1500, 1060], [1000, 1060], [780, 1000], [800, 830]], 5)} farbe="#2f8a86" deckung={0.95} seed="decke" schichten={7} streuung={0.6} kante="#1d4f4c" />
    <Lasur form={klecks(1250, 930, 400, 90, "deckl", 10, 0.15)} farbe="#5fb3a8" deckung={0.4} seed="deckl" schichten={5} kante={false} />
    {Array.from({ length: 6 }).map((_, i) => (
      <Strich key={i} punkte={[[860 + i * 150, 830 - i * 4], [880 + i * 150, 930], [850 + i * 150, 1040]]} breite={6} farbe={i % 2 ? "#f2c36b" : "#e9806a"} deckung={0.8} seed={"dm" + i} />
    ))}
    {/* Kissen */}
    <Lasur form={klecks(1640, 680, 110, 62, "kissen1", 12, 0.08, 0.3)} farbe="#f6e8d6" deckung={1} seed="kissen1" schichten={5} streuung={0.5} kante={T} />
    <Lasur form={klecks(1770, 700, 90, 58, "kissen2", 12, 0.08, -0.2)} farbe="#e9a8a0" deckung={1} seed="kissen2" schichten={5} streuung={0.5} kante={T} />
    <Strich punkte={[[1720, 690], [1770, 676], [1820, 700]]} breite={3} farbe="#b8645c" deckung={0.6} seed="kf" />
  </g>
);

export type ZimmerProps = {
  zaehlerVon?: number;
  zaehlerBis?: number;
  zeigeZaehler?: boolean;
  morgen?: number; // 0 Nacht .. 1 Morgendämmerung
  fensterOffen?: number; // 0..1
  mikaModus?: "sitzt" | "handyWeg" | "fenster" | "keine";
  mimik?: Mimik;
  zoom?: [number, number];
  fokus?: [number, number];
  schwenk?: [number, number];
  dauer?: number;
  handyAn?: number; // Frame, ab dem das Handy aufleuchtet (Hook)
};

export const Zimmer: React.FC<ZimmerProps> = ({ zaehlerVon = 39, zaehlerBis = 47, zeigeZaehler = true, morgen = 0, fensterOffen = 0, mikaModus = "sitzt", mimik = "sehnsuechtig", zoom = [1.0, 1.06], fokus = [1150, 620], schwenk = [-10, 20], dauer = 150, handyAn = 0 }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, dauer], zoom, { easing: Easing.inOut(Easing.cubic), extrapolateRight: "clamp" });
  const px = interpolate(frame, [0, dauer], schwenk, { extrapolateRight: "clamp" });
  const zaehler = Math.round(interpolate(frame, [10, dauer * 0.75], [zaehlerVon, zaehlerBis], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) }));
  const an = interpolate(frame, [handyAn, handyAn + 6], [0.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const handyLicht = (0.75 + 0.25 * Math.sin(frame / 12)) * an;
  const nacht = 1 - morgen;

  return (
    <AbsoluteFill style={{ background: "#6d3d5e" }}>
      <Schriften />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Kamera kam={{ x: px, y: 0, zoom: z, fx: fokus[0], fy: fokus[1] }}>
          <Ebene tiefe={0.6}>
            <Wand />
            <Fenster />
            {morgen > 0 ? (
              <g opacity={morgen} clipPath="url(#fensterClip)">
                <defs>
                  <linearGradient id="morgenFenster" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#9fd0e0" />
                    <stop offset="0.6" stopColor="#ffd2a8" />
                    <stop offset="1" stopColor="#ffb07a" />
                  </linearGradient>
                </defs>
                <rect x={200} y={150} width={480} height={450} fill="url(#morgenFenster)" />
                <Leuchten x={360} y={500} r={200} farbe="#fff2c0" staerke={1} />
                <Lasur form={klecks(360, 500, 40, 40, "msonne", 10, 0.05)} farbe="#fff6d8" deckung={1} seed="msonne" schichten={3} kante={false} />
                <Lasur form={[[250, 500], [330, 470], [420, 495], [520, 470], [640, 500], [640, 600], [250, 600]]} farbe="#c98a8a" deckung={0.9} seed="mhaus" schichten={3} kante={false} />
                <Voegel seed="mvg" y={300} anzahl={4} groesse={10} breite={700} />
              </g>
            ) : null}
            {fensterOffen > 0 ? (
              <g>
                {/* geöffnete Fensterflügel */}
                <Lasur form={viereck([[262, 196], [262 - 120 * fensterOffen, 176], [256 - 120 * fensterOffen, 580], [256, 556]], "fl1", 2)} farbe="#f3dcc0" deckung={0.95} seed="fl1" schichten={3} kante={T} />
                <Lasur form={viereck([[612, 186], [612 + 120 * fensterOffen, 166], [620 + 120 * fensterOffen, 570], [620, 548]], "fl2", 2)} farbe="#f3dcc0" deckung={0.95} seed="fl2" schichten={3} kante={T} />
              </g>
            ) : null}
            <Vorhang x={236} seite={-1} seed="v1" />
            <Vorhang x={648} seite={1} seed="v2" />
            <Regal />
            <Lichterkette von={[40, 96]} bis={[1000, 118]} durchhang={95} birnen={16} seed="lk1" helligkeit={nacht * 0.8 + 0.2} />
            <Lichterkette von={[1000, 118]} bis={[1940, 70]} durchhang={120} birnen={16} seed="lk2" farbe="#ffb36a" helligkeit={nacht * 0.8 + 0.2} />
          </Ebene>
          <Ebene tiefe={0.8}>
            <Boden />
            <Schreibtisch />
            <defs>
              <linearGradient id="strahl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={morgen > 0.5 ? "#fff0c0" : "#d8ecff"} stopOpacity={0.5} />
                <stop offset="1" stopColor={morgen > 0.5 ? "#fff0c0" : "#d8ecff"} stopOpacity={0} />
              </linearGradient>
            </defs>
            {[-30, -12, 0, 12, 30].map((d, i) => (
              <path key={i} d={`M${262 + d} 556 L${620 + d} 548 L${1180 + d * 3} 1080 L${520 + d * 3} 1080Z`} fill="url(#strahl)" opacity={0.08 + morgen * 0.08} style={{ mixBlendMode: "screen" }} />
            ))}
            <Staub seed="mondstaub" bereich={[300, 560, 700, 500]} anzahl={45} farbe={morgen > 0.5 ? "#fff2c0" : "#e9f4ff"} />
          </Ebene>
          <Ebene tiefe={1}>
            <Bett />
            {mikaModus === "sitzt" || mikaModus === "handyWeg" ? (
              <g>
                <Mika x={1210} y={880} skala={1.02} pose={mikaModus === "handyWeg" ? { ...POSEN.sitztHandy, blick: [-0.6, -0.2], kopfNeig: -4, hand: [[-60, -60], [70, -60]], ellbogen: [[-110, -110], [110, -110]] } : POSEN.sitztHandy} mimik={mimik} handy={mikaModus === "sitzt"} handyLicht={handyLicht} seed="mika" lichtFarbe={morgen > 0.5 ? "#ffe2a0" : "#bfe6ff"} />
                <Lasur form={kurve([[1010, 900], [1080, 850], [1180, 872], [1260, 846], [1370, 870], [1420, 940], [1300, 990], [1100, 990], [1010, 900]], 5)} farbe="#3d9a8e" deckung={0.97} seed="schoss" schichten={6} streuung={0.5} kante="#1d4f4c" />
                <Strich punkte={[[1090, 870], [1150, 930], [1140, 985]]} breite={5} farbe="#1d4f4c" deckung={0.5} seed="sf1" />
                <Strich punkte={[[1290, 860], [1300, 930], [1340, 975]]} breite={5} farbe="#1d4f4c" deckung={0.5} seed="sf2" />
                <Strich punkte={[[1060, 900], [1200, 890], [1380, 915]]} breite={6} farbe="#f2c36b" deckung={0.7} seed="sf3" />
                {mikaModus === "handyWeg" ? (
                  <Lasur form={kurve([[1380, 930], [1450, 924], [1454, 960], [1384, 966], [1380, 930]], 3)} farbe="#3a6f8f" deckung={1} seed="handyUnten" schichten={3} kante="#1a1420" />
                ) : null}
              </g>
            ) : null}
            {mikaModus === "fenster" ? <Mika x={440} y={1000} skala={0.95} pose={POSEN.fensterAuf} hinten seed="mika" /> : null}
            <Staub seed="lichtstaub" bereich={[1000, 400, 500, 400]} anzahl={20} farbe="#ffe7b0" groesse={2} />
          </Ebene>
          <Ebene tiefe={1.25}>
            <g opacity={0.95}>
              <Topfpflanze x={1850} y={1010} groesse={1.9} seed="monstera" blattFarbe="#2f7a52" topfFarbe="#d9774a" />
            </g>
          </Ebene>
        </Kamera>
        {/* Morgenlicht über allem */}
        {morgen > 0 ? (
          <g>
            <rect x={0} y={0} width={1920} height={1080} fill="#ffd9a0" opacity={morgen * 0.35} style={{ mixBlendMode: "soft-light" }} />
            <Leuchten x={440} y={380} r={900} ry={700} farbe="#fff0c8" staerke={morgen * 0.45} />
          </g>
        ) : null}
        {zeigeZaehler ? (
          <g>
            <Handschrift text={`${zaehler}×`} x={1660} y={250} groesse={150} farbe="#ffd27a" drehung={-6} kontur="#6d2f3a" />
            <Strich punkte={[[1560, 280], [1660, 296], [1770, 270]]} breite={7} farbe="#ffd27a" seed="unterstrich" fortschritt={interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          </g>
        ) : null}
      </svg>
      <Papier vignette={morgen > 0.5 ? "rgba(120,60,40,0.3)" : "rgba(60,20,40,0.45)"} />
    </AbsoluteFill>
  );
};
