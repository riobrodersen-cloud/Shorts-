// Kanal-Profilbild „Herzhirn“ (800×800, wird rund beschnitten): Mika mit goldenem Herzschein.
import React from "react";
import { AbsoluteFill } from "remotion";
import { Lasur, Leuchten, Papier } from "../../src/herzhirn/komponenten/Pinsel";
import { Gluehwuermchen } from "../../src/herzhirn/komponenten/Natur";
import { Mika, POSEN } from "../../src/herzhirn/figuren/Mika";
import { kurve } from "../../src/herzhirn/lib/aquarell";

export const Profilbild: React.FC = () => (
  <AbsoluteFill>
    <svg viewBox="0 0 800 800" width="100%" height="100%">
      <defs>
        <radialGradient id="pb" cx="0.5" cy="0.45">
          <stop offset="0" stopColor="#f29a7a" />
          <stop offset="0.6" stopColor="#a8558a" />
          <stop offset="1" stopColor="#4a2a6a" />
        </radialGradient>
      </defs>
      <rect width={800} height={800} fill="url(#pb)" />
      <Leuchten x={400} y={300} r={340} farbe="#ffd27a" staerke={0.7} />
      <Gluehwuermchen seed="pbg" pfadPunkte={[[120, 600], [300, 250], [520, 150], [700, 380]]} anzahl={30} tempo={0} streuung={120} groesse={6} />
      <Mika x={400} y={1080} skala={2.35} pose={{ ...POSEN.stehen, blick: [0.15, -0.2], kopfNeig: -6 }} mimik="erleichtert" seed="mika" ohneBeine />
      <g transform="translate(560 190) rotate(12) scale(1.6)">
        <Leuchten x={0} y={0} r={70} farbe="#ffb0a0" staerke={0.8} />
        <Lasur form={kurve([[0, 34], [-38, 2], [-34, -24], [-12, -30], [0, -14], [12, -30], [34, -24], [38, 2], [0, 34]], 5)} farbe="#e9576a" deckung={1} seed="pbherz" schichten={4} kante="#7a1a2a" />
      </g>
    </svg>
    <Papier staerke={0.7} vignette="rgba(40,10,40,0.35)" />
  </AbsoluteFill>
);
