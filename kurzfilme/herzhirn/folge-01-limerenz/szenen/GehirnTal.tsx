// Die Innenwelt: Mikas Gehirn als gemalte Landschaft. Belohnungssystem = Tal mit Fluss,
// Dopamin = goldenes, leuchtendes Wasser + Glühwürmchen-Schwärme. Serotonin = ruhiger blauer See.
// Die fernen Berge haben gewundene Kämme und Furchen – eine leise Anspielung auf Hirnwindungen.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { Handschrift, Lasur, Leuchten, Papier, Schriften, Strich } from "../../../../src/herzhirn/komponenten/Pinsel";
import { Baum, Gluehwuermchen, Staub, ABEND } from "../../../../src/herzhirn/komponenten/Natur";
import { Ebene, Kamera } from "../../../../src/herzhirn/komponenten/Kamera";
import { klecks, kurve, P, pfad as pfadVon } from "../../../../src/herzhirn/lib/aquarell";
import { fbm1, rng, zwischen } from "../../../../src/herzhirn/lib/zufall";

// Fluss-Mittellinie: vorne links breit, windet sich in die Ferne
const FLUSS: P[] = kurve([[380, 1180], [640, 1000], [1020, 900], [880, 790], [700, 720], [860, 660], [1060, 625], [1000, 596]], 10);
const flussBreite = (u: number) => 420 * Math.pow(1 - u, 1.7) + 14;

