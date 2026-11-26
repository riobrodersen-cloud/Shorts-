// Folge 1 „Limerenz“ – Schnittliste. Jede Einstellung startet an einer Sprecherzeile (Zeitmarken aus ton/zeiten.json).
import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import zeiten from "./ton/zeiten.json";
import { Zimmer } from "./szenen/Zimmer";
import { Strasse } from "./szenen/Strasse";
import { GehirnTal, InnenModus } from "./szenen/GehirnTal";
import { AugeNah, GesichtNah, HandyNah } from "./szenen/Nah";
import { Bus, Party, Titel } from "./szenen/Aussen";
import { Bett, Koerper, Scanner } from "./szenen/Koerper";

export const FPS = 30;
type Z = { id: string; start: number; ende: number };
const Zt = zeiten as { dauer: number; zeilen: Z[]; schaetzung?: boolean };
const zeile = (id: string) => {
  const z = Zt.zeilen.find((l) => l.id === id);
  if (!z) throw new Error("Zeile fehlt: " + id);
  return z;
};
const s = (id: string, versatz = 0) => Math.round((zeile(id).start + versatz) * FPS);
const e = (id: string, versatz = 0) => Math.round((zeile(id).ende + versatz) * FPS);

export const ABSPANN_SEK = 8; // ruhiges Ende für YouTube-Abspannelemente
export const filmDauer = () => Math.round((Zt.dauer + ABSPANN_SEK) * FPS);

type Einstellung = { name: string; von: number; inhalt: (dauer: number) => React.ReactNode; blende?: number };

