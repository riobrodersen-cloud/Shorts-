import { Config } from "@remotion/cli/config";

// Vorinstallierten Chrome nutzen – Remotion soll keinen eigenen Browser herunterladen.
Config.setBrowserExecutable(
  process.env.REMOTION_BROWSER_EXECUTABLE ??
    "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell",
);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(3);