const flussForm = (): P[] => {
  const l: P[] = [];
  const r: P[] = [];
  FLUSS.forEach((p, i) => {
    const a = FLUSS[Math.max(0, i - 1)];
    const b = FLUSS[Math.min(FLUSS.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    // horizontal betonte Breite (Perspektive: Flüsse sind in der Tiefe flach)
    const w = flussBreite(i / (FLUSS.length - 1)) / 2;
    const nx = -dy / len;
    const ny = (dx / len) * 0.35;
    l.push([p[0] + nx * w, p[1] + ny * w]);
    r.push([p[0] - nx * w, p[1] - ny * w]);
  });
  return [...l, ...r.reverse()];
};

const Himmel: React.FC = () => (
  <g>
    <defs>
      <linearGradient id="himmelInnen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5e3f86" />
        <stop offset="0.3" stopColor="#a8558a" />
        <stop offset="0.55" stopColor="#e98a7a" />
        <stop offset="0.72" stopColor="#ffc07a" />
      </linearGradient>
    </defs>
    <rect x={-400} y={-400} width={2720} height={1200} fill="url(#himmelInnen)" />
    <Lasur form={klecks(1400, 160, 700, 180, "hi1", 12, 0.2)} farbe="#7a4a9a" deckung={0.35} seed="hi1" schichten={8} streuung={1.2} kante={false} />
    <Lasur form={klecks(400, 260, 600, 140, "hi2", 12, 0.2)} farbe="#ffb38a" deckung={0.3} seed="hi2" schichten={8} streuung={1.2} kante={false} />
    <Leuchten x={1000} y={570} r={760} ry={300} farbe="#ffd9a0" staerke={0.75} />
    {Array.from({ length: 30 }).map((_, i) => { const r = rng("st" + i); return <circle key={i} cx={r() * 1920} cy={r() * 260} r={1 + r() * 1.6} fill="#fff3d6" opacity={0.5 + r() * 0.4} />; })}
  </g>
);

// Berge mit gewundenen "Hirnwindungs"-Kämmen und Furchen
const Windungsberge: React.FC<{ y: number; hoehe: number; farbe: string; furche: string; seed: string; deckung?: number }> = ({ y, hoehe, farbe, furche, seed, deckung = 1 }) => {
  const r = rng(seed);
  const kamm: P[] = [];
  for (let x = -300; x <= 2300; x += 70) {
    const h = hoehe * (0.55 + 0.45 * Math.abs(Math.sin(x / 260 + r() * 0.4))) + Math.sin(x / 45) * hoehe * 0.06;
    kamm.push([x, y - h]);
  }
  const form = [...kurve(kamm, 4), [2300, y + 300] as P, [-300, y + 300] as P];
  return (
    <g>
      <Lasur form={form} farbe={farbe} deckung={deckung} seed={seed} schichten={7} streuung={0.35} kante={furche} />
      {Array.from({ length: 22 }).map((_, i) => {
        // gewundene Furchen wie Hirnwindungen: S-Kurven mit kleinen Schleifen
        const x0 = -200 + i * 115 + r() * 50;
        const yy = y - hoehe * zwischen(r, 0.12, 0.6);
        const pts: P[] = Array.from({ length: 9 }, (_, k) => [x0 + k * 16 + Math.sin(k * 1.2 + i) * 18, yy + Math.cos(k * 1.1 + i * 0.7) * 22 + k * 3] as P);
        return <Strich key={i} punkte={pts} breite={4.5} farbe={furche} deckung={0.5} seed={seed + "f" + i} zittern={0.4} />;
      })}
      {/* helle Kämme (Licht von hinten) */}
      <Strich punkte={kamm.filter((_, i) => i % 2 === 0).map(([a, b]) => [a, b + 6] as P)} breite={5} farbe="#ffd0b0" deckung={0.35} seed={seed + "kamm"} />
    </g>
  );
};

const Huegel: React.FC<{ seeStand?: number }> = ({ seeStand = 1 }) => (
  <g>
    {/* Serotonin-See rechts in der Ferne – sein Wasserspiegel kann sinken */}
    <Lasur form={klecks(1480, 644, 340, 46, "seebett", 14, 0.1)} farbe="#a8785a" deckung={0.9} seed="seebett" schichten={5} streuung={0.4} kante="#6a4a3a" />
    {[0.3, 0.55, 0.8].map((k, i) => (seeStand < k ? <Strich key={i} punkte={[[1480 - 320 * k, 644 + 10 * k], [1480, 644 + 40 * k], [1480 + 320 * k, 644 + 10 * k]]} breite={2.4} farbe="#6a4a3a" deckung={0.5} seed={"rand" + i} /> : null))}
    <g transform={`translate(1480 ${650 + (1 - seeStand) * 6}) scale(${0.45 + 0.55 * seeStand} ${0.3 + 0.7 * seeStand}) translate(-1480 -644)`}>
      <Lasur form={klecks(1480, 640, 330, 42, "see", 14, 0.1)} farbe="#4fb3c8" deckung={1} seed="see" schichten={7} streuung={0.4} kante="#2f7a8a" />
      <Lasur form={klecks(1460, 632, 220, 16, "seel", 10, 0.1)} farbe="#bdf0f0" deckung={0.6} seed="seel" schichten={4} kante={false} />
    </g>
    {/* Hügelketten (grün-türkis, mit Terrassen) */}
    <Lasur form={kurve([[-300, 700], [100, 610], [420, 650], [700, 600], [900, 640], [1100, 610], [1250, 660], [1700, 680], [2100, 620], [2300, 660], [2300, 900], [-300, 900]], 6)} farbe="#4f8f7a" deckung={0.95} seed="hg1" schichten={7} streuung={0.4} kante="#3f7a5a" />
    <Lasur form={kurve([[-300, 780], [200, 700], [560, 760], [760, 720], [960, 700], [1300, 720], [1700, 760], [2300, 700], [2300, 1000], [-300, 1000]], 6)} farbe="#3f7f68" deckung={0.95} seed="hg2" schichten={7} streuung={0.4} kante="#2f5a48" />
    {Array.from({ length: 7 }).map((_, i) => (
      <Strich key={i} punkte={[[1250 + i * 30, 700 + i * 16], [1500 + i * 40, 690 + i * 18], [1800 + i * 30, 705 + i * 15]]} breite={3} farbe="#a8d89a" deckung={0.5} seed={"terr" + i} />
    ))}
    {/* Nebelschleier */}
    <Lasur form={klecks(900, 650, 900, 34, "nebel1", 14, 0.15)} farbe="#ffd8c0" deckung={0.4} seed="nebel1" schichten={6} streuung={1} kante={false} />
  </g>
);

const Tal: React.FC = () => (
  <g>
    {/* Talboden: warmes Grün mit Licht */}
    <Lasur form={kurve([[-300, 820], [300, 760], [700, 790], [1100, 760], [1600, 800], [2300, 760], [2300, 1300], [-300, 1300]], 6)} farbe="#3f8060" deckung={1} seed="talboden" schichten={7} streuung={0.3} kante={false} />
    <Lasur form={klecks(700, 900, 700, 160, "tl", 12, 0.2)} farbe="#a8b85a" deckung={0.35} seed="tl" schichten={6} kante={false} />
    <Lasur form={klecks(1700, 1000, 500, 160, "ts", 12, 0.2)} farbe="#2a5a4a" deckung={0.4} seed="ts" schichten={6} kante={false} />
  </g>
);

const GoldFluss: React.FC<{ flut: number; grau?: number }> = ({ flut, grau = 0 }) => {
  const frame = useCurrentFrame();
  const form = React.useMemo(flussForm, []);
  const kernForm = React.useMemo(() => flussForm().map(([x, y], i, arr) => { const m = arr[arr.length - 1 - i]; return [x * 0.6 + m[0] * 0.4, y * 0.6 + m[1] * 0.4] as P; }), []);
  // Glitzernde Strömungslinien, die flussabwärts (zum Betrachter) wandern
  const wellen: React.ReactNode[] = [];
  const rr = rng("wellen");
  for (let i = 0; i < 40; i++) {
    const quer = (rr() - 0.5) * 0.8;
    const u = (((rr() - frame * 0.006 * (0.3 + flut)) % 1) + 1) % 1;
    const idx = Math.floor(u * (FLUSS.length - 4));
    const a = FLUSS[idx];
    const b = FLUSS[idx + 3];
    const w = flussBreite(u) * quer;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * w;
    const ny = (dx / len) * w * 0.35;
    const g = 1.5 + (1 - u) * 4;
    wellen.push(<Strich key={i} punkte={[[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny]]} breite={g} farbe="#fffbe0" deckung={0.75 * (0.5 + flut * 0.5)} seed={"we" + i} zittern={0.3} opts={{ thinning: 0.4 }} />);
  }
  return (
    <g>
      {/* Ufer */}
      <Lasur form={form.map(([x, y]) => [x, y + 8] as P)} farbe="#3f6a3a" deckung={0.6} seed="ufer" schichten={4} streuung={0.6} kante={false} />
      <defs>
        <filter id="bloom" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="38" />
        </filter>
        <filter id="bloomKlein" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      {/* Lichtschein auf Ufer und Wiesen */}
      <g filter="url(#bloom)" style={{ mixBlendMode: "screen" }} opacity={0.55 + flut * 0.45}>
        <path d={pfadVon(form)} fill="#ffb830" transform="translate(0 -10)" />
      </g>
      <Lasur form={form} farbe="#f6a92a" deckung={1} seed="gold" schichten={8} streuung={0.4} kante="#a05a10" />
      <Lasur form={form} farbe="#ffd860" deckung={0.7} seed="gold2" schichten={5} streuung={0.8} kante={false} />
      {/* heller Kern der Strömung */}
      <g filter="url(#bloomKlein)" style={{ mixBlendMode: "screen" }} opacity={0.5 + flut * 0.5}>
        <path d={pfadVon(kernForm)} fill="#fff6c8" />
      </g>
      {wellen}
      {grau > 0 ? <Lasur form={form} farbe="#6f6a8a" deckung={grau * 0.75} seed="grau" schichten={4} streuung={0.4} kante={false} /> : null}
    </g>
  );
};

// Vordergrund-Farne, die schaukeln
const Farn: React.FC<{ x: number; y: number; s: number; seed: string; spiegel?: boolean; farbe?: string }> = ({ x, y, s, seed, spiegel, farbe = "#2f5a48" }) => {
  const frame = useCurrentFrame();
  const r = rng(seed);
  return (
    <g transform={`translate(${x} ${y}) scale(${spiegel ? -s : s} ${s})`}>
      {Array.from({ length: 7 }).map((_, i) => {
        const ang = -Math.PI / 2 + (i - 3) * 0.32 + (r() - 0.5) * 0.2 + fbm1(frame / 45 + i, i) * 0.06;
        const L = zwischen(r, 220, 320);
        const pts: P[] = Array.from({ length: 6 }, (_, k) => {
          const u = k / 5;
          return [Math.cos(ang + u * 0.5) * L * u, Math.sin(ang + u * 0.5) * L * u] as P;
        });
        const voll = kurve(pts, 4);
        return (
          <g key={i}>
            <Strich punkte={pts} breite={5} farbe={farbe} seed={seed + i} />
            {voll.filter((_, k) => k % 2 === 1 && k < voll.length - 2).map(([bx, by], k) => {
              const t = k / (voll.length / 2);
              const len = 46 * (1 - t * 0.7);
              return [1, -1].map((sd) => {
                const a2 = ang + sd * 1.1 + t * 0.3;
                return <Strich key={`${k}${sd}`} punkte={[[bx, by], [bx + Math.cos(a2) * len, by + Math.sin(a2) * len]]} breite={10 * (1 - t * 0.6)} farbe={farbe} deckung={0.92} seed={seed + i + k + sd} zittern={0.3} opts={{ thinning: 0.7 }} />;
              });
            })}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// Wetter, Spielautomat, Strudel, Silhouette, Nebel
// ---------------------------------------------------------------------------
const Regen: React.FC<{ staerke: number }> = ({ staerke }) => {
  const frame = useCurrentFrame();
  const r = rng("regen");
  if (staerke <= 0) return null;
  return (
    <g opacity={staerke}>
      {Array.from({ length: 140 }).map((_, i) => {
        const x0 = r() * 2200 - 140;
        const sp = 28 + r() * 16;
        const y = ((r() * 1100 + frame * sp) % 1200) - 100;
        const x = x0 - (y * 0.25);
        return <line key={i} x1={x} y1={y} x2={x - 9} y2={y + 34} stroke="#dfe6ff" strokeWidth={2} strokeLinecap="round" opacity={0.5} />;
      })}
    </g>
  );
};

const Blitz: React.FC<{ an: number }> = ({ an }) =>
  an > 0 ? (
    <g opacity={an}>
      <rect x={-200} y={-200} width={2400} height={1500} fill="#fff6ff" opacity={0.35} />
      <Strich punkte={[[1260, 60], [1200, 200], [1260, 230], [1150, 420], [1210, 440], [1120, 600]]} breite={9} farbe="#fffbe0" weich={false} seed="blitz" zittern={1.5} />
    </g>
  ) : null;

const WetterWolke: React.FC<{ x: number; y: number; b: number; dunkel: number; seed: string }> = ({ x, y, b, dunkel, seed }) => {
  const farbe = dunkel > 0.5 ? "#5a4a72" : "#f3e6f0";
  const schatten = dunkel > 0.5 ? "#3a2f52" : "#c9a0c0";
  return (
    <g>
      <Lasur form={klecks(x, y + b * 0.08, b * 0.55, b * 0.13, seed + "s", 12, 0.12)} farbe={schatten} deckung={0.8} seed={seed + "s"} schichten={6} kante={false} />
      {Array.from({ length: 7 }).map((_, i) => {
        const r = rng(seed + i);
        return <Lasur key={i} form={klecks(x + (i - 3) * b * 0.15, y - Math.sin(((i + 0.5) / 7) * Math.PI) * b * 0.14, b * (0.13 + r() * 0.08), b * 0.12, seed + "t" + i, 10, 0.12)} farbe={farbe} deckung={0.85} seed={seed + "t" + i} schichten={5} kante={false} />;
      })}
    </g>
  );
};

// Gezeichnete Spielautomaten-Walze am Himmel
const Walze: React.FC<{ x: number; y: number; dreh: number; zeigen: number }> = ({ x, y, dreh, zeigen }) => {
  if (zeigen <= 0) return null;
  const symbole = ["sonne", "wolke", "herz", "blitz", "sonne", "herz"];
  const h = 110;
  const off = (dreh * h) % (h * symbole.length);
  return (
    <g opacity={zeigen} transform={`translate(${x} ${y}) scale(${0.8 + zeigen * 0.2})`}>
      <defs>
        <clipPath id="walzeClip">
          <path d="M-70 -120 Q0 -136 70 -120 L72 120 Q0 134 -72 120Z" />
        </clipPath>
      </defs>
      <Lasur form={kurve([[-100, -150], [100, -152], [104, 150], [-102, 152], [-100, -150]], 4)} farbe="#b8505a" deckung={1} seed="wrahmen" schichten={4} streuung={0.3} kante="#3a1a20" />
      <Lasur form={kurve([[-74, -124], [74, -126], [76, 124], [-74, 126], [-74, -124]], 4)} farbe="#fff4e0" deckung={1} seed="winnen" schichten={3} kante="#3a1a20" />
      <g clipPath="url(#walzeClip)">
        {symbole.concat(symbole).map((sym, i) => {
          const sy = i * h - off - h * 2;
          return (
            <g key={i} transform={`translate(0 ${sy})`}>
              {sym === "sonne" ? <Lasur form={klecks(0, 0, 34, 34, "ws" + i, 10, 0.08)} farbe="#f6b93a" deckung={1} seed={"ws" + i} schichten={3} kante="#a05a10" /> : null}
              {sym === "wolke" ? <Lasur form={klecks(0, 6, 44, 24, "ww" + i, 10, 0.15)} farbe="#8a8aa8" deckung={1} seed={"ww" + i} schichten={3} kante="#3a3a5a" /> : null}
              {sym === "herz" ? <Lasur form={kurve([[0, 34], [-38, 0], [-30, -26], [-8, -28], [0, -12], [8, -28], [30, -26], [38, 0], [0, 34]], 4)} farbe="#e9576a" deckung={1} seed={"wh" + i} schichten={3} kante="#7a1a2a" /> : null}
              {sym === "blitz" ? <Strich punkte={[[10, -36], [-12, 4], [6, 4], [-10, 38]]} breite={9} farbe="#f2b84b" weich={false} seed={"wb" + i} /> : null}
            </g>
          );
        })}
      </g>
      <Strich punkte={[[-80, 0], [80, 0]]} breite={3} farbe="#b8505a" deckung={0.5} seed="wlinie" />
      {/* Hebel */}
      <Strich punkte={[[104, 0], [140, -30], [146, -110]]} breite={9} farbe="#3a1a20" seed="hebel" />
      <Lasur form={klecks(146, -118, 18, 18, "knopf", 8, 0.06)} farbe="#e9576a" deckung={1} seed="knopf" schichten={3} kante="#3a1a20" />
    </g>
  );
};

// Strudel im Fluss mit wiederkehrender Silhouette
const STRUDEL: P = [905, 800];
const Strudel: React.FC<{ tempo: number; staerke: number; silhouette: number }> = ({ tempo, staerke, silhouette }) => {
  const frame = useCurrentFrame();
  if (staerke <= 0) return null;
  const dreh = tempo;
  return (
    <g transform={`translate(${STRUDEL[0]} ${STRUDEL[1]}) scale(1 0.42)`} opacity={staerke}>
      <Leuchten x={0} y={0} r={190} farbe="#ffcf5a" staerke={0.6} />
      {Array.from({ length: 9 }).map((_, i) => {
        const pts: P[] = Array.from({ length: 14 }, (_, k) => {
          const u = k / 13;
          const a = dreh + (i / 9) * Math.PI * 2 + u * 4.2;
          const rr = 20 + u * 270;
          return [Math.cos(a) * rr, Math.sin(a) * rr] as P;
        });
        return <Strich key={i} punkte={pts} breite={9} farbe={i % 2 ? "#fff3c0" : "#8a4a10"} deckung={0.85} seed={"str" + i} zittern={0.5} opts={{ start: { taper: 10 }, end: { taper: 40 } }} />;
      })}
      <Lasur form={klecks(0, 0, 40, 40, "auge", 10, 0.1)} farbe="#7a3a10" deckung={0.7} seed="auge" schichten={4} kante={false} />
      {/* dieselbe Silhouette taucht immer wieder auf */}
      {silhouette > 0 ? (
        <g transform={`scale(1 ${1 / 0.42}) rotate(${Math.sin(dreh) * 8}) scale(${0.45 + silhouette * 0.2})`} opacity={silhouette * 0.85}>
          <Silhouette x={0} y={60} s={0.6} farbe="#5a3a6a" />
        </g>
      ) : null}
    </g>
  );
};

// Die Person: nur Silhouette (dunkel mit warmem Randlicht)
export const Silhouette: React.FC<{ x: number; y: number; s?: number; farbe?: string; rand?: string }> = ({ x, y, s = 1, farbe = "#4a3560", rand = "#ffd27a" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* Körper: Schultern, Taille, Beine angedeutet */}
    <Lasur form={kurve([[-46, 0], [-50, -90], [-64, -150], [-82, -200], [-60, -226], [-24, -236], [24, -236], [60, -226], [82, -200], [64, -150], [50, -90], [46, 0], [-46, 0]], 4)} farbe={farbe} deckung={1} seed="silK" schichten={4} streuung={0.25} kante={rand} />
    <Strich punkte={[[-74, -206], [-92, -130], [-80, -60]]} breite={30} farbe={farbe} seed="silA1" opts={{ thinning: 0.1 }} />
    <Strich punkte={[[74, -206], [94, -140], [70, -84]]} breite={30} farbe={farbe} seed="silA2" opts={{ thinning: 0.1 }} />
    <Lasur form={kurve([[-16, -236], [16, -236], [14, -262], [-14, -262], [-16, -236]], 3)} farbe={farbe} deckung={1} seed="silHals" schichten={2} kante={false} />
    <Lasur form={klecks(0, -300, 44, 50, "silH", 10, 0.05)} farbe={farbe} deckung={1} seed="silH" schichten={4} streuung={0.3} kante={rand} />
    <Lasur form={kurve([[-50, -306], [-40, -350], [0, -362], [44, -348], [54, -300], [36, -330], [-20, -334], [-50, -306]], 4)} farbe={farbe} deckung={1} seed="silHaar" schichten={3} kante={rand} />
    {/* warmes Randlicht */}
    <Strich punkte={[[44, -340], [52, -300], [40, -262]]} breite={5} farbe={rand} deckung={0.8} seed="silR" />
    <Strich punkte={[[80, -200], [64, -150], [50, -90]]} breite={5} farbe={rand} deckung={0.6} seed="silR2" />
  </g>
);

const Nebel: React.FC<{ staerke: number }> = ({ staerke }) => {
  const frame = useCurrentFrame();
  if (staerke <= 0) return null;
  return (
    <g opacity={staerke}>
      {Array.from({ length: 6 }).map((_, i) => {
        const r = rng("nb" + i);
        const dx = (i % 2 ? -1 : 1) * (1 - staerke) * 600 + Math.sin(frame / 40 + i) * 30;
        return <Lasur key={i} form={klecks(200 + i * 320 + dx, 640 + r() * 300, 420, 120, "nb" + i, 12, 0.2)} farbe={i % 2 ? "#7fbf6a" : "#5fa86a"} deckung={0.55} seed={"nb" + i} schichten={7} streuung={1.2} kante={false} />;
      })}
      <rect x={-200} y={-200} width={2400} height={1500} fill="#6fbf7a" opacity={0.18} style={{ mixBlendMode: "multiply" }} />
    </g>
  );
};

export type InnenModus = "flut" | "wolke" | "wetter" | "see" | "strudel" | "aufgang" | "nebel" | "teaser" | "anflug";

export const GehirnTal: React.FC<{ mitLabels?: boolean; modus?: InnenModus; dauer?: number }> = ({ mitLabels = true, modus = "flut", dauer = 150 }) => {
  const frame = useCurrentFrame();
  const f = frame;
  const ip = (a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(f, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

  // --- Zustände je Modus ---
  let flut = 0.5;
  let grau = 0;
  let seeStand = 1;
  let wolke = 0; // 0..1 Wolke vor dem Licht
  let dunkel = 0; // Gewitterstimmung
  let regen = 0;
  let blitz = 0;
  let walze = 0;
  let strudel = 0;
  let strudelTempo = 0;
  let silh = 0;
  let aufgang = 0;
  let nebel = 0;
  let kam = { x: 0, y: ip([0, dauer], [30, -10]), zoom: ip([0, dauer], [1.0, 1.12]), fx: 960, fy: 640 };
  const labels: React.ReactNode[] = [];
  const L = (key: string, text: string, x: number, y: number, start: number, farbe = "#4a2240", kontur = "#fff3d6", groesse = 80, dreh = -4) =>
    labels.push(<Handschrift key={key} text={text} x={x} y={y} groesse={groesse} farbe={farbe} drehung={dreh} fortschritt={ip([start, start + 24], [0, 1], Easing.linear)} kontur={kontur} />);

  switch (modus) {
    case "anflug": // aus der Pupille hinab ins Tal
      kam = { x: 0, y: ip([0, dauer], [-420, 0]), zoom: ip([0, dauer], [0.75, 1.05]), fx: 960, fy: 640 };
      flut = 0.45;
      break;
    case "flut":
      flut = ip([36, 50, 110], [0.35, 1, 0.75]);
      if (mitLabels) {
        L("bel", "Belohnungssystem", 1270, 470, 55);
        labels.push(<Strich key="pf1" punkte={[[1150, 500], [1080, 560], [990, 600]]} breite={7} farbe="#4a2240" seed="pfeil1" fortschritt={ip([55, 80], [0, 1], Easing.linear)} />);
        L("dop", "Dopamin", 420, 760, 80, "#fff4c8", "#7a3a10", 96, -6);
        labels.push(<Strich key="pf2" punkte={[[560, 790], [680, 880], [760, 930]]} breite={7} farbe="#fff4c8" seed="pfeil2" fortschritt={ip([80, 105], [0, 1], Easing.linear)} />);
      }
      break;
    case "wolke":
      wolke = ip([0, 40], [0, 1]);
      flut = ip([0, 40], [0.6, 0.12]);
      grau = ip([10, 50], [0, 0.6]);
      kam = { x: 0, y: 0, zoom: ip([0, dauer], [1.15, 1.22]), fx: 900, fy: 760 };
      break;
    case "wetter": {
      // Sonne / Wolke / Sonne / Gewitter – das Wasser stockt, sprudelt, stockt
      const T = dauer;
      const k = [0, T * 0.22, T * 0.42, T * 0.6, T];
      wolke = ip([k[0], k[0] + 6, k[1] - 4, k[1] + 4, k[2] - 4, k[2] + 4, k[3] - 4, k[3] + 6], [0, 0, 0, 1, 1, 0, 0, 1]);
      dunkel = ip([k[3], k[3] + 12], [0, 1]);
      regen = ip([k[3] + 6, k[3] + 18], [0, 1]);
      blitz = f > k[3] + 14 && (Math.floor(f) % 37 < 3) ? 1 : 0;
      flut = ip([k[0], k[1], k[1] + 6, k[2], k[2] + 6, k[3], k[3] + 6], [0.9, 0.9, 0.15, 0.15, 1, 1, 0.1]);
      grau = 1 - flut;
      walze = ip([8, 24], [0, 1]);
      kam = { x: 0, y: ip([0, T], [-80, -40]), zoom: 1.05, fx: 960, fy: 600 };
      if (mitLabels) L("uns", "Unsicherheit", 470, 200, 20, "#fff3d6", "#4a2240", 84, -5);
      break;
    }
    case "see":
      seeStand = ip([10, dauer - 10], [1, 0.25]);
      flut = 0.4;
      kam = { x: 0, y: 0, zoom: ip([0, dauer], [1.7, 1.85]), fx: 1480, fy: 650 };
      if (mitLabels) L("ser", "Serotonin", 1480, 560, 12, "#e8fbff", "#1f4a6a", 70, -3);
      break;
    case "strudel":
    case "teaser":
      seeStand = modus === "strudel" ? 0.3 : 0.8;
      strudel = ip([0, 20], [0, 1]);
      strudelTempo = modus === "teaser" ? f * 0.12 : (f * f) / 1400 + f * 0.05; // wird immer schneller
      silh = Math.max(0, Math.sin(f / (modus === "teaser" ? 10 : 14 - Math.min(8, f / 40))) ) * ip([20, 40], [0, 1]);
      flut = 0.55;
      kam = { x: 0, y: 0, zoom: ip([0, dauer], modus === "teaser" ? [2.0, 2.4] : [2.0, 2.7]), fx: STRUDEL[0], fy: STRUDEL[1], drehung: modus === "strudel" ? ip([0, dauer], [0, 6]) : 0 } as typeof kam;
      if (mitLabels && modus === "teaser") L("ph3", "Phase 3", 960, 300, 6, "#fff3d6", "#4a2240", 120, -6);
      if (mitLabels && modus === "strudel") L("schl", "Gedankenschleife", 960, 210, 30, "#fff3d6", "#4a2240", 90, -4);
      break;
    case "aufgang":
      aufgang = ip([0, dauer * 0.7], [0, 1]);
      seeStand = ip([0, dauer * 0.8], [0.3, 1]);
      flut = 0.55;
      kam = { x: 0, y: ip([0, dauer], [0, -30]), zoom: ip([0, dauer], [1.08, 1.0]), fx: 960, fy: 620 };
      break;
    case "nebel":
      nebel = ip([0, dauer * 0.7], [0, 1]);
      flut = 0.4;
      grau = 0.3;
      kam = { x: 0, y: 0, zoom: ip([0, dauer], [1.0, 1.06]), fx: 960, fy: 640 };
      break;
  }

  const walzeDreh = f * 0.35;

  return (
    <AbsoluteFill style={{ background: "#e9909c" }}>
      <Schriften />
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <Kamera kam={kam}>
          <Ebene tiefe={0.05}>
            <Himmel />
            {/* Sonnenaufgang: Himmel wird hell, Sonne steigt */}
            {aufgang > 0 ? (
              <g opacity={aufgang}>
                <defs>
                  <linearGradient id="morgenInnen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#8fc8d8" />
                    <stop offset="0.45" stopColor="#ffd2b0" />
                    <stop offset="0.75" stopColor="#fff0b8" />
                  </linearGradient>
                </defs>
                <rect x={-400} y={-400} width={2720} height={1200} fill="url(#morgenInnen)" />
                <Leuchten x={980} y={600 - aufgang * 330} r={520} farbe="#fff4c0" staerke={0.9} />
                <Lasur form={klecks(980, 600 - aufgang * 330, 78, 78, "sonneInnen", 12, 0.04)} farbe="#ffd25a" deckung={1} seed="sonneInnen" schichten={5} kante="#f29a3a" />
              </g>
            ) : null}
            {dunkel > 0 ? <rect x={-400} y={-400} width={2720} height={1600} fill="#4a3a6a" opacity={dunkel * 0.45} /> : null}
            <g transform="translate(1500 260) scale(1.5) translate(-1500 -260)"><Walze x={1500} y={260} dreh={walzeDreh} zeigen={walze} /></g>
          </Ebene>
          <Ebene tiefe={0.15}>
            <Windungsberge y={600} hoehe={260} farbe="#c97a9a" furche="#7a3a6a" seed="wb1" deckung={0.85} />
            {wolke > 0 ? (
              <g transform={`translate(${(1 - wolke) * -900} 0)`}>
                <WetterWolke x={900} y={300} b={900} dunkel={dunkel} seed="ww1" />
              </g>
            ) : null}
          </Ebene>
          <Ebene tiefe={0.3}>
            <Windungsberge y={640} hoehe={170} farbe="#b8607e" furche="#6a2a5a" seed="wb2" deckung={0.95} />
          </Ebene>
          <Ebene tiefe={0.5}>
            <Huegel seeStand={seeStand} />
            {[[300, 640, 90], [460, 655, 70], [1300, 680, 80], [1640, 700, 100], [1800, 690, 70], [180, 700, 110]].map(([x, y, h], i) => (
              <Baum key={i} x={x} y={y} hoehe={h} seed={"tb" + i} farben={ABEND} bueschel={12} wind={0.6 + dunkel * 2} />
            ))}
          </Ebene>
          <Ebene tiefe={0.8}>
            <Tal />
            <GoldFluss flut={flut} grau={grau} />
            <Strudel tempo={strudelTempo} staerke={strudel} silhouette={silh} />
            <Gluehwuermchen seed="gw1" pfadPunkte={[...FLUSS].reverse().filter((_, i) => i % 4 === 0)} anzahl={90} tempo={0.3 + flut} streuung={90} groesse={6.5} helligkeit={0.3 + flut * 0.7} />
            <Gluehwuermchen seed="gw2" pfadPunkte={[[200, 980], [500, 820], [900, 760], [1300, 600], [1700, 420]]} anzahl={60} tempo={0.4 + flut * 0.8} streuung={140} groesse={5.5} helligkeit={Math.max(0, flut - 0.2)} />
          </Ebene>
          <Ebene tiefe={1}>
            {[[1500, 900, 260], [1750, 960, 330], [120, 1000, 300]].map(([x, y, h], i) => (
              <Baum key={i} x={x} y={y} hoehe={h} seed={"tv" + i} farben={ABEND} bueschel={20} wind={0.8 + dunkel * 2.5} />
            ))}
            <Staub seed="pollenInnen" bereich={[0, 300, 1920, 780]} anzahl={50} farbe="#ffe9a0" groesse={3} />
          </Ebene>
          <Ebene tiefe={1.3}>
            <Farn x={60} y={1090} s={1.6} seed="farn1" farbe="#1f4a3a" />
            <Farn x={1880} y={1100} s={1.5} seed="farn2" spiegel farbe="#24503f" />
          </Ebene>
        </Kamera>
        <Nebel staerke={nebel} />
        <Regen staerke={regen} />
        <Blitz an={blitz} />
        {labels}
      </svg>
      <Papier vignette="rgba(90,30,60,0.35)" />
    </AbsoluteFill>
  );
};
