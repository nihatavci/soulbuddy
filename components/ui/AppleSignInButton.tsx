/**
 * AppleSignInButton — native "Sign in with Apple" button (iOS only).
 *
 * Renders Apple's HIG-compliant button and calls `onPress` (which should invoke
 * useAuth().signInWithApple). Returns null when Apple auth isn't available
 * (Android, simulator without an Apple account, older iOS) so callers can drop
 * it in unconditionally.
 */

import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

interface AppleSignInButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function AppleSignInButton({ onPress, style }: AppleSignInButtonProps) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAvailable).catch(() => setAvailable(false));
  }, []);

  if (!available) return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
      cornerRadius={999}
      style={[styles.button, style]}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  button: { height: 52, width: '100%' },
});
