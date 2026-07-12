/**
 * AvatarImage
 *
 * Priority: Clerk imageUrl → Gravatar (retro pixel art) → Initials
 *
 * No extra packages — uses expo-crypto (already installed) for MD5.
 */

import React, { useEffect, useState } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { AppColors, Typography } from '@/constants/theme';
import * as Crypto from 'expo-crypto';

interface AvatarImageProps {
  imageUrl?: string;
  email: string;
  name: string;
  size?: number;
  borderColor?: string;
}

type FallbackState = 'clerk' | 'gravatar' | 'initials';

const INITIAL_COLORS = [AppColors.accent, AppColors.accentDeep, AppColors.accentMuted, AppColors.accentLight, AppColors.accentMuted];

function getInitials(name: string, email: string): string {
  const src = name.trim() || email.trim();
  return src
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getColorFromEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

export function AvatarImage({
  imageUrl,
  email,
  name,
  size = 38,
  borderColor = 'rgba(255,255,255,0.8)',
}: AvatarImageProps) {
  const [fallback, setFallback] = useState<FallbackState>('clerk');
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);

  // Compute Gravatar URL once
  useEffect(() => {
    if (!email) return;
    Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      email.trim().toLowerCase(),
    ).then(hash => {
      setGravatarUrl(`https://www.gravatar.com/avatar/${hash}?s=${size * 2}&d=retro`);
    }).catch(() => {});
  }, [email, size]);

  const radius = size / 2;
  const containerStyle = { width: size, height: size, borderRadius: radius };

  // Initials fallback
  if (fallback === 'initials') {
    const bg = getColorFromEmail(email);
    const initials = getInitials(name, email);
    return (
      <View style={[styles.initialsContainer, containerStyle, { backgroundColor: bg, borderColor }]}>
        <Text style={[styles.initialsText, { fontSize: size * 0.36 }]}>{initials}</Text>
      </View>
    );
  }

  const uri = fallback === 'gravatar' ? gravatarUrl : imageUrl;

  if (!uri) {
    // Still loading Gravatar hash or no imageUrl — show initials immediately
    const bg = getColorFromEmail(email);
    const initials = getInitials(name, email);
    return (
      <View style={[styles.initialsContainer, containerStyle, { backgroundColor: bg, borderColor }]}>
        <Text style={[styles.initialsText, { fontSize: size * 0.36 }]}>{initials}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, containerStyle, { borderColor }]}
      onError={() => {
        if (fallback === 'clerk') {
          // Try Gravatar next
          if (gravatarUrl) {
            setFallback('gravatar');
          } else {
            setFallback('initials');
          }
        } else {
          setFallback('initials');
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 1.5,
  },
  initialsContainer: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#fff',
    fontFamily: Typography.fonts.heading,
    includeFontPadding: false,
  },
});
