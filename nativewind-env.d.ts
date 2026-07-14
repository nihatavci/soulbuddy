/// <reference types="nativewind/types" />

// NativeWind 4 (react-native-css-interop) className JSX augmentation. The
// previously generated reference pointed at `react-native-css/types`, a package
// not installed for nativewind@4.1.x, so `className` failed to typecheck on RN
// components. nativewind/types chains to react-native-css-interop/types, which
// declares `className` on the RN component props.
