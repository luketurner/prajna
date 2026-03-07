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
      (s) => s.$?.["android:name"] === "app.notifee.core.ForegroundService"
    );

    if (existing) {
      // Update existing entry
      existing.$["android:foregroundServiceType"] = "specialUse";
      existing.$["tools:replace"] = "android:foregroundServiceType";
    } else {
      // Add new service entry
      application.service.push({
        $: {
          "android:name": "app.notifee.core.ForegroundService",
          "android:foregroundServiceType": "specialUse",
          "tools:replace": "android:foregroundServiceType",
        },
      });
    }

    // Ensure xmlns:tools is declared on the manifest element
    if (!manifest.manifest.$["xmlns:tools"]) {
      manifest.manifest.$["xmlns:tools"] =
        "http://schemas.android.com/tools";
    }

    // Add FOREGROUND_SERVICE_SPECIAL_USE permission (Android 14+)
    if (!manifest.manifest["uses-permission"]) {
      manifest.manifest["uses-permission"] = [];
    }
    const permissions = manifest.manifest["uses-permission"];
    const specialUsePermission =
      "android.permission.FOREGROUND_SERVICE_SPECIAL_USE";
    const hasPermission = permissions.some(
      (p) => p.$?.["android:name"] === specialUsePermission
    );
    if (!hasPermission) {
      permissions.push({
        $: { "android:name": specialUsePermission },
      });
    }

    return config;
  });
};
