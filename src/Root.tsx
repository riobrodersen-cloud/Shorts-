import React from "react";
import { Composition } from "remotion";
import { LasurTest } from "./herzhirn/test/LasurTest";
import { MikaTest } from "./herzhirn/test/MikaTest";
import { Zimmer } from "../kurzfilme/herzhirn/folge-01-limerenz/szenen/Zimmer";
import { Strasse } from "../kurzfilme/herzhirn/folge-01-limerenz/szenen/Strasse";
import { GehirnTal } from "../kurzfilme/herzhirn/folge-01-limerenz/szenen/GehirnTal";
import { Film, filmDauer } from "../kurzfilme/herzhirn/folge-01-limerenz/Film";
import { ThumbnailA, ThumbnailB } from "../kurzfilme/herzhirn/folge-01-limerenz/Thumbnail";
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
  </>
);
