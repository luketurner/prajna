const { withGradleProperties } = require("expo/config-plugins");

/**
 * Config plugin that increases Gradle HTTP timeouts to 120 seconds.
 *
 * Prevents build failures from slow Maven repository responses.
 * See: https://github.com/invertase/notifee/issues/1284
 */
module.exports = function withGradleTimeout(config) {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: "property",
      key: "systemProp.org.gradle.internal.http.connectionTimeout",
      value: "120000",
    });
    config.modResults.push({
      type: "property",
      key: "systemProp.org.gradle.internal.http.socketTimeout",
      value: "120000",
    });
    return config;
  });
};
