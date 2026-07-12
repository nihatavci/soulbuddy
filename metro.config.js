const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
// getSentryExpoConfig wraps getDefaultConfig — adds unique Debug IDs
// to bundles and source maps so Sentry can symbolicate stack traces.
const config = getSentryExpoConfig(__dirname);

module.exports = withNativeWind(config, {
  input: "./global.css",
});
