// YouTube-Kanalbanner „Herzhirn“ (2560×1440). Text + Figur nur im sicheren Bereich 1546×423 in der Mitte.
import React from "react";
import { AbsoluteFill } from "remotion";
import { Handschrift, Lasur, Leuchten, Papier, Schriften, Strich } from "../../src/herzhirn/komponenten/Pinsel";
import { Baum, Gluehwuermchen, ABEND } from "../../src/herzhirn/komponenten/Natur";
import { Mika, POSEN } from "../../src/herzhirn/figuren/Mika";
import { klecks, kurve, P } from "../../src/herzhirn/lib/aquarell";
import { rng } from "../../src/herzhirn/lib/zufall";

const FLUSS: P[] = kurve([[300, 1500], [900, 1220], [700, 1060], [1200, 960], [1700, 900], [1500, 840], [2000, 790], [2700, 760]], 10);

export const Banner: React.FC = () => {
  const r = rng("bannerberge");
  const kamm: P[] = [];
  for (let x = -200; x <= 2800; x += 90) kamm.push([x, 640 - 130 * Math.abs(Math.sin(x / 300 + r() * 0.4))]);
  return (
    <AbsoluteFill>
      <Schriften />
      <svg viewBox="0 0 2560 1440" width="100%" height="100%">
        <defs>
          <linearGradient id="bh" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5e3f86" />
            <stop offset="0.35" stopColor="#a8558a" />
            <stop offset="0.55" stopColor="#e98a7a" />
            <stop offset="0.7" stopColor="#ffc07a" />
          </linearGradient>
          <filter id="bloomB"><feGaussianBlur stdDeviation="30" /></filter>
        </defs>
        <rect width={2560} height={1440} fill="url(#bh)" />
        <Leuchten x={1280} y={700} r={1100} ry={360} farbe="#ffd9a0" staerke={0.7} />
        <Lasur form={[...kurve(kamm, 4), [2800, 1440] as P, [-200, 1440] as P]} farbe="#b8607e" deckung={0.95} seed="bberg" schichten={7} streuung={0.35} kante="#6a2a5a" />
        <Lasur form={kurve([[-200, 820], [400, 740], [900, 790], [1400, 730], [2000, 780], [2800, 740], [2800, 1440], [-200, 1440]], 6)} farbe="#3f7f68" deckung={1} seed="bhuegel" schichten={7} streuung={0.4} kante="#2f5a48" />
        {/* Goldfluss */}
        <g filter="url(#bloomB)" opacity={0.8} style={{ mixBlendMode: "screen" }}>
          <Strich punkte={FLUSS} breite={150} farbe="#ffb830" seed="bfg" zittern={0} opts={{ start: { taper: 0 }, end: { taper: 900 } }} />
        </g>
        <Strich punkte={FLUSS} breite={120} farbe="#f6b93a" seed="bf" zittern={0} opts={{ start: { taper: 0 }, end: { taper: 900 } }} />
        <Strich punkte={FLUSS} breite={40} farbe="#fff2b0" deckung={0.8} seed="bfk" zittern={0} opts={{ start: { taper: 0 }, end: { taper: 800 } }} />
        <Gluehwuermchen seed="bgw" pfadPunkte={[[200, 1300], [800, 1000], [1400, 860], [2000, 760], [2500, 600]]} anzahl={120} tempo={0} streuung={220} groesse={7} />
        {[[180, 900, 360], [420, 860, 240], [2160, 880, 300], [2400, 920, 380]].map(([x, y, h], i) => (
          <Baum key={i} x={x} y={y} hoehe={h} seed={"bb" + i} farben={ABEND} bueschel={18} wind={0} />
        ))}
        {/* sicherer Bereich: x 507–2053, y 508–931 */}
        <Leuchten x={1280} y={720} r={760} ry={240} farbe="#3a1430" staerke={0.35} blend="multiply" />
        <Mika x={780} y={1120} skala={1.05} pose={{ ...POSEN.stehen, blick: [0.6, -0.3], kopfNeig: -6, drehung: 0.3 }} mimik="erleichtert" seed="mika" ohneBeine />
        <g transform="translate(900 640) rotate(14) scale(1.1)">
          <Leuchten x={0} y={0} r={60} farbe="#ffb0a0" staerke={0.8} />
          <Lasur form={kurve([[0, 34], [-38, 2], [-34, -24], [-12, -30], [0, -14], [12, -30], [34, -24], [38, 2], [0, 34]], 5)} farbe="#e9576a" deckung={1} seed="bherz" schichten={4} kante="#7a1a2a" />
        </g>
        <Handschrift text="Herzhirn" x={1440} y={730} groesse={270} farbe="#fff3d6" drehung={-4} kontur="#3a1430" />
        <Handschrift text="Gefühle – und was sie in dir anrichten" x={1450} y={850} groesse={74} farbe="#ffe9a0" drehung={-3} kontur="#3a1430" schrift="hand" />
      </svg>
      <Papier staerke={0.7} vignette="rgba(40,10,40,0.3)" />
    </AbsoluteFill>
  );
};
