// Mika – Hauptfigur von "Herzhirn". ~20 Jahre, geschlechtsneutral, wuschelige dunkle Locken,
// übergroßer senffarbener Hoodie, weite Hose, Sneaker. Gezeichnet als Gelenk-Puppe aus
// Pinselstrichen (perfect-freehand) und Aquarell-Lasuren, damit Posen frei kombinierbar sind.
import React from "react";
import { useCurrentFrame } from "remotion";
import { kurve, klecks, P, pfad } from "../lib/aquarell";
import { fbm1, rng, zwischen } from "../lib/zufall";
import { Lasur, Leuchten, Strich, strichPfad } from "../komponenten/Pinsel";

export const MIKA_FARBEN = {
  haut: "#eab48e",
  hautSchatten: "#c7826a",
  wange: "#d9826a",
  haar: "#2a1c19",
  haarLicht: "#6a4334",
  hoodie: "#e0a43a",
  hoodieSchatten: "#b8742a",
  hoodieLicht: "#f6cf6a",
  hose: "#5f8f86",
  hoseSchatten: "#3f6862",
  schuh: "#f3eadb",
  schuhAkzent: "#e86a52",
  tusche: "#2e1d17",
  auge: "#3d2416",
  augeRing: "#8a5530",
};

export type Mimik = "sehnsuechtig" | "aufgeregt" | "nervoes" | "erschoepft" | "erleichtert" | "neutral" | "staunend";

export type Pose = {
  kopf: P; // Kopfmitte
  kopfNeig?: number; // Grad
  drehung?: number; // -1 (nach links) .. 1 (nach rechts) – verschiebt das Gesicht
  blick?: P; // -1..1 Pupillenrichtung
  schulter: [P, P]; // [links im Bild, rechts im Bild]
  ellbogen: [P, P];
  hand: [P, P];
  huefte: [P, P];
  knie: [P, P];
  fuss: [P, P];
  saum?: number; // y des Hoodie-Saums
  armHinten?: [boolean, boolean]; // Arm hinter dem Körper zeichnen
  beinVorne?: [boolean, boolean]; // Bein über dem Hoodie zeichnen (z. B. Schneidersitz)
};

// ------------------------------- Posen ---------------------------------------
export const POSEN = {
  stehen: {
    kopf: [0, -268], schulter: [[-74, -196], [74, -196]], ellbogen: [[-98, -104], [98, -104]], hand: [[-90, -18], [90, -18]],
    huefte: [[-40, -5], [40, -5]], knie: [[-44, 140], [46, 140]], fuss: [[-54, 285], [56, 285]], saum: -5,
  } as Pose,
  // Schneidersitz auf dem Bett, Handy mit beiden Händen vor der Brust
  sitztHandy: {
    kopf: [0, -266], kopfNeig: 5, blick: [0.1, 0.75], schulter: [[-76, -196], [76, -196]], ellbogen: [[-112, -100], [108, -98]], hand: [[-30, -128], [28, -130]],
    huefte: [[-46, 0], [46, 0]], knie: [[-150, 28], [150, 28]], fuss: [[40, 40], [-40, 44]], saum: 6, beinVorne: [true, true],
  } as Pose,
  // Sitzt auf einer Bank (Bus), Handy in beiden Händen
  sitztBus: {
    kopf: [0, -266], kopfNeig: 6, blick: [0, 0.8], schulter: [[-76, -196], [76, -196]], ellbogen: [[-104, -96], [100, -96]], hand: [[-26, -120], [24, -122]],
    huefte: [[-44, 0], [44, 0]], knie: [[-56, 50], [56, 52]], fuss: [[-62, 190], [64, 192]], saum: 10, beinVorne: [true, true],
  } as Pose,
  // Steht, Handy vor der Brust
  stehtHandy: {
    kopf: [0, -268], kopfNeig: 5, blick: [0, 0.75], schulter: [[-74, -196], [74, -196]], ellbogen: [[-100, -100], [98, -100]], hand: [[-24, -124], [24, -126]],
    huefte: [[-40, -5], [40, -5]], knie: [[-44, 140], [46, 140]], fuss: [[-54, 285], [56, 285]], saum: -5,
  } as Pose,
  // Steht am Fenster (Rückenansicht), öffnet es mit beiden Armen
  fensterAuf: {
    kopf: [0, -268], schulter: [[-74, -196], [74, -196]], ellbogen: [[-130, -250], [130, -250]], hand: [[-150, -330], [150, -330]],
    huefte: [[-40, -5], [40, -5]], knie: [[-44, 140], [46, 140]], fuss: [[-54, 285], [56, 285]], saum: -5,
  } as Pose,
  // Fahrrad, leicht seitlich (3/4-Ansicht nach rechts)
  radfahren: {
    kopf: [34, -266], kopfNeig: -4, drehung: 0.55, blick: [0.7, -0.1], schulter: [[-14, -190], [70, -192]], ellbogen: [[70, -116], [128, -110]], hand: [[156, -56], [172, -54]],
    huefte: [[-20, -4], [24, -4]], knie: [[90, 70], [110, 40]], fuss: [[60, 190], [140, 150]], saum: -4, armHinten: [true, false],
  } as Pose,
} satisfies Record<string, Pose>;

