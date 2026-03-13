const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Config plugin that adds the foreground service type for Notifee
 * to the AndroidManifest.xml. This is required for Android 14+ (API 34).
 *
 * Notifee declares its own ForegroundService in its manifest, but we
 * need to override it to specify the foregroundServiceType attribute.
 */
module.exports = function withNotifee(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];
    if (!application) return config;

    // Ensure we have a service array
    if (!application.service) {
      application.service = [];
    }

    // Check if Notifee ForegroundService is already declared
    const existing = application.service.find(
      (s) => s.$?.["android:name"] === "app.notifee.core.ForegroundService",
    );

    if (existing) {
      // Update existing entry
      existing.$["android:foregroundServiceType"] = "mediaPlayback";
      existing.$["tools:replace"] = "android:foregroundServiceType";
    } else {
      // Add new service entry
      application.service.push({
        $: {
          "android:name": "app.notifee.core.ForegroundService",
          "android:foregroundServiceType": "mediaPlayback",
          "tools:replace": "android:foregroundServiceType",
        },
      });
    }

    // Ensure xmlns:tools is declared on the manifest element
    if (!manifest.manifest.$["xmlns:tools"]) {
      manifest.manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    // Add required permissions
    if (!manifest.manifest["uses-permission"]) {
      manifest.manifest["uses-permission"] = [];
    }
    const permissions = manifest.manifest["uses-permission"];

    const requiredPermissions = [
      "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
    ];

    for (const perm of requiredPermissions) {
      const has = permissions.some((p) => p.$?.["android:name"] === perm);
      if (!has) {
        permissions.push({ $: { "android:name": perm } });
      }
    }

    return config;
  });
};
