// Sonniger Spätnachmittag: kurvige Straße in die Tiefe, schiefe Häuser, Bäume im Wind, Mika auf dem Rad.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { Lasur, Leuchten, Papier, Strich, Schriften } from "../../../../src/herzhirn/komponenten/Pinsel";
import { Baum, Blumenbeet, Staub, Voegel, Wolke, SOMMER } from "../../../../src/herzhirn/komponenten/Natur";
import { Fahrrad, Haus, Laterne, Passant, Waescheleine } from "../../../../src/herzhirn/komponenten/Stadt";
import { Ebene, Kamera } from "../../../../src/herzhirn/komponenten/Kamera";
import { Mika, POSEN, Pose } from "../../../../src/herzhirn/figuren/Mika";
import { band, klecks, kurve, P } from "../../../../src/herzhirn/lib/aquarell";
import { fbm1, rng } from "../../../../src/herzhirn/lib/zufall";

const T = "#2e1d17";

// Straßenkanten von Hand gesetzt (vorne -> Fluchtpunkt), leicht geschwungen
const FL: P[] = kurve([[260, 1100], [600, 920], [700, 800], [860, 690], [1070, 602], [1108, 550]], 8);
const FR: P[] = kurve([[1600, 1100], [1360, 920], [1160, 800], [1120, 700], [1180, 612], [1134, 550]], 8);
const GL: P[] = kurve([[-200, 1060], [330, 870], [540, 760], [760, 665], [1030, 590], [1100, 550]], 8);
const GR: P[] = kurve([[2120, 1060], [1680, 880], [1330, 770], [1230, 690], [1240, 610], [1145, 550]], 8);
const MITTE: P[] = FL.map((p, i) => [(p[0] + FR[i][0]) / 2, (p[1] + FR[i][1]) / 2]);

const Himmel: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="himmelTag" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6fc1c4" />
        <stop offset="0.45" stopColor="#bfe0c8" />
        <stop offset="0.75" stopColor="#f8dca0" />
        <stop offset="1" stopColor="#f6b483" />
      </linearGradient>
    </defs>
    <rect x={-300} y={-300} width={2520} height={1100} fill="url(#himmelTag)" />
    <Lasur form={klecks(500, 120, 700, 200, "hl1", 12, 0.2)} farbe="#8fd0cc" deckung={0.3} seed="hl1" schichten={8} streuung={1.2} kante={false} />
    <Leuchten x={330} y={210} r={420} farbe="#fff0b8" staerke={0.85} />
    <Lasur form={klecks(330, 210, 60, 60, "sonne", 12, 0.05)} farbe="#fff6d6" deckung={0.95} seed="sonne" schichten={5} kante={false} />
  </g>
);

const Ferne: React.FC = () => (
  <g>
    {/* Hügel am Horizont */}
    <Lasur form={kurve([[-200, 560], [100, 470], [400, 500], [700, 440], [1000, 490], [1300, 430], [1600, 480], [2100, 450], [2100, 650], [-200, 650]], 6)} farbe="#c99ab0" deckung={0.7} seed="huegel1" schichten={7} streuung={0.6} kante={false} />
    <Lasur form={kurve([[-200, 590], [200, 520], [600, 560], [1000, 520], [1400, 545], [1800, 510], [2100, 540], [2100, 680], [-200, 680]], 6)} farbe="#8fb59a" deckung={0.8} seed="huegel2" schichten={7} streuung={0.6} kante={false} />
    {/* kleine Kirchturm-Silhouette + ferne Bäumchen */}
    <Lasur form={[[1250, 520], [1262, 452], [1274, 520]]} farbe="#a88aa8" deckung={0.7} seed="turm" schichten={3} kante={false} />
    {Array.from({ length: 14 }).map((_, i) => {
      const r = rng("fb" + i);
      const x = 80 + i * 140 + r() * 60;
      const y = 540 + Math.sin(i) * 14;
      return <Lasur key={i} form={klecks(x, y, 22 + r() * 14, 18 + r() * 10, "fbb" + i, 9, 0.2)} farbe={i % 2 ? "#6f9a7a" : "#7fa884"} deckung={0.8} seed={"fbb" + i} schichten={3} kante={false} />;
    })}
  </g>
);

