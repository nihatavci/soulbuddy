import * as Font from 'expo-font';

// re:sense brand fonts: display = Instrument Serif Italic (wordmark/hero), heading
// = Inter Tight SemiBold, body = Inter Regular (PRD/design.md). No brand .ttf is
// bundled yet, so Typography.fonts in constants/theme.ts falls back to system
// families ('serif' / 'System') and the app still boots (keyless-boot philosophy).
// When the .ttf assets land under assets/fonts/, register them here, e.g.:
//   'InstrumentSerif-Italic': require('../assets/fonts/InstrumentSerif-Italic.ttf'),
//   'InterTight-SemiBold':    require('../assets/fonts/InterTight-SemiBold.ttf'),
//   'Inter-Regular':          require('../assets/fonts/Inter-Regular.ttf'),
// then point Typography.fonts.display/heading/body at those family names.
// Do NOT add an npm font package — brand fonts ship as local .ttf assets.
export async function loadFonts() {
  await Font.loadAsync({
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    feather: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),
  });
}
