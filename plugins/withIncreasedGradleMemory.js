const { withGradleProperties } = require("expo/config-plugins");

/**
 * Config plugin that increases JVM memory for Gradle builds.
 *
 * Fixes OutOfMemoryError: Metaspace during react-native-reanimated's
 * lintVitalAnalyzeRelease task on memory-constrained CI runners
 * (e.g. GitHub Actions ubuntu-latest with 7GB RAM).
 */
module.exports = function withIncreasedGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    const jvmArgsKey = "org.gradle.jvmargs";
    const newValue =
      "-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8";

    const existing = config.modResults.find(
      (item) => item.type === "property" && item.key === jvmArgsKey
    );

    if (existing) {
      existing.value = newValue;
    } else {
      config.modResults.push({
        type: "property",
        key: jvmArgsKey,
        value: newValue,
      });
    }

    return config;
  });
};