// ------------------------------- Bausteine ------------------------------------
const glied = (pts: P[], breite: number, farbe: string, tusche: string, seed: string, schatten?: string) => (
  <g>
    <Strich punkte={pts} breite={breite + 6} farbe={tusche} deckung={0.92} seed={seed + "o"} zittern={0.6} opts={{ thinning: 0.08, simulatePressure: false, start: { taper: 0, cap: true }, end: { taper: 0, cap: true } }} />
    <Strich punkte={pts} breite={breite} farbe={farbe} deckung={1} seed={seed + "f"} zittern={0.6} opts={{ thinning: 0.05, simulatePressure: false, start: { taper: 0, cap: true }, end: { taper: 0, cap: true } }} />
    {schatten ? (
      <Strich punkte={pts.map(([x, y]) => [x + breite * 0.22, y + 2] as P)} breite={breite * 0.38} farbe={schatten} deckung={0.45} seed={seed + "s"} zittern={0.6} opts={{ thinning: 0.3 }} />
    ) : null}
  </g>
);

const mitte = (a: P, b: P, k = 0.5): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

const Hand: React.FC<{ p: P; winkel: number; seed: string; g?: number }> = ({ p, winkel, seed, g = 1 }) => {
  const F = MIKA_FARBEN;
  return (
    <g transform={`translate(${p[0]} ${p[1]}) rotate(${winkel}) scale(${g})`}>
      <Lasur form={klecks(0, 0, 17, 14, seed, 9, 0.08)} farbe={F.haut} deckung={1} seed={seed} schichten={4} streuung={0.3} kante={F.hautSchatten} />
      {[-9, -3, 3, 9].map((dx, i) => (
        <Strich key={i} punkte={[[dx, 6], [dx * 1.05, 17 - Math.abs(dx) * 0.3]]} breite={7} farbe={F.haut} deckung={1} seed={seed + i} zittern={0.3} opts={{ thinning: 0.1, start: { taper: 0, cap: true }, end: { taper: 0, cap: true } }} />
      ))}
      <path d={strichPfad(kurve([[-14, -6], [-18, 4], [-12, 14]], 4), 2.4)} fill={F.tusche} opacity={0.7} />
    </g>
  );
};

const Schuh: React.FC<{ p: P; richtung: number; seed: string }> = ({ p, richtung, seed }) => {
  const F = MIKA_FARBEN;
  const d = richtung;
  return (
    <g transform={`translate(${p[0]} ${p[1]})`}>
      <Lasur form={kurve([[-24 * d, -14], [10 * d, -16], [40 * d, -2], [42 * d, 12], [-26 * d, 14], [-24 * d, -14]], 4)} farbe={F.schuh} deckung={1} seed={seed} schichten={4} streuung={0.3} kante={F.tusche} />
      <Strich punkte={[[-22 * d, 12], [40 * d, 10]]} breite={5} farbe={F.tusche} deckung={0.8} seed={seed + "s"} opts={{ thinning: 0.2 }} />
      <Strich punkte={[[-6 * d, -6], [12 * d, 2], [26 * d, -2]]} breite={6} farbe={F.schuhAkzent} deckung={0.9} seed={seed + "a"} />
    </g>
  );
};

