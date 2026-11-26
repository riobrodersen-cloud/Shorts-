---
name: herzhirn-kurzfilm
description: Produziert Folgen des deutschen YouTube-Kanals „Herzhirn“ – handgemalt wirkende Animations-Kurzfilme (2:20–2:40, 16:9) über Gefühle und was sie in Gehirn und Körper auslösen. Nutzen für jede neue Folge, Stiltests, Storyboards, Renders, Thumbnails und YouTube-Texte dieses Kanals.
---

# Herzhirn – animierte Kurzfilme über Gefühle

## Konzept
- Deutsch, Du-Ansprache, 2:20–2:40 Min., 1920×1080, 30 fps, H.264. **Keine Shorts** (Shorts nur als Zubringer nach Freigabe).
- Kein Intro, kein Logo, keine Begrüßung – der Film startet mit dem Hook.
- Hauptfigur **Mika** führt durch jede Folge. Außenwelt (Mikas Alltag) ↔ Innenwelt (Gehirn als gemalte Landschaft).
- **Jede Folge bekommt eigene Orte, Bildideen und einen eigenen Aufbau** (YouTube wertet Schablonen-Videos ab). Wiederverwendet werden nur Figur, Stil und Werkzeuge.
- Fakten nie zuspitzen (kein „wie Kokain“, „Sucht“ nicht als Diagnose). Quellen in die Beschreibung.

## Look-Regeln (das Wichtigste)
Ziel: Nach 10 Sekunden „Boah, ist das schön gemacht“. Handgezeichnet/gemalt – nicht programmiert, nicht 3D, nicht Vektor-Clipart.

VERBOTEN
- Rechtecke als Häuser/Fenster/Kissen/Lampen/Möbel; perfekt gerade Linien; perfekte Kreise.
- Bäume aus Kreisen/Ellipsen, Straßen als graue Balken.
- Graue, dunkelblaue, leere, düstere Hintergründe. Flache einfarbige Flächen ohne Struktur. Standbilder.

GEWOLLT
- Organische, unregelmäßige Formen; Linien mit Zittern und wechselnder Strichstärke.
- Gemalte Hintergründe wie im Bilderbuch: warme, satte Farben (Sonnenlicht, Abendrot, Grün, Türkis, Koralle, Gold), Licht/Schatten, weiche Verläufe, Papier-/Aquarell-Textur.
- Bäume mit Kronen aus vielen Blattbüscheln, die im Wind schaukeln; kurvige Straßen in die Tiefe; Häuser mit schiefen Dächern, Balkonen, Pflanzen, Wäscheleinen.
- Räume voller Leben: Pflanzen, Bücher, Poster, Lichterketten, Klamotten, dampfende Tasse, Licht durchs Fenster.
- IMMER Bewegung (Blätter, Vögel, Dampf, flackernde Lichter, Passanten, Staub im Licht), Parallax bei jeder Kamerafahrt.
- Mindestens alle 3–4 s etwas sichtbar Neues (Schnitt, Kamerafahrt, neues Element, Einblendung).

Gelernt bei Folge 1 (Stiltest):
- **Innenwelt in satter Dämmerung** (Violett → Rose → Amber, tiefes Türkisgrün), nicht taghell: Nur so leuchten Gold-Fluss und Glühwürmchen. Leuchteffekte (`mix-blend-mode: screen`) verschwinden auf hellem Grund.
- Echtes „Glühen“ = unscharfe Kopie der Form (`feGaussianBlur` 30–40) mit `screen` darüber + heller Kern. Radiale Verläufe allein reichen nicht.
- Wand-Lasuren groß und schwach (Deckung 0,2–0,3, 12 Schichten), sonst wirken sie wie Flecken.
- Straßen nicht als Band um eine Mittellinie bauen (überschneidet sich in Kurven) – linke/rechte Kante von Hand setzen.
- Blätter als spitz-runde 8-Punkt-Form (`blattForm`), sonst sehen sie wie Rauten aus.
- Wenn Mikas Beine unschön wirken: Decke/Requisite darüberlegen (Schneidersitz mit Decke auf dem Schoß).

## Werkzeuge (alle kostenlos, Lizenz geprüft 11/2026)
| Tool | Wofür | Lizenz |
|---|---|---|
| Remotion 4.0.547 (`remotion`, `@remotion/cli`, `@remotion/transitions`) | Film als React-Code, Frame-genaues Rendern | Remotion-Lizenz: frei für Einzelpersonen/Firmen ≤ 3 Personen |
| `@remotion/noise`, `@remotion/paths`, `@remotion/install-whisper-cpp` | Rauschen, Pfade, Whisper-Untertitel | MIT |
| perfect-freehand 1.2.3 | Pinsel-/Tuschestriche mit Druckverlauf | MIT |
| roughjs 4.6.6 | Skizzen-Schraffuren (Reserve) | MIT |
| simplex-noise 4.0.3, d3-shape 3.2.1 | organischer Zufall, Kurven | MIT / ISC |
| SVG-Filter (`feGaussianBlur`), eigene Papier-/Körnungstextur (`scripts/papier.py`, numpy+PIL) | Glühen, Papierstruktur | Webstandard / selbst erzeugt |
| Schriften Caveat Brush + Caveat (Fontsource) | Handschrift-Labels | OFL-1.1 (`public/herzhirn/fonts/`) |
| Stimme `figur:erzaehler` (Qwen3-TTS, Werkzeug aus Repo Projekt-3d `stimmen/`) | Erzählerstimme – **vom User gewählt** | Apache-2.0 |
| Whisper / whisper.cpp | Untertitel-Timing, Sprachprüfung | MIT |
| FFmpeg | Schnitt, Mischung, Lautheit | LGPL/GPL (nur Werkzeug) |