const Fahrbahn: React.FC = () => {
  const frame = useCurrentFrame();
  const striche: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const u = (((i / 12 - frame * 0.004) % 1) + 1) % 1;
    const k = Math.pow(u, 2.2); // vorne große Abstände, hinten eng
    const idx = Math.floor(k * (MITTE.length - 3));
    const a = MITTE[MITTE.length - 1 - idx];
    const b = MITTE[Math.max(0, MITTE.length - 2 - idx)];
    const w = 2 + (1 - k) * 0 + (a[1] - 540) * 0.025;
    striche.push(<Strich key={i} punkte={[a, b]} breite={w} farbe="#fff4dc" deckung={0.85} seed={"ms" + i} zittern={0.3} opts={{ thinning: 0.2 }} />);
  }
  return (
    <g>
      {/* Wiese unter allem */}
      <Lasur form={[[-300, 552], [2220, 552], [2220, 1300], [-300, 1300]]} farbe="#7cb35a" deckung={1} seed="wiese" schichten={6} streuung={0.2} kante={false} />
      <Lasur form={klecks(400, 900, 600, 200, "wl", 12, 0.2)} farbe="#a8cf62" deckung={0.4} seed="wl" schichten={6} kante={false} />
      <Lasur form={klecks(1600, 950, 500, 200, "wr", 12, 0.2)} farbe="#5f9a4a" deckung={0.4} seed="wr" schichten={6} kante={false} />
      {/* Gehwege */}
      <Lasur form={[...GL, ...[...FL].reverse()]} farbe="#f1d8bc" deckung={1} seed="gl" schichten={5} streuung={0.2} kante="#a8785a" />
      <Lasur form={[...FR, ...[...GR].reverse()]} farbe="#f1d8bc" deckung={1} seed="gr" schichten={5} streuung={0.2} kante="#a8785a" />
      {/* Fahrbahn: warmes Pflaster statt grauem Asphalt */}
      <Lasur form={[...FL, ...[...FR].reverse()]} farbe="#d4a47c" deckung={1} seed="fahrbahn" schichten={7} streuung={0.2} kante="#7a4a3a" />
      <Lasur form={klecks(960, 930, 300, 70, "sf1", 10, 0.2)} farbe="#f8d8a0" deckung={0.45} seed="sf1" schichten={5} kante={false} />
      <Lasur form={klecks(700, 1010, 260, 40, "bs1", 12, 0.25)} farbe="#8a6aa0" deckung={0.22} seed="bs1" schichten={5} kante={false} />
      <Lasur form={klecks(1100, 720, 120, 18, "bs2", 12, 0.25)} farbe="#8a6aa0" deckung={0.2} seed="bs2" schichten={5} kante={false} />
      {/* Pflaster-Andeutungen */}
      {Array.from({ length: 30 }).map((_, i) => {
        const r = rng("pf" + i);
        const t = r();
        const y = 560 + Math.pow(t, 1.4) * 520;
        const idx = Math.min(FL.length - 1, Math.floor((1 - Math.pow(t, 1)) * (FL.length - 1)));
        const x0 = FL[FL.length - 1 - Math.floor(t * (FL.length - 1))][0];
        const x1 = FR[FR.length - 1 - Math.floor(t * (FR.length - 1))][0];
        const x = x0 + (x1 - x0) * r();
        const g = 4 + t * 16;
        void idx;
        return <Strich key={i} punkte={[[x - g, y], [x, y - g * 0.15], [x + g, y]]} breite={1 + t * 2} farbe="#9a6a4a" deckung={0.35} seed={"pfs" + i} />;
      })}
      {striche}
      <Strich punkte={FL.filter((_, i) => i % 2 === 0)} breite={3} farbe="#8a5a4a" deckung={0.55} seed="bord1" />
      <Strich punkte={FR.filter((_, i) => i % 2 === 0)} breite={3} farbe="#8a5a4a" deckung={0.55} seed="bord2" />
    </g>
  );
};

// 2-Gelenk-Bein für die Pedale: Knie aus Hüfte und Fuß berechnen
const knieIK = (h: P, f: P, l1: number, l2: number, vor: number): P => {
  const dx = f[0] - h[0];
  const dy = f[1] - h[1];
  const d = Math.min(l1 + l2 - 1, Math.hypot(dx, dy));
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const hh = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mx = h[0] + (dx * a) / d;
  const my = h[1] + (dy * a) / d;
  return [mx - (dy * hh) / d * vor, my + (dx * hh) / d * vor];
};