// Reihenfolge = Schnittfolge. Jede Einstellung läuft bis zum Beginn der nächsten.
export const schnittliste = (): Einstellung[] => [
  // HOOK
  { name: "Zimmer – 47×", von: 0, inhalt: (d) => <Zimmer dauer={d} handyAn={6} zaehlerVon={39} zaehlerBis={47} /> },
  { name: "Gesicht im Handylicht", von: s("hook2", -0.15), inhalt: (d) => <GesichtNah dauer={d} mimik="sehnsuechtig" /> },
  { name: "Auge – goldenes Glitzern", von: s("hook4", -0.1), inhalt: (d) => <AugeNah dauer={d} /> },
  { name: "Innenwelt – Blick ins Tal", von: s("hook5", -0.1), inhalt: (d) => <GehirnTal dauer={d} modus="anflug" />, blende: 8 },
  { name: "Innenwelt – Strudel-Teaser", von: s("hook6", -0.1), inhalt: (d) => <GehirnTal dauer={d} modus="teaser" /> },
  // MIKA & SITUATION
  { name: "Gartenparty", von: s("mika1", -0.2), inhalt: (d) => <Party dauer={d} uhr={s("mika3") - s("mika1", -0.2)} />, blende: 10 },
  { name: "Fahrrad – jedes Lied", von: s("mika4", -0.1), inhalt: () => <Strasse noten /> },
  { name: "Handy – fünfmal gelesen", von: s("mika5", -0.1), inhalt: (d) => <HandyNah dauer={d} zustand="nachricht" notiz="5×" /> },
  { name: "Bus – online", von: s("mika6", -0.1), inhalt: (d) => <Bus dauer={d} online={Math.round(1.1 * FPS)} /> },
  { name: "Titel Limerenz", von: s("lim1", -0.1), inhalt: (d) => <Titel dauer={d} teil="wort" />, blende: 8 },
  { name: "Titel Tennov", von: s("lim2", -0.1), inhalt: (d) => <Titel dauer={d} teil="tennov" /> },
  { name: "Titel Besessenheit", von: s("lim3", -0.1), inhalt: (d) => <Titel dauer={d} teil="besessen" /> },
  // PHASE 1
  { name: "Flug durchs Auge", von: s("p1a", -0.2), inhalt: (d) => <AugeNah dauer={d} oeffnen glitzer={0.6} /> },
  { name: "Dopamin-Flut", von: s("p1b", -0.1), inhalt: (d) => <GehirnTal dauer={d} modus="flut" />, blende: 12 },
  { name: "Hirnscanner", von: s("p1d", -0.1), inhalt: (d) => <Scanner dauer={d} />, blende: 8 },
  // PHASE 2
  { name: "Handy – schreibt …", von: s("p2a", -0.2), inhalt: (d) => <HandyNah dauer={d} zustand="schreibt" /> },
  { name: "Wolke zieht auf", von: s("p2c", -0.1), inhalt: (d) => <GehirnTal dauer={d} modus="wolke" />, blende: 8 },
  { name: "Wetter + Spielautomat", von: s("p2e", -0.1), inhalt: (d) => <GehirnTal dauer={d} modus="wetter" /> },
  { name: "Körper – Herz + Magen", von: s("p2g", -0.1), inhalt: (d) => <Koerper dauer={d} />, blende: 8 },
  { name: "Nacht – 3:12", von: s("p2j", -0.1), inhalt: (d) => <Bett dauer={d} /> },
  // PHASE 3
  { name: "Serotonin-See sinkt", von: s("p3a", -0.1), inhalt: (d) => <GehirnTal dauer={d} modus="see" />, blende: 10 },
  { name: "Gedankenschleife", von: s("p3c", -0.4), inhalt: (d) => <GehirnTal dauer={d} modus="strudel" /> },
  // HÖHEPUNKT – Strudel stoppt abrupt, Stille, nur Mikas Gesicht
  { name: "Stille – Gesicht", von: e("p3e", 0.25), inhalt: (d) => <GesichtNah dauer={d} mimik="sehnsuechtig" zoomVon={1.05} zoomBis={1.22} dunkler={0.25} /> },
  // TROST
  { name: "Sonnenaufgang innen", von: s("tr1", -0.2), inhalt: (d) => <GehirnTal dauer={d} modus="aufgang" />, blende: 14 },
  { name: "Zimmer im Morgenlicht", von: s("tr3", -0.1), inhalt: (d) => <Zimmer dauer={d} morgen={1} zeigeZaehler={false} mimik="nervoes" zoom={[1.1, 1.15]} />, blende: 10 },
  { name: "Handy umdrehen", von: s("tr5", -0.2), inhalt: (d) => <HandyNah dauer={d} zustand="umgedreht" tag /> },
  { name: "Fenster öffnen", von: s("tr6", -0.1), inhalt: (d) => <Zimmer dauer={d} morgen={1} zeigeZaehler={false} mikaModus="fenster" fensterOffen={1} zoom={[1.0, 1.08]} fokus={[440, 560]} schwenk={[0, 0]} /> },
  { name: "Lächeln", von: e("tr6", 0.2), inhalt: (d) => <GesichtNah dauer={d} licht="morgen" mimik="erleichtert" zoomVon={1.0} zoomBis={1.05} />, blende: 8 },
  // BRÜCKE
  { name: "Foto", von: s("end1", -0.1), inhalt: (d) => <HandyNah dauer={d} zustand="foto" tag /> },
  { name: "Grüner Nebel", von: s("end2", -0.1), inhalt: (d) => <GehirnTal dauer={d} modus="nebel" />, blende: 10 },
];

const Blende: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  const o = frames > 0 ? interpolate(f, [0, frames], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

export const Film: React.FC<{ mitTon?: boolean }> = ({ mitTon = true }) => {
  const { durationInFrames } = useVideoConfig();
  const liste = schnittliste();
  return (
    <AbsoluteFill style={{ background: "#2a1430" }}>
      {liste.map((x, i) => {
        const bis = i + 1 < liste.length ? liste[i + 1].von : durationInFrames;
        const ueber = liste[i + 1]?.blende ?? 0; // Nachfolger blendet über diese Einstellung
        const dauer = Math.max(1, bis - x.von + ueber);
        return (
          <Sequence key={x.name} from={x.von} durationInFrames={dauer} name={x.name}>
            <Blende frames={x.blende ?? 0}>{x.inhalt(dauer)}</Blende>
          </Sequence>
        );
      })}
      {mitTon && !Zt.schaetzung ? <Audio src={staticFile("herzhirn/folge01/voiceover.mp3")} /> : null}
      {mitTon && !Zt.schaetzung ? <Audio src={staticFile("herzhirn/folge01/atmo.mp3")} /> : null}
    </AbsoluteFill>
  );
};