Bewusst NICHT: GSAP (eigene „Standard“-Lizenz), Motion Canvas (letztes Release 12/2024), Lottie (braucht AE-Dateien), Blender/OpenToonz/Krita (GUI, im Container nicht sinnvoll), ElevenLabs/kostenpflichtige Dienste (nur mit ausdrücklicher Zustimmung).

## Technik / Code-Aufbau
- Remotion-Projekt im Repo-Wurzelverzeichnis: `src/index.ts`, `src/Root.tsx` (Kompositionen), `remotion.config.ts` (nutzt `/opt/pw-browsers/...chrome-headless-shell`, kein Download).
- Gemeinsame Bibliothek `src/herzhirn/`:
  - `lib/zufall.ts` – Seed-Zufall (`rng`), `gauss`, `fbm1` (Wind/Atmen/Flackern). **Nie `Math.random()`** – alles aus Seed + `useCurrentFrame()`.
  - `lib/aquarell.ts` – Aquarell-Lasuren nach Tyler Hobbs (rekursive Kantenverschiebung, viele transparente Schichten), `klecks`, `viereck` (schiefes Viereck), `band`, `kurve` (Catmull-Rom), `pfad`.
  - `komponenten/Pinsel.tsx` – `Lasur`, `Strich` (perfect-freehand + „Boiling“ alle 3 Frames), `Papier` (Overlay), `Leuchten`, `Handschrift` (schreibt sich Buchstabe für Buchstabe).
  - `komponenten/Natur.tsx` – `Baum` (Büschel einzeln im Wind), `Voegel`, `Staub`, `Gluehwuermchen` (strömen entlang Pfad), `Lichterkette`, `Dampf`, `Topfpflanze`, `Ranke`, `Wolke`, `Blumenbeet`, `blattForm`.
  - `komponenten/Stadt.tsx` – `Haus` (schiefe Fassade, Fenster, Balkon, Blumenkästen, Dach), `Waescheleine`, `Fahrrad`, `Passant`, `Laterne`.
  - `komponenten/Kamera.tsx` – `Kamera` + `Ebene tiefe={…}` für Parallax (0 = Himmel, 1 = Bildebene, >1 = Vordergrund).
  - `figuren/Mika.tsx` – Figur (siehe unten).
- Folgen-Code: `kurzfilme/herzhirn/folge-XX-thema/szenen/*.tsx`; Medien unter `public/herzhirn/...`.
- Rendern: `npx remotion still src/index.ts <Id> out/x.png --frame=N`; `npx remotion render src/index.ts <Id> out/x.mp4 --crf=20`. Gemessen: ~0,3 s/Frame → 5 s Clip ≈ 45 s, 2:30 Film ≈ 20–25 min (im Hintergrund starten).
- Ausgaben nach `out/` (gitignored). Kontrolle: Standbilder mit dem Read-Tool ansehen, **jede Szene erst als Still prüfen, dann rendern**.

## Produktions-Pipeline (Skripte)
1. Skript: `kurzfilme/.../ton/skript.json` (Zeilen-IDs, Pausen pro Zeile, `tempo` < 1 für langsame Sätze). Zahlen ausschreiben („neunzehnhundertneunundsiebzig“).
2. Stimme: `./stimmen/stimmen.sh skript <skript.json> -o public/herzhirn/folgeXX/voiceover.mp3` (Qwen3-TTS, `figur:erzaehler`; ~8–10× Echtzeit, im Hintergrund). Danach `voiceover.json` nach `ton/zeiten.json` kopieren. Prüfen: `./stimmen/stimmen.sh pruefen …` (WER > 25 % → Zeile neu).
3. Schnitt: `Film.tsx` – Schnittliste, jede Einstellung startet per `s("zeilenId", versatz)` / `e(...)` an einer Sprecherzeile; `blende` = Überblendung in Frames. Ohne echte Zeitmarken (`schaetzung: true`) läuft der Film stumm.
4. Storyboard: `python3 scripts/schnitt_frames.py <folgenordner> > out/frames.json`, `node scripts/storyboard.mjs <KompId> out/storyboard out/frames.json`, `python3 scripts/kontaktbogen.py out/frames.json out/storyboard out/storyboard`.
5. Ton: `python3 scripts/ton.py <folgenordner> out/frames.json` → `atmo.mp3` (Musik je Akt + Geräusche, selbst synthetisiert, Ducking unter der Stimme, harte Stille am Höhepunkt).
6. Untertitel: `python3 scripts/srt.py ton/zeiten.json <folge>.de.srt`.
7. Thumbnails: Kompositionen `ThumbnailA/B` (1280×720) → `npx remotion still`.