export const Strasse: React.FC<{ noten?: boolean }> = ({ noten = false }) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, 150], [1.0, 1.08], { easing: Easing.inOut(Easing.cubic), extrapolateRight: "clamp" });
  const px = interpolate(frame, [0, 150], [-30, 40], { extrapolateRight: "clamp" });

  // Fahrrad + Pose aus Kurbelwinkel
  const w = frame * 0.16;
  const kurbel: P = [80, 140];
  const f0: P = [kurbel[0] + Math.cos(w) * 38, kurbel[1] + Math.sin(w) * 38];
  const f1: P = [kurbel[0] - Math.cos(w) * 38, kurbel[1] - Math.sin(w) * 38];
  const hu: P = [-10, 0];
  const pose: Pose = {
    ...POSEN.radfahren,
    fuss: [f0, f1],
    knie: [knieIK(hu, f0, 120, 125, -1), knieIK(hu, f1, 120, 125, -1)],
    huefte: [hu, [hu[0] + 14, hu[1]]],
  };
  const radX = interpolate(frame, [0, 150], [700, 860]);
  const huepf = Math.abs(Math.sin(frame * 0.3)) * 2;

  return (
    <AbsoluteFill style={{ background: "#bfe0c8" }}>
      <Schriften />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Kamera kam={{ x: px, y: 0, zoom: z, fx: 1060, fy: 560 }}>
          <Ebene tiefe={0.05}>
            <Himmel />
          </Ebene>
          <Ebene tiefe={0.15}>
            <Wolke x={700} y={170} b={420} seed="wo1" tempo={0.25} />
            <Wolke x={1500} y={120} b={520} seed="wo2" tempo={0.18} />
            <Wolke x={1150} y={300} b={260} seed="wo3" tempo={0.3} deckung={0.7} />
            <Voegel seed="vg" y={250} anzahl={6} />
          </Ebene>
          <Ebene tiefe={0.3}>
            <Ferne />
          </Ebene>
          <Ebene tiefe={0.7}>
            <Fahrbahn />
            {/* ferne Häuser + Bäume (klein, einfacher) */}
            <Haus x={940} y={570} b={70} h={70} seed="h9" detail={0.3} />
            <Haus x={1210} y={566} b={80} h={84} seed="h10" detail={0.3} licht={-1} />
            <Haus x={860} y={600} b={110} h={110} seed="h7" detail={0.45} />
            <Haus x={1290} y={600} b={120} h={120} seed="h8" detail={0.45} />
            <Baum x={1010} y={584} hoehe={110} seed="bf1" bueschel={12} />
            <Baum x={1180} y={590} hoehe={120} seed="bf2" bueschel={12} />
            <Haus x={720} y={660} b={190} h={190} seed="h5" detail={0.7} farbe="#9fd3c7" />
            <Haus x={1460} y={660} b={210} h={200} seed="h6" detail={0.7} farbe="#f4d58d" />
            <Passant x={830} y={676} skala={0.55} seed="p1" richtung={1} />
            <Passant x={1330} y={680} skala={0.55} seed="p2" richtung={-1} tempo={0.8} />
            <Baum x={870} y={690} hoehe={230} seed="bm1" bueschel={18} />
            <Baum x={1300} y={694} hoehe={250} seed="bm2" bueschel={18} />
          </Ebene>
          <Ebene tiefe={0.9}>
            <Haus x={400} y={790} b={360} h={400} seed="h3" farbe="#f2b38a" balkon />
            <Haus x={1640} y={790} b={380} h={400} seed="h4" farbe="#e98b7a" balkon />
            <Waescheleine von={[560, 520]} bis={[700, 540]} seed="wl" skala={0.8} />
            <Passant x={640} y={830} skala={0.85} seed="p3" richtung={1} tempo={0.9} />
            <Passant x={1450} y={840} skala={0.9} seed="p4" richtung={-1} tempo={1.1} />
          </Ebene>
          <Ebene tiefe={1}>
            <Baum x={110} y={900} hoehe={600} seed="bv1" bueschel={30} />
            {/* Mika auf dem Rad */}
            <g transform={`translate(${radX} ${-huepf})`}>
              <Fahrrad x={0} y={770} skala={0.78} winkel={w} />
              {noten
                ? [0, 1, 2, 3].map((k) => {
                    const t = ((frame + k * 30) % 120) / 120;
                    const nx = 60 + t * 260 + Math.sin(t * 8 + k) * 20;
                    const ny = 520 - t * 300;
                    return (
                      <g key={k} opacity={Math.sin(t * Math.PI)} transform={`translate(${nx} ${ny}) rotate(${Math.sin(t * 6) * 15})`}>
                        {k % 2 ? (
                          <g transform="scale(0.8)"><Lasur form={kurve([[0, 34], [-38, 2], [-34, -24], [-12, -30], [0, -14], [12, -30], [34, -24], [38, 2], [0, 34]], 5)} farbe="#e9576a" deckung={1} seed={"nh" + k} schichten={3} kante="#7a1a2a" /></g>
                        ) : (
                          <g>
                            <Lasur form={klecks(0, 0, 16, 12, "nk" + k, 8, 0.05, -0.4)} farbe={T} deckung={1} seed={"nk" + k} schichten={2} kante={false} />
                            <Strich punkte={[[14, -4], [16, -70], [40, -52]]} breite={6} farbe={T} seed={"ns" + k} weich={false} />
                          </g>
                        )}
                      </g>
                    );
                  })
                : null}
              <Mika x={-6} y={768} skala={0.78} pose={pose} mimik="aufgeregt" kopfhoerer seed="mika" />
            </g>
            <Laterne x={300} y={960} skala={1.1} seed="lat1" />
            <Blumenbeet x={190} y={1040} b={420} seed="bb1" skala={1.3} />
            <Blumenbeet x={1620} y={1000} b={360} seed="bb2" skala={1.1} />
            <Blumenbeet x={1330} y={820} b={200} seed="bb3" skala={0.7} dichte={0.6} />
            <Staub seed="pollen" bereich={[0, 200, 1920, 800]} anzahl={35} farbe="#fff6cf" groesse={2.4} />
          </Ebene>
          <Ebene tiefe={1.2}>
            <Baum x={1900} y={1140} hoehe={760} seed="bv2" bueschel={30} farben={SOMMER} />
          </Ebene>
        </Kamera>
        {/* warmes Gegenlicht über allem */}
        <Leuchten x={330} y={210} r={900} ry={700} farbe="#ffd9a0" staerke={0.25} blend="soft-light" />
      </svg>
      <Papier vignette="rgba(120,60,40,0.3)" />
    </AbsoluteFill>
  );
};
