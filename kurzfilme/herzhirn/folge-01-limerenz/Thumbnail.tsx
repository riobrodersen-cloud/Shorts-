// Zwei Thumbnail-Varianten (1280×720) für „Testen & vergleichen“. Nichts Wichtiges unten rechts (Zeitstempel).
import React from "react";
import { AbsoluteFill } from "remotion";
import { Handschrift, Lasur, Leuchten, Papier, Schriften, Strich } from "../../../src/herzhirn/komponenten/Pinsel";
import { Gluehwuermchen } from "../../../src/herzhirn/komponenten/Natur";
import { Mika, POSEN } from "../../../src/herzhirn/figuren/Mika";
import { klecks, kurve } from "../../../src/herzhirn/lib/aquarell";
import { Bokeh } from "./szenen/Nah";

const Text: React.FC<{ zeilen: string[]; x: number; y: number; groesse: number; farbe?: string }> = ({ zeilen, x, y, groesse, farbe = "#ffe9a0" }) => (
  <g>
    {zeilen.map((z, i) => (
      <Handschrift key={i} text={z} x={x} y={y + i * groesse * 0.95} groesse={groesse} farbe={farbe} drehung={-4} kontur="#3a1430" />
    ))}
  </g>
);

export const ThumbnailA: React.FC = () => (
  <AbsoluteFill>
    <Schriften />
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <radialGradient id="taG" cx="0.3" cy="0.45">
          <stop offset="0" stopColor="#c9605a" />
          <stop offset="1" stopColor="#3e1f4a" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#taG)" />
      {/* goldenes Licht strömt aus dem Kopf nach oben */}
      <Leuchten x={560} y={330} r={520} farbe="#ffc23a" staerke={0.9} />
      <Leuchten x={600} y={160} r={300} ry={380} farbe="#ffd860" staerke={0.6} />
      <Gluehwuermchen seed="tgw" pfadPunkte={[[560, 420], [520, 240], [620, 80], [760, -40]]} anzahl={70} tempo={0} streuung={160} groesse={10} />
      <Gluehwuermchen seed="tgw2" pfadPunkte={[[600, 380], [800, 200], [1000, 60]]} anzahl={30} tempo={0} streuung={120} groesse={7} />
      <Mika x={560} y={1290} skala={2.1} pose={POSEN.sitztHandy} mimik="sehnsuechtig" handy handyLicht={1} seed="mika" ohneBeine />
      <Text zeilen={["ICH KANN", "NICHT", "AUFHÖREN"]} x={1380} y={250} groesse={200} />
    </svg>
    <Papier staerke={0.8} vignette="rgba(30,10,30,0.5)" />
  </AbsoluteFill>
);

export const ThumbnailB: React.FC = () => (
  <AbsoluteFill>
    <Schriften />
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <Bokeh seed="tb" />
      <rect x={0} y={0} width={1920} height={1080} fill="#2a1430" opacity={0.3} />
      <Mika x={600} y={1760} skala={3.9} pose={{ ...POSEN.sitztHandy, blick: [0.9, 0.2], drehung: 0.25 }} mimik="sehnsuechtig" handyLicht={1} seed="mika" ohneBeine />
      {/* Handy mit Herz und Tipp-Blase */}
      <g transform="translate(1390 600) rotate(8) scale(0.92)">
        <Leuchten x={0} y={0} r={420} farbe="#bfe6ff" staerke={0.6} />
        <Lasur form={kurve([[-200, -330], [200, -336], [210, 330], [-196, 336], [-200, -330]], 4)} farbe="#2a2330" deckung={1} seed="tbh" schichten={4} streuung={0.12} grundTiefe={1} kante="#120a10" />
        <Lasur form={kurve([[-176, -300], [178, -304], [184, 300], [-172, 306], [-176, -300]], 4)} farbe="#f6f2ea" deckung={1} seed="tbd" schichten={3} streuung={0.12} grundTiefe={1} kante={false} />
        <g transform="translate(0 -60) scale(3.2)">
          <Lasur form={kurve([[0, 34], [-38, 2], [-34, -24], [-12, -30], [0, -14], [12, -30], [34, -24], [38, 2], [0, 34]], 5)} farbe="#e9576a" deckung={1} seed="tbherz" schichten={4} kante="#7a1a2a" />
        </g>
        <Lasur form={kurve([[-120, 130], [110, 124], [116, 230], [-114, 236], [-120, 130]], 3)} farbe="#e8e0d6" deckung={1} seed="tbbl" schichten={2} kante="#a89888" />
        {[0, 1, 2].map((k) => (
          <Lasur key={k} form={klecks(-56 + k * 56, 182, 18, 18, "tbp" + k, 8, 0.05)} farbe="#6a5a6a" deckung={1} seed={"tbp" + k} schichten={2} kante={false} />
        ))}
      </g>
      <Text zeilen={["47× AUFS HANDY"]} x={960} y={190} groesse={190} />
      <Strich punkte={[[400, 240], [960, 262], [1520, 226]]} breite={16} farbe="#e86a52" seed="tbu" />
    </svg>
    <Papier staerke={0.8} vignette="rgba(30,10,30,0.55)" />
  </AbsoluteFill>
);
