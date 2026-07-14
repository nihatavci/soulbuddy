/**
 * IdentityCard — a "reflective glass" identity card for the You screen.
 *
 * A native reimagining of the React-Bits ReflectiveCard for re:sense. The
 * backdrop is the user's photo, rendered PERMANENTLY blurred + desaturated with
 * GPU Skia — so it reads as a frosted-glass presence, never a recognisable face
 * (identity stays delayed; even a screenshot is blurred because the pixels are).
 * On top: a metallic sheen (gradient), charcoal grain, a hairline light border,
 * and the alias where a name would go. Charcoal = privacy, per the design.
 *
 * Tap the card to set / change the photo. Presentational — the parent owns the
 * photo URI + picker.
 */

import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Image as SkiaImage, useImage, Blur, ColorMatrix, Paint, Group, Fill } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const CHARCOAL = '#151518';
const PAPER = '#F3EFE6';
const GOLD = '#FFD03A';
const NOISE = require('@/assets/textures/tex-charcoal.png');

// Partial-desaturation color matrix (keeps ~35% saturation).
const S = 0.35;
const LR = 0.3086, LG = 0.6094, LB = 0.082;
const DESAT = [
  LR * (1 - S) + S, LG * (1 - S), LB * (1 - S), 0, 0,
  LR * (1 - S), LG * (1 - S) + S, LB * (1 - S), 0, 0,
  LR * (1 - S), LG * (1 - S), LB * (1 - S) + S, 0, 0,
  0, 0, 0, 1, 0,
];

interface IdentityCardProps {
  alias: string;
  role?: string;          // e.g. first intent label
  photoUri?: string;
  onPress: () => void;    // set / change photo
}

// Deterministic pseudo-id from the alias (no PII) — just decorative.
function aliasId(alias: string): string {
  let h = 0;
  for (let i = 0; i < alias.length; i++) h = (h * 31 + alias.charCodeAt(i)) >>> 0;
  const s = (h % 1_0000_0000).toString().padStart(8, '0');
  return `${s.slice(0, 4)} · ${s.slice(4)}`;
}

export function IdentityCard({ alias, role, photoUri, onPress }: IdentityCardProps) {
  const { width } = useWindowDimensions();
  const W = width - 52;       // matches ScreenPaddingH (26) on both sides
  const H = Math.round(W * 1.38);
  const img = useImage(photoUri ?? null);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Set or change your blurred identity photo">
      <View style={[styles.card, { width: W, height: H }]}>
        {/* blurred + desaturated photo backdrop (GPU) */}
        <Canvas style={StyleSheet.absoluteFill}>
          {img ? (
            <Group
              layer={
                <Paint>
                  <Blur blur={26} />
                  <ColorMatrix matrix={DESAT} />
                </Paint>
              }
            >
              <SkiaImage image={img} x={0} y={0} width={W} height={H} fit="cover" />
            </Group>
          ) : (
            <Fill color={CHARCOAL} />
          )}
        </Canvas>

        {/* charcoal grain */}
        <Image source={NOISE} resizeMode="cover" style={[StyleSheet.absoluteFill, styles.noise]} />

        {/* metallic sheen */}
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.14)', 'rgba(255,255,255,0.18)']}
          locations={[0, 0.4, 0.62, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* legibility scrim (top + bottom) */}
        <LinearGradient
          colors={['rgba(10,10,12,0.35)', 'rgba(10,10,12,0)', 'rgba(10,10,12,0.55)']}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Feather name="lock" size={12} color={PAPER} />
              <Text style={styles.badgeText}>PRIVATE · 18+</Text>
            </View>
            <Feather name="activity" size={18} color={PAPER} style={{ opacity: 0.8 }} />
          </View>

          <View style={styles.body}>
            <Text style={styles.alias} numberOfLines={1}>{alias || '—'}</Text>
            <Text style={styles.role}>{(role || 'anonymous').toUpperCase()}</Text>
            {!photoUri && <Text style={styles.hint}>tap to add a photo — it stays blurred</Text>}
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.label}>ALIAS ID</Text>
              <Text style={styles.value}>{aliasId(alias || 'anon')}</Text>
            </View>
            <Feather name="shield" size={28} color={PAPER} style={{ opacity: 0.45 }} />
          </View>
        </View>

        {/* hairline light border */}
        <View style={styles.border} pointerEvents="none" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: CHARCOAL,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 10,
  },
  noise: { opacity: 0.22 },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  content: { flex: 1, justifyContent: 'space-between', padding: 26 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  badgeText: { fontFamily: 'Satoshi', fontSize: 10, letterSpacing: 1, fontWeight: '700', color: PAPER },
  body: { alignItems: 'center', gap: 6, marginBottom: 8 },
  alias: {
    fontFamily: 'PlayfairDisplay', fontSize: 34, letterSpacing: -0.5, color: PAPER,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  role: { fontFamily: 'Satoshi', fontSize: 12, letterSpacing: 3, color: PAPER, opacity: 0.72 },
  hint: { fontFamily: 'Satoshi', fontSize: 12, color: PAPER, opacity: 0.6, marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  label: { fontFamily: 'Satoshi', fontSize: 9, letterSpacing: 1, color: PAPER, opacity: 0.6 },
  value: { fontFamily: 'Satoshi', fontSize: 14, letterSpacing: 1, color: PAPER, marginTop: 3 },
});