// ------------------------------- Kopf ----------------------------------------
const Kopf: React.FC<{ mimik: Mimik; blick: P; drehung: number; frame: number; seed: string; blinzeln: number; handyLicht: number; hinten?: boolean; lichtFarbe?: string }> = ({ mimik, blick, drehung, frame, seed, blinzeln, handyLicht, hinten = false, lichtFarbe = "#bfe6ff" }) => {
  const F = MIKA_FARBEN;
  const R = 72;
  const fx = drehung * R * 0.28; // Gesichtsverschiebung bei Drehung
  const t = frame / 30;

  // Gesichtsform: weich, kleines Kinn
  const gesicht = kurve([
    [0, -R * 0.98], [R * 0.86, -R * 0.55], [R * 0.95, R * 0.05], [R * 0.84 + fx * 0.3, R * 0.6], [R * 0.4 + fx * 0.4, R * 0.92], [fx * 0.5, R * 0.97], [-R * 0.4 + fx * 0.4, R * 0.92], [-R * 0.84 + fx * 0.3, R * 0.6], [-R * 0.95, R * 0.05], [-R * 0.86, -R * 0.55], [0, -R * 0.98],
  ], 5);

  // Mimik-Parameter
  const M = {
    sehnsuechtig: { lid: 0.32, braueInnen: 10, braueAussen: -2, mund: "sehnsucht" },
    aufgeregt: { lid: 0, braueInnen: 12, braueAussen: 12, mund: "lacht" },
    nervoes: { lid: 0.12, braueInnen: 12, braueAussen: 0, mund: "wellig" },
    erschoepft: { lid: 0.55, braueInnen: 4, braueAussen: -6, mund: "flach" },
    erleichtert: { lid: 0.38, braueInnen: 2, braueAussen: 4, mund: "laecheln" },
    neutral: { lid: 0.15, braueInnen: 0, braueAussen: 0, mund: "laecheln-klein" },
    staunend: { lid: 0, braueInnen: 14, braueAussen: 14, mund: "o" },
  }[mimik];
  const lid = Math.min(1, M.lid + blinzeln * (1 - M.lid));

  const auge = (seite: -1 | 1) => {
    const ax = seite * R * 0.4 + fx;
    const ay = R * 0.08;
    const rx = R * 0.215 * (1 - Math.abs(drehung) * (seite === Math.sign(drehung) ? -0.05 : 0.18));
    const ry = R * 0.255;
    const ix = ax + blick[0] * rx * 0.35;
    const iy = ay + blick[1] * ry * 0.3;
    const deckel = ay - ry + lid * ry * 2;
    const clip = `aug${seed}${seite}`;
    return (
      <g key={seite}>
        <defs>
          <clipPath id={clip}>
            <ellipse cx={ax} cy={ay} rx={rx} ry={ry} />
          </clipPath>
        </defs>
        <ellipse cx={ax} cy={ay} rx={rx} ry={ry} fill="#fffaf0" />
        <g clipPath={`url(#${clip})`}>
          <circle cx={ix} cy={iy} r={R * 0.175} fill={F.augeRing} />
          <circle cx={ix} cy={iy} r={R * 0.14} fill={F.auge} />
          <circle cx={ix} cy={iy} r={R * 0.07} fill="#120a07" />
          <circle cx={ix + R * 0.06} cy={iy - R * 0.07} r={R * 0.05} fill="#fff" />
          <circle cx={ix - R * 0.05} cy={iy + R * 0.06} r={R * 0.022} fill="#fff" opacity={0.85} />
          {handyLicht > 0 ? <ellipse cx={ix - R * 0.02} cy={iy + R * 0.02} rx={R * 0.05} ry={R * 0.03} fill="#cfefff" opacity={0.9 * handyLicht} /> : null}
          {/* Augenlid (Hautfarbe von oben) */}
          <rect x={ax - rx - 2} y={ay - ry - 30} width={rx * 2 + 4} height={Math.max(0, deckel - (ay - ry) + 30)} fill={F.haut} />
          <ellipse cx={ax} cy={ay} rx={rx} ry={ry} fill="none" stroke={F.hautSchatten} strokeWidth={3} opacity={0.35} />
        </g>
        {/* Oberlid-Linie: kräftiger Pinselstrich */}
        <Strich punkte={[[ax - rx * 1.08, deckel + ry * 0.35 * (1 - lid)], [ax - rx * 0.3, deckel - ry * 0.12 * (1 - lid)], [ax + rx * 0.5, deckel - ry * 0.08 * (1 - lid)], [ax + rx * 1.1, deckel + ry * 0.3 * (1 - lid)]]} breite={4.4} farbe={F.tusche} seed={`${seed}lid${seite}`} zittern={0.4} opts={{ start: { taper: 4 }, end: { taper: 14 } }} />
        {/* Augenbraue */}
        <Strich
          punkte={[
            [ax - seite * rx * 0.75, ay - ry - 16 - (seite === 1 ? M.braueInnen : M.braueInnen) * 0.9],
            [ax, ay - ry - 17 - (M.braueInnen + M.braueAussen) * 0.45],
            [ax + seite * rx * 0.95, ay - ry - 14 - M.braueAussen * 0.7],
          ]}
          breite={10}
          farbe={F.haar}
          seed={`${seed}br${seite}`}
          zittern={0.5}
          opts={{ start: { taper: 2 }, end: { taper: 10 } }}
        />
      </g>
    );
  };

  const mx = fx * 1.1;
  const my = R * 0.6;
  const mund = (() => {
    switch (M.mund) {
      case "lacht":
        return (
          <g>
            <path d={`M${mx - 20} ${my - 6} Q${mx} ${my + 26} ${mx + 20} ${my - 6} Q${mx} ${my} ${mx - 20} ${my - 6}Z`} fill="#6e2a22" />
            <path d={`M${mx - 10} ${my + 8} Q${mx} ${my + 18} ${mx + 10} ${my + 8} Q${mx} ${my + 4} ${mx - 10} ${my + 8}Z`} fill="#e47b6a" />
            <Strich punkte={[[mx - 22, my - 8], [mx, my - 3], [mx + 22, my - 8]]} breite={4} farbe={F.tusche} seed={seed + "m"} />
          </g>
        );
      case "o":
        return <ellipse cx={mx} cy={my + 2} rx={8} ry={11} fill="#6e2a22" />;
      case "wellig":
        return <Strich punkte={[[mx - 16, my], [mx - 8, my - 4], [mx, my + 1], [mx + 8, my - 4], [mx + 16, my]]} breite={4} farbe={F.tusche} seed={seed + "m"} />;
      case "flach":
        return <Strich punkte={[[mx - 12, my + 2], [mx, my + 3], [mx + 12, my + 2]]} breite={4} farbe={F.tusche} seed={seed + "m"} />;
      case "laecheln":
        return <Strich punkte={[[mx - 18, my - 4], [mx - 6, my + 5], [mx + 8, my + 5], [mx + 19, my - 5]]} breite={4.4} farbe={F.tusche} seed={seed + "m"} />;
      case "sehnsucht":
        return (
          <g>
            <Strich punkte={[[mx - 12, my + 1], [mx, my - 3], [mx + 12, my + 1]]} breite={3.6} farbe={F.tusche} seed={seed + "m"} />
          </g>
        );
      default:
        return <Strich punkte={[[mx - 12, my], [mx, my + 4], [mx + 12, my - 1]]} breite={4} farbe={F.tusche} seed={seed + "m"} />;
    }
  })();

  // Locken: unregelmäßige Kringel in mehreren Lagen, die leicht wippen
  const locken = React.useMemo(() => {
    const r = rng(seed + "locken");
    const arr: { x: number; y: number; g: number; dreh: number; i: number; vorne: boolean; form: string }[] = [];
    let i = 0;
    const neu = (x: number, y: number, g: number, vorne: boolean) => {
      const k = klecks(0, 0, g, g * zwischen(r, 0.8, 1), seed + "lk" + i, 7, 0.16, r() * 6);
      arr.push({ x, y, g, dreh: r() * 360, i: i++, vorne, form: pfad(kurve([...k, k[0]], 3)) });
    };
    // äußerer Rand (oben + Seiten), zwei Lagen
    for (let lage = 0; lage < 2; lage++) {
      const n = lage ? 26 : 30;
      for (let j = 0; j < n; j++) {
        const a = Math.PI * (0.92 + (j / (n - 1)) * 1.16);
        const rr = R * (lage ? zwischen(r, 0.95, 1.12) : zwischen(r, 1.1, 1.32));
        neu(Math.cos(a) * rr * 1.1, Math.sin(a) * rr - R * 0.18, zwischen(r, 12, 24) * (lage ? 0.9 : 1), false);
      }
    }
    // Seiten bis zum Kiefer
    for (let j = 0; j < 10; j++) {
      const sx = j % 2 ? 1 : -1;
      neu(sx * R * zwischen(r, 0.95, 1.18), R * zwischen(r, -0.25, 0.42), zwischen(r, 12, 19), false);
    }
    // Stirnlocken (fallen tief in die Stirn)
    for (let j = 0; j < 9; j++) {
      neu(R * (-0.78 + j * 0.195) + zwischen(r, -5, 5), -R * zwischen(r, 0.38, 0.58), zwischen(r, 12, 19), true);
    }
    return arr;
  }, [seed, R]);

  const kringel = (l: (typeof locken)[number]) => {
    const wx = fbm1(t * 0.9 + l.i * 0.5, l.i) * 2.2;
    const wy = fbm1(t * 1.1 + l.i * 0.7, l.i + 50) * 1.8;
    const pts: P[] = Array.from({ length: 8 }, (_, k) => {
      const a = (k / 7) * Math.PI * 1.5 + (l.dreh * Math.PI) / 180;
      const rr = l.g * (0.45 + k * 0.05);
      return [Math.cos(a) * rr, Math.sin(a) * rr * 0.9] as P;
    });
    return (
      <g key={l.i} transform={`translate(${(l.x + wx).toFixed(1)} ${(l.y + wy).toFixed(1)})`}>
        <path d={l.form} fill={F.haar} />
        <Strich punkte={pts} breite={3.6} farbe={F.haarLicht} deckung={0.6} seed={`${seed}k${l.i}`} zittern={0.4} />
      </g>
    );
  };

  if (hinten) {
    return (
      <g>
        <Lasur form={kurve([[-R * 0.32, R * 0.6], [R * 0.32, R * 0.6], [R * 0.36, R * 1.12], [-R * 0.36, R * 1.12], [-R * 0.32, R * 0.6]], 3)} farbe={F.hautSchatten} deckung={1} seed={seed + "hals"} schichten={3} streuung={0.2} kante={false} />
        <Lasur form={klecks(-R * 0.95, R * 0.12, R * 0.15, R * 0.22, seed + "ohr", 8, 0.06)} farbe={F.haut} deckung={1} seed={seed + "ohr"} schichten={3} streuung={0.2} kante={F.hautSchatten} />
        <Lasur form={klecks(R * 0.95, R * 0.12, R * 0.15, R * 0.22, seed + "ohr2", 8, 0.06)} farbe={F.haut} deckung={1} seed={seed + "ohr2"} schichten={3} streuung={0.2} kante={F.hautSchatten} />
        <Lasur form={klecks(0, -R * 0.1, R * 1.2, R * 1.12, seed + "hm", 12, 0.07)} farbe={F.haar} deckung={1} seed={seed + "hm"} schichten={4} streuung={0.6} kante={false} />
        {locken.map(kringel)}
        {locken.filter((l) => l.vorne).map((l) => kringel({ ...l, y: l.y + R * 0.7, i: l.i + 200 }))}
      </g>
    );
  }

  return (
    <g>
      {/* Haar-Masse hinter dem Kopf */}
      <Lasur form={klecks(0, -R * 0.12, R * 1.28, R * 1.12, seed + "hm", 12, 0.07)} farbe={F.haar} deckung={1} seed={seed + "hm"} schichten={4} streuung={0.6} kante={false} />
      {locken.filter((l) => !l.vorne).map(kringel)}
      {/* Hals */}
      <Lasur form={kurve([[-R * 0.32, R * 0.6], [R * 0.32, R * 0.6], [R * 0.36, R * 1.12], [-R * 0.36, R * 1.12], [-R * 0.32, R * 0.6]], 3)} farbe={F.hautSchatten} deckung={1} seed={seed + "hals"} schichten={3} streuung={0.2} kante={false} />
      {/* Ohr */}
      <Lasur form={klecks(-R * 0.94 + fx * 0.4, R * 0.12, R * 0.15, R * 0.22, seed + "ohr", 8, 0.06)} farbe={F.haut} deckung={1} seed={seed + "ohr"} schichten={3} streuung={0.2} kante={F.hautSchatten} />
      {/* Gesicht */}
      <Lasur form={gesicht} farbe={F.haut} deckung={1} seed={seed + "g"} schichten={5} streuung={0.25} kante={false} />
      <Lasur form={klecks(R * 0.5 + fx, R * 0.2, R * 0.42, R * 0.55, seed + "gs", 9, 0.1)} farbe={F.hautSchatten} deckung={0.28} seed={seed + "gs"} schichten={4} kante={false} />
      <path d={strichPfad(gesicht.slice(Math.floor(gesicht.length * 0.12), Math.floor(gesicht.length * 0.88)), 4.2, { thinning: 0.5 })} fill={F.tusche} opacity={0.85} />
      {/* Wangen */}
      <Lasur form={klecks(-R * 0.48 + fx, R * 0.42, R * 0.2, R * 0.12, seed + "w1", 8, 0.1)} farbe={F.wange} deckung={0.18} seed={seed + "w1"} schichten={4} kante={false} />
      <Lasur form={klecks(R * 0.48 + fx, R * 0.42, R * 0.2, R * 0.12, seed + "w2", 8, 0.1)} farbe={F.wange} deckung={0.18} seed={seed + "w2"} schichten={4} kante={false} />
      {auge(-1)}
      {auge(1)}
      {/* Nase */}
      <Strich punkte={[[fx * 1.2 + 2, R * 0.22], [fx * 1.2 + 7, R * 0.38], [fx * 1.2 - 3, R * 0.42]]} breite={3.4} farbe={F.hautSchatten} seed={seed + "n"} zittern={0.3} />
      {mund}
      <Lasur form={kurve([[-R * 0.95, -R * 0.15], [-R * 0.7, -R * 0.62], [-R * 0.2, -R * 0.5], [R * 0.3, -R * 0.56], [R * 0.75, -R * 0.45], [R * 0.95, -R * 0.1], [R * 0.9, -R * 1.0], [-R * 0.9, -R * 1.0], [-R * 0.95, -R * 0.15]], 4)} farbe={F.haar} deckung={1} seed={seed + "kappe"} schichten={3} streuung={0.3} kante={false} />
      {/* Stirnlocken über dem Gesicht */}
      {locken.filter((l) => l.vorne).map(kringel)}
      {handyLicht > 0 ? <Leuchten x={fx} y={R * 0.45} r={R * 1.5} ry={R * 1.2} farbe={lichtFarbe} staerke={0.55 * handyLicht} /> : null}
    </g>
  );
};

