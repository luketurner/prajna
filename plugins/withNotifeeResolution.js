const { withProjectBuildGradle } = require("expo/config-plugins");

/**
 * Config plugin that forces Gradle to resolve app.notifee artifacts
 * exclusively from the local node_modules directory.
 *
 * Fixes build failures caused by maven.notifee.app being offline
 * and JitPack timing out when scanning for the artifact.
 * See: https://github.com/invertase/notifee/issues/1284
 */
module.exports = function withNotifeeResolution(config) {
  return withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    const addition = `
allprojects {
    repositories {
        exclusiveContent {
            filter {
                includeGroup "app.notifee"
            }
            forRepository {
                maven {
                    url "$rootDir/../node_modules/@notifee/react-native/android/libs"
                }
            }
        }
    }
}
`;

    if (!buildGradle.includes('includeGroup "app.notifee"')) {
      config.modResults.contents = buildGradle + addition;
    }

    return config;
  });
};
