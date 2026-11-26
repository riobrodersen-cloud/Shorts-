import React from "react";
import { Composition } from "remotion";
import { LasurTest } from "./herzhirn/test/LasurTest";
import { MikaTest } from "./herzhirn/test/MikaTest";
import { Zimmer } from "../kurzfilme/herzhirn/folge-01-limerenz/szenen/Zimmer";
import { Strasse } from "../kurzfilme/herzhirn/folge-01-limerenz/szenen/Strasse";
import { GehirnTal } from "../kurzfilme/herzhirn/folge-01-limerenz/szenen/GehirnTal";
import { Film, filmDauer } from "../kurzfilme/herzhirn/folge-01-limerenz/Film";
import { ThumbnailA, ThumbnailB, ThumbnailC } from "../kurzfilme/herzhirn/folge-01-limerenz/Thumbnail";
import { Profilbild } from "../kurzfilme/herzhirn/Profilbild";
import { Banner } from "../kurzfilme/herzhirn/Banner";
import { Short, SHORT_A, SHORT_B, shortDauer } from "../kurzfilme/herzhirn/folge-01-limerenz/Shorts";
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LasurTest" component={LasurTest} durationInFrames={30} fps={30} width={1920} height={1080} />
    <Composition id="MikaTest" component={MikaTest} durationInFrames={120} fps={30} width={1920} height={1080} />
    <Composition id="StilZimmer" component={Zimmer} durationInFrames={150} fps={30} width={1920} height={1080} />
    <Composition id="StilStrasse" component={Strasse} durationInFrames={150} fps={30} width={1920} height={1080} />
    <Composition id="StilGehirn" component={GehirnTal} durationInFrames={150} fps={30} width={1920} height={1080} />
    <Composition id="Folge01Limerenz" component={Film} durationInFrames={filmDauer()} fps={30} width={1920} height={1080} />
    <Composition id="ThumbnailA" component={ThumbnailA} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="ThumbnailB" component={ThumbnailB} durationInFrames={1} fps={30} width={1280} height={720} />
    <Composition id="ShortA" component={Short} defaultProps={{ fenster: SHORT_A }} durationInFrames={shortDauer(SHORT_A)} fps={30} width={1080} height={1920} />
    <Composition id="ShortB" component={Short} defaultProps={{ fenster: SHORT_B }} durationInFrames={shortDauer(SHORT_B)} fps={30} width={1080} height={1920} />
    <Composition id="Profilbild" component={Profilbild} durationInFrames={1} fps={30} width={800} height={800} />
    <Composition id="Banner" component={Banner} durationInFrames={1} fps={30} width={2560} height={1440} />
    <Composition id="ThumbnailC" component={ThumbnailC} durationInFrames={1} fps={30} width={1280} height={720} />
  </>
);
