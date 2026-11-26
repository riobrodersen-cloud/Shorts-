import React from "react";
import { AbsoluteFill } from "remotion";
import { Papier, Schriften, Handschrift } from "../komponenten/Pinsel";
import { Mika, POSEN, Mimik } from "../figuren/Mika";
const mimiken: Mimik[] = ["sehnsuechtig", "aufgeregt", "nervoes", "erschoepft", "erleichtert"];
export const MikaTest: React.FC = () => (
  <AbsoluteFill style={{ background: "#f4e6cf" }}>
    <Schriften />
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <Mika x={260} y={720} pose={POSEN.stehen} mimik="neutral" skala={0.95} />
      <Mika x={760} y={760} pose={POSEN.sitztHandy} mimik="sehnsuechtig" handy handyLicht={1} skala={0.95} />
      <Mika x={1300} y={720} pose={POSEN.radfahren} mimik="aufgeregt" kopfhoerer skala={0.95} />
      {mimiken.map((m, i) => (
        <g key={m}>
          <g transform={`translate(${1560 + (i % 2) * 190} ${140 + Math.floor(i / 2) * 300}) scale(0.9)`}>
            <Mika x={0} y={290} pose={POSEN.stehen} mimik={m} skala={1} seed={"m" + i} />
          </g>
          <Handschrift text={m} x={1560 + (i % 2) * 190} y={300 + Math.floor(i / 2) * 300} groesse={30} />
        </g>
      ))}
    </svg>
    <Papier />
  </AbsoluteFill>
);
