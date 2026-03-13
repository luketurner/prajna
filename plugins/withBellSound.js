const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Config plugin that copies bell.mp3 to Android raw resources
 * so it can be used as a notification sound by Notifee.
 */
module.exports = function withBellSound(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const source = path.join(projectRoot, "assets", "audio", "bell.mp3");
      const rawDir = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "raw",
      );

      fs.mkdirSync(rawDir, { recursive: true });
      fs.copyFileSync(source, path.join(rawDir, "bell.mp3"));

      return config;
    },
  ]);
};