// ------------------------------- Figur ---------------------------------------
export const Mika: React.FC<{
  x: number;
  y: number;
  skala?: number;
  pose: Pose;
  mimik?: Mimik;
  seed?: string;
  handy?: boolean; // Handy in den Händen
  handyLicht?: number; // 0..1 – Gesicht wird vom Display angestrahlt
  spiegeln?: boolean;
  kopfhoerer?: boolean;
  atemTempo?: number;
  hinten?: boolean; // Rückenansicht
  handyVorne?: boolean; // Display zum Betrachter
  lichtFarbe?: string;
  ohneBeine?: boolean;
}> = ({ x, y, skala = 1, pose, mimik = "neutral", seed = "mika", handy = false, handyLicht = 0, spiegeln = false, kopfhoerer = false, atemTempo = 1, hinten = false, handyVorne = false, lichtFarbe, ohneBeine = false }) => {
  const frame = useCurrentFrame();
  const F = MIKA_FARBEN;
  const t = frame / 30;

  // Atmen + Gewicht verlagern
  const atem = Math.sin(t * 1.6 * atemTempo) * 0.5 + 0.5;
  const sh = -atem * 4; // Schultern heben sich
  const gewicht = fbm1(t * 0.25, 3) * 4;

  // Blinzeln: etwa alle 3–4 s, 5 Frames
  const zyklus = 104;
  const pos = (frame + 37) % zyklus;
  const zweit = (frame + 37) % (zyklus * 3) < zyklus ? 0 : 1;
  const blinzeln = pos < 5 ? Math.sin((pos / 5) * Math.PI) : zweit && pos > 12 && pos < 16 ? Math.sin(((pos - 12) / 4) * Math.PI) * 0.9 : 0;

  const p = pose;
  const S = (q: P): P => [q[0] + gewicht * 0.3, q[1] + sh];
  const schL = S(p.schulter[0]);
  const schR = S(p.schulter[1]);
  const kopf: P = [p.kopf[0] + gewicht * 0.5, p.kopf[1] + sh * 1.1];
  const saum = p.saum ?? -5;
  const nacken: P = [kopf[0] * 0.6, kopf[1] + 66];

  const arm = (i: 0 | 1) => {
    const sch = i === 0 ? schL : schR;
    const ell: P = [p.ellbogen[i][0] + gewicht * 0.2, p.ellbogen[i][1] + sh * 0.6];
    const hand = p.hand[i];
    const pts = kurve([sch, ell, mitte(ell, hand, 0.88)], 5);
    const w = Math.atan2(hand[1] - ell[1], hand[0] - ell[0]) * (180 / Math.PI) - 90;
    return (
      <g key={"arm" + i}>
        {glied(pts, 46, F.hoodie, F.tusche, `${seed}arm${i}`, F.hoodieSchatten)}
        {/* Bündchen */}
        <Strich punkte={[mitte(ell, hand, 0.78), mitte(ell, hand, 0.9)]} breite={40} farbe={F.hoodieSchatten} deckung={0.85} seed={`${seed}b${i}`} opts={{ thinning: 0, start: { taper: 0, cap: true }, end: { taper: 0, cap: true } }} />
        <Hand p={hand} winkel={w} seed={`${seed}h${i}`} />
      </g>
    );
  };

  const bein = (i: 0 | 1) => {
    const h = p.huefte[i];
    const k = p.knie[i];
    const f = p.fuss[i];
    const pts = kurve([h, k, mitte(k, f, 0.9)], 5);
    return (
      <g key={"bein" + i}>
        {glied(pts, 62, F.hose, F.tusche, `${seed}bein${i}`, F.hoseSchatten)}
        <Schuh p={f} richtung={f[0] >= k[0] ? 1 : -1} seed={`${seed}s${i}`} />
      </g>
    );
  };

  // Hoodie-Rumpf: oversized, weich ausgebeult
  const rumpf: P[] = kurve([
    [schL[0] - 2, schL[1] + 10], [schL[0] * 0.45, schL[1] - 8], [schR[0] * 0.45, schR[1] - 8], [schR[0] + 2, schR[1] + 10],
    [schR[0] + 16, schR[1] + 70], [schR[0] + 20, (schR[1] + saum) / 2 + 40], [p.huefte[1][0] + 48, saum - 16], [p.huefte[1][0] + 34, saum + 12], [0, saum + 16],
    [p.huefte[0][0] - 34, saum + 12], [p.huefte[0][0] - 48, saum - 16], [schL[0] - 20, (schL[1] + saum) / 2 + 40], [schL[0] - 16, schL[1] + 70], [schL[0] - 2, schL[1] + 10],
  ], 5);

  return (
    <g transform={`translate(${x} ${y}) scale(${spiegeln ? -skala : skala} ${skala})`}>
      {/* weicher Bodenschatten */}
      <Lasur form={klecks(0, (p.fuss[0][1] + p.fuss[1][1]) / 2 + 16, 170, 22, seed + "bs", 10, 0.1)} farbe="#4a2e2a" deckung={0.25} seed={seed + "bs"} schichten={4} kante={false} />
      {p.armHinten?.[0] ? arm(0) : null}
      {p.armHinten?.[1] ? arm(1) : null}
      {!ohneBeine && !p.beinVorne?.[0] ? bein(0) : null}
      {!ohneBeine && !p.beinVorne?.[1] ? bein(1) : null}
      {/* Kapuze hinter dem Nacken */}
      <Lasur form={klecks(nacken[0], nacken[1] + 4, 74, 36, seed + "kap", 10, 0.08)} farbe={F.hoodieSchatten} deckung={1} seed={seed + "kap"} schichten={4} streuung={0.4} kante={F.tusche} />
      {/* Rumpf */}
      <g transform={`translate(0 ${saum}) scale(1 ${1 + atem * 0.012}) translate(0 ${-saum})`}>
        <Lasur form={rumpf} farbe={F.hoodie} deckung={1} seed={seed + "r"} schichten={6} streuung={0.35} kante={F.tusche} />
        <Lasur form={klecks(schR[0] * 0.5, schR[1] + 120, 60, 110, seed + "rs", 9, 0.12)} farbe={F.hoodieSchatten} deckung={0.4} seed={seed + "rs"} schichten={5} kante={false} />
        <Lasur form={klecks(schL[0] * 0.45, schL[1] + 60, 40, 50, seed + "rl", 9, 0.12)} farbe={F.hoodieLicht} deckung={0.5} seed={seed + "rl"} schichten={4} kante={false} />
        <path d={strichPfad(rumpf.slice(0, Math.floor(rumpf.length * 0.95)), 5, { thinning: 0.55 })} fill={F.tusche} opacity={0.88} />
        {hinten ? <Lasur form={kurve([[nacken[0] - 58, nacken[1] + 4], [nacken[0] + 58, nacken[1] + 4], [nacken[0] + 46, nacken[1] + 96], [nacken[0], nacken[1] + 118], [nacken[0] - 46, nacken[1] + 96], [nacken[0] - 58, nacken[1] + 4]], 4)} farbe={F.hoodieSchatten} deckung={0.9} seed={seed + "kapH"} schichten={4} kante={F.tusche} /> : null}
        {/* Bauchtasche */}
        <Strich punkte={hinten ? [[-50, saum - 8], [50, saum - 8]] : [[-62, saum - 30], [-44, saum - 92], [44, saum - 92], [62, saum - 30]]} breite={3.4} farbe={F.hoodieSchatten} deckung={0.9} seed={seed + "tasche"} weich={false} />
        {/* Falten */}
        <Strich punkte={[[schL[0] + 20, schL[1] + 110], [schL[0] + 38, schL[1] + 150]]} breite={2.6} farbe={F.hoodieSchatten} seed={seed + "f1"} />
        <Strich punkte={[[schR[0] - 26, schR[1] + 120], [schR[0] - 40, schR[1] + 160]]} breite={2.6} farbe={F.hoodieSchatten} seed={seed + "f2"} />
      </g>
      {!ohneBeine && p.beinVorne?.[0] ? bein(0) : null}
      {!ohneBeine && p.beinVorne?.[1] ? bein(1) : null}
      {/* Kopf */}
      <g transform={`translate(${kopf[0]} ${kopf[1]}) rotate(${(p.kopfNeig ?? 0) + fbm1(t * 0.3, 9) * 1.5})`}>
        <Kopf mimik={mimik} blick={p.blick ?? [0, 0]} drehung={p.drehung ?? 0} frame={frame} seed={seed} blinzeln={blinzeln} handyLicht={handyLicht} hinten={hinten} lichtFarbe={lichtFarbe} />
        {kopfhoerer ? (
          <g>
            <Strich punkte={[[-70, 10], [-60, -60], [0, -92], [60, -60], [70, 10]]} breite={9} farbe="#e86a52" seed={seed + "kh"} />
            <Lasur form={klecks(-70, 18, 16, 24, seed + "kh1", 8, 0.06)} farbe="#e86a52" deckung={1} seed={seed + "kh1"} schichten={3} kante={F.tusche} />
            <Lasur form={klecks(70, 18, 16, 24, seed + "kh2", 8, 0.06)} farbe="#e86a52" deckung={1} seed={seed + "kh2"} schichten={3} kante={F.tusche} />
          </g>
        ) : null}
      </g>
      <g>
          {/* Kragen + Kordeln */}
          {hinten ? null : <g>
          <Strich punkte={[[nacken[0] - 46, nacken[1] + 2], [nacken[0], nacken[1] + 24], [nacken[0] + 46, nacken[1] + 2]]} breite={14} farbe={F.hoodieSchatten} seed={seed + "kragen"} />
          <Strich punkte={[[nacken[0] - 14, nacken[1] + 26], [nacken[0] - 18 + Math.sin(t * 2) * 2, nacken[1] + 80]]} breite={4.5} farbe="#f6ecd8" seed={seed + "ko1"} />
          <Strich punkte={[[nacken[0] + 14, nacken[1] + 26], [nacken[0] + 16 + Math.sin(t * 2 + 1) * 2, nacken[1] + 74]]} breite={4.5} farbe="#f6ecd8" seed={seed + "ko2"} />
          </g>}
      </g>
      {!p.armHinten?.[0] ? arm(0) : null}
      {!p.armHinten?.[1] ? arm(1) : null}
      {handy ? <Handy p={mitte(p.hand[0], p.hand[1])} licht={handyLicht} seed={seed + "handy"} vorne={handyVorne} /> : null}
    </g>
  );
};