## Szenen-Bausteine Folge 1 (als Vorlage, NICHT kopieren – jede Folge eigene Orte)
`Zimmer` (Nacht/Morgen, Mika sitzt/Fenster), `Strasse` (Rad), `Party`, `Bus`, `Titel`, `GesichtNah`, `AugeNah` (Pupille öffnet sich zum Himmel = Übergang nach innen), `HandyNah` (online/schreibt/Nachricht/Foto/umgedreht), `GehirnTal` mit Modi `flut | wolke | wetter | see | strudel | teaser | aufgang | nebel | anflug`, `Scanner`, `Koerper` (Herz + Schmetterlinge), `Bett` (3:12).

## Figur Mika
- ~20 Jahre, geschlechtsneutral, wuschelige dunkle Locken (Kringel in 2 Lagen + Stirnlocken, wippen einzeln), übergroßer senffarbener Hoodie (`#e0a43a`) mit Kordeln und Bauchtasche, weite türkisgrüne Hose (`#5f8f86`), cremefarbene Sneaker mit Korallen-Akzent.
- Gelenk-Puppe: `Pose` = Kopf, Schultern, Ellbogen, Hände, Hüfte, Knie, Füße. Fertige Posen in `POSEN` (`stehen`, `sitztHandy`, `radfahren`); eigene Posen per Objekt-Spread ableiten (z. B. Pedale per `knieIK` in `Strasse.tsx`).
- **Geschlechtsneutral halten** (User-Feedback Folge 1: „zu weiblich“): keine Wimpern-Schwünge, Wangenröte nur dezent (Deckung ≤ 0,2), Augen nicht zu groß, kräftige gerade Brauen, etwas breiterer Kiefer, keine gefüllten Lippen.
- Mimik: `sehnsuechtig`, `aufgeregt`, `nervoes`, `erschoepft`, `erleichtert`, `neutral`, `staunend` (Lider, Brauen, Mund).
- Lebt automatisch: Atmen, Blinzeln (~alle 3,5 s, manchmal doppelt), Gewichtsverlagerung, Locken wippen, Kopf neigt leicht.
- `handy` + `handyLicht` = Handy von hinten, Gesicht im bläulichen Displaylicht. `kopfhoerer` für Fahrrad-/Bus-Szenen.

## Ton
- Stimme: `figur:erzaehler`, ca. 140–150 Wörter/Min., warm, nah, Pausen vor wichtigen Sätzen. Monotone Sätze aufteilen und neu erzeugen. Prüfen mit WER (Whisper) – > 25 % neu.
- Musik nur CC0/selbst erzeugt, leiser als die Stimme, ein Wechsel pro Akt. Sounddesign zu jeder Szene (Vögel, Wind, Café, Vibration, Herzschlag, Glitzern, Wasser).
- Untertitel: deutsche SRT exakt getimt; im Bild nur Schlüsselwörter groß und handgeschrieben (max. 3 Wörter).

## Retention-Regeln
- Hook in den ersten 3 s mit konkretem Bild + Zahl/Frage; nach ~12 s Figur + Situation.
- Alle 3–4 s etwas Neues; keine Einstellung länger als ~6 s ohne Kamerabewegung oder neues Element.
- Ein Stille-Moment vor der Kernaussage (Folge 1: bei 2:00).
- Ende = Brücke zur nächsten Folge; letzte ~15 s so gestalten, dass Abspann-Elemente nichts Wichtiges verdecken.

## Ablauf (mit Freigaben des Users)
1. Tool-Recherche (nur bei neuen Anforderungen; sonst diese Liste nutzen).
2. Stimme prüfen (immer `figur:erzaehler`).
3. 3 Stil-Testbilder (+ kurze Bewegungsclips) → auf OK warten. Bei „zu programmiert/zu langweilig“: neue Technik probieren.
4. Stimme + Storyboard-Stills aller Szenen → auf OK warten.
5. Vollständiger Render + SRT + 2 Thumbnails (1280×720, < 2 MB) + `youtube-texte.md` → zeigen.
6. Erst nach OK: committen, pushen, dann Shorts-Zubringer (1080×1920, 30–50 s).
7. Qualitätscheck vor jeder Abgabe: nichts eckig/grau/leer? Bewegung in jedem Bild? Länge? Sync? Fakten? Figur konsistent? Kontroll-Screenshots an den Kapitelstellen.

## Folgen
- Folge 1 – Limerenz (`kurzfilme/herzhirn/folge-01-limerenz/`): Stiltest-Szenen `Zimmer.tsx`, `Strasse.tsx`, `GehirnTal.tsx`.
- Folge 2 – Eifersucht (angekündigt im Ende von Folge 1: grüner Nebel in der Landschaft).
