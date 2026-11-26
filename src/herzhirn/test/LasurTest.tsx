import React from "react";
import { AbsoluteFill } from "remotion";
import { Lasur, Papier, Strich, Schriften, Handschrift, Leuchten } from "../komponenten/Pinsel";
import { klecks, viereck } from "../lib/aquarell";
export const LasurTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#f6ecd9" }}>
    <Schriften />
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <Lasur form={klecks(500, 500, 320, 220, "a")} farbe="#e8a23a" seed="a" schichten={10} />
      <Lasur form={klecks(700, 560, 260, 200, "b")} farbe="#e0604a" seed="b" schichten={10} deckung={0.6} />
      <Lasur form={klecks(1300, 450, 300, 260, "c", 12, 0.25)} farbe="#2f9c8f" seed="c" schichten={12} streuung={1.4} />
      <Lasur form={viereck([[1100, 750], [1500, 740], [1510, 980], [1090, 990]], "d", 4)} farbe="#5d7fb8" seed="d" schichten={8} streuung={0.6} />
      <Strich punkte={[[200, 900], [400, 860], [600, 920], [800, 870]]} breite={7} seed="s" />
      <Leuchten x={1300} y={450} r={200} farbe="#ffd27a" />
      <Handschrift text="Dopamin" x={960} y={200} groesse={110} farbe="#b5651d" />
    </svg>
    <Papier />
  </AbsoluteFill>
);