// Handy von hinten (Display zeigt zu Mika); das Licht fällt nach oben aufs Gesicht.
export const Handy: React.FC<{ p: P; licht: number; seed: string; winkel?: number; vorne?: boolean }> = ({ p, licht, seed, winkel = -8, vorne = false }) => (
  <g transform={`translate(${p[0]} ${p[1] - 6}) rotate(${winkel})`}>
    {licht > 0 && !vorne ? <Leuchten x={0} y={-70} r={120} ry={110} farbe="#aee0ff" staerke={0.45 * licht} /> : null}
    <Lasur form={kurve([[-22, -36], [22, -37], [23, 36], [-21, 37], [-22, -36]], 3)} farbe={vorne ? "#2a2330" : "#3a6f8f"} deckung={1} seed={seed} schichten={3} streuung={0.15} kante="#1a1420" />
    {vorne ? (
      <path d="M-17 -30 L17 -31 L18 30 L-16 31Z" fill="#cfefff" opacity={0.35 + 0.65 * licht} />
    ) : (
      <g>
        <Lasur form={klecks(-10, -24, 7, 7, seed + "kam", 7, 0.05)} farbe="#1a1420" deckung={1} seed={seed + "kam"} schichten={2} kante={false} />
        <Strich punkte={[[14, -30], [16, 20]]} breite={3} farbe="#8fc3e0" deckung={0.6} seed={seed + "gl"} />
        {/* Lichtsaum am Rand */}
        <Strich punkte={[[-22, -37], [0, -40], [22, -37]]} breite={4} farbe="#dff4ff" deckung={0.8 * licht} seed={seed + "saum"} />
      </g>
    )}
  </g>
);
