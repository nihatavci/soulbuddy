import * as Font from 'expo-font';

// re:sense brand fonts (resense.design-tokens.json), bundled as local .ttf under
// assets/fonts (no npm font package). Playfair Display = brand/wordmark (statics
// instanced from the variable font: 400/700 roman, 400/900 italic), Satoshi = UI
// (regular/medium/bold/black), Special Elite = the typewriter "prompt" face.
// Family keys here must match Typography.fonts in constants/theme.ts and the
// families referenced by components/ui/Wordmark.tsx.
export async function loadFonts() {
  await Font.loadAsync({
    Ionicons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    feather: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),

    // Brand — Playfair Display (italic reserved for the Wordmark)
    'PlayfairDisplay':            require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold':       require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
    'PlayfairDisplay-Italic':     require('../assets/fonts/PlayfairDisplay-Italic.ttf'),
    'PlayfairDisplay-BlackItalic': require('../assets/fonts/PlayfairDisplay-BlackItalic.ttf'),

    // UI — Satoshi
    'Satoshi':        require('../assets/fonts/Satoshi-Regular.ttf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.ttf'),
    'Satoshi-Bold':   require('../assets/fonts/Satoshi-Bold.ttf'),
    'Satoshi-Black':  require('../assets/fonts/Satoshi-Black.ttf'),

    // Prompt — Special Elite (signal composer typewriter voice)
    'SpecialElite':   require('../assets/fonts/SpecialElite-Regular.ttf'),
  });
}
