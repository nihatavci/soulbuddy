import * as Font from 'expo-font';

// Custom UI fonts removed for the boilerplate (system font is the default).
// To add a brand font: install it, require the .ttf here, and update
// Typography.fonts in constants/theme.ts.
export async function loadFonts() {
  await Font.loadAsync({
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    feather: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),
  });
}
