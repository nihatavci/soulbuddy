const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;
    // Find and update org.gradle.jvmargs
    const idx = props.findIndex(
      (p) => p.type === 'property' && p.key === 'org.gradle.jvmargs'
    );
    const newValue = '-Xmx4096m -XX:MaxMetaspaceSize=1024m';
    if (idx >= 0) {
      props[idx].value = newValue;
    } else {
      props.push({ type: 'property', key: 'org.gradle.jvmargs', value: newValue });
    }
    return config;
  });
};
