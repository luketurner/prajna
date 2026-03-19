const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Config plugin that adds SCHEDULE_EXACT_ALARM permission to the Android manifest.
 * Required on Android 12+ (API 31+) for exact alarm notifications via Notifee.
 */
module.exports = function withExactAlarm(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const permission = "android.permission.SCHEDULE_EXACT_ALARM";
    const alreadyExists = manifest["uses-permission"].some(
      (perm) => perm.$?.["android:name"] === permission,
    );

    if (!alreadyExists) {
      manifest["uses-permission"].push({
        $: { "android:name": permission },
      });
    }

    return config;
  });
};
