/**
 * Reveal / Verification — choosing, deliberately and mutually, to reveal more of
 * your real identity.
 *
 * re:sense keeps identity behind a chosen alias by default. Revealing is a
 * consensual, reversible-in-spirit act: nothing is shared until the other person
 * also chooses to, and the primary CTA is gated behind an explicit consent
 * checkbox. Calm and careful by design — no urgency, no pressure, no dark
 * patterns. UI shell — the "choose to reveal" action is mocked (router.back()).
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/icons/Icon';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH, Space } from '@/constants/spacing';
import { Button } from '@/components/ui/Button';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { GoldDisc } from '@/components/ui/GoldDisc';
import { Toast } from '@/components/glow';
import { useReveal, useRevealActions } from '@/hooks/useReveal';
import { usePrivateSpaces, otherAlias } from '@/hooks/useSpaces';
import { useAuth } from '@/context/AuthContext';

const SHARED_ITEMS = [
  'A verified 18+ status',
  'A first name — only if you type one',
  'Nothing else, ever, automatically',
];

export default function RevealScreen() {
  const router = useRouter();
  const { spaceId } = useLocalSearchParams<{ spaceId?: string }>();
  const { user } = useAuth();
  const { data: spaces } = usePrivateSpaces();
  const space = spaces?.find((s) => s.id === spaceId);
  const alias = space && user?.id ? otherAlias(space, user.id) : 'them';

  const { iRevealed, bothRevealed, other } = useReveal(spaceId);
  const { reveal, withdraw } = useRevealActions(spaceId ?? '');

  const [agreed, setAgreed] = useState(false);
  const [firstName, setFirstName] = useState('');

  const handleReveal = async () => {
    if (!agreed || !spaceId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await reveal.mutateAsync(firstName || undefined);
      Toast.show(
        `You chose to reveal. ${alias} will only see it once they choose to, too.`,
        { type: 'success', position: 'top', duration: 3600 },
      );
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show(e?.message || 'Could not reveal. Try again.', { type: 'error', position: 'top', duration: 3600 });
    }
  };

  const handleWithdraw = async () => {
    Haptics.selectionAsync();
    try {
      await withdraw.mutateAsync();
      Toast.show('You’re anonymous again. Nothing was shared.', { type: 'info', position: 'top', duration: 3200 });
    } catch (e: any) {
      Toast.show(e?.message || 'Could not undo. Try again.', { type: 'error', position: 'top', duration: 3200 });
    }
  };

  return (
    <PaperBackground style={styles.root}>
      <GoldDisc size={320} top={-120} right={-150} opacity={0.4} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Icon name="x" size={24} color={AppColors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emblem}>
            <Icon name="eye" size={26} color={AppColors.accent} />
          </View>

          {bothRevealed ? (
            <>
              <Text style={styles.title}>You’ve both revealed</Text>
              <Text style={styles.body}>
                You each chose this, in your own time. Here’s what {alias} shared.
              </Text>
              <View style={styles.card}>
                <View style={styles.shareRow}>
                  <Icon name="person" size={16} color={AppColors.accent} />
                  <Text style={styles.shareLabel}>
                    {other?.first_name?.trim() || 'No name shared — that’s okay'}
                  </Text>
                </View>
                <View style={styles.shareRow}>
                  <Icon
                    name={other?.age_verified ? 'check' : 'x'}
                    size={16}
                    color={other?.age_verified ? AppColors.success : AppColors.textSecondary}
                  />
                  <Text style={styles.shareLabel}>
                    {other?.age_verified ? 'Verified 18+' : '18+ not verified'}
                  </Text>
                </View>
              </View>
              <Button label="Back to the conversation" variant="primary" size="lg" onPress={() => router.back()} style={styles.cta} />
            </>
          ) : iRevealed ? (
            <>
              <Text style={styles.title}>Waiting for {alias}</Text>
              <Text style={styles.body}>
                You’ve revealed. Nothing is shared until {alias} also chooses to —
                no pressure, no timer. This can sit here as long as it needs to.
              </Text>
              <View style={styles.waitRow}>
                <ActivityIndicator color={AppColors.accent} />
                <Text style={styles.waitText}>Their choice, their time.</Text>
              </View>
              <Button
                label="Undo — stay anonymous"
                variant="secondary"
                size="lg"
                onPress={handleWithdraw}
                loading={withdraw.isPending}
                style={styles.cta}
              />
              <Pressable style={styles.secondary} onPress={() => router.back()} accessibilityRole="button">
                <Text style={styles.secondaryText}>Back to the conversation</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Choose to reveal</Text>
              <Text style={styles.body}>
                Revealing is mutual and reversible in spirit — you only move as far
                as you both agree. Nothing is shared until {alias} also chooses to.
                Take your time.
              </Text>

              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Icon name="shield" size={16} color={AppColors.textSecondary} />
                  <Text style={styles.cardTitle}>What gets shared</Text>
                </View>
                {SHARED_ITEMS.map((item) => (
                  <View key={item} style={styles.shareRow}>
                    <Icon name="check" size={16} color={AppColors.success} />
                    <Text style={styles.shareLabel}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.inputLabel}>Your first name (optional)</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Only if you want to"
                placeholderTextColor={AppColors.textSecondary}
                maxLength={40}
                autoCapitalize="words"
                returnKeyType="done"
              />

              <Pressable
                style={styles.checkRow}
                onPress={() => {
                  Haptics.selectionAsync();
                  setAgreed((v) => !v);
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed }}
              >
                <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
                  {agreed && <Icon name="check" size={15} color={AppColors.ink} />}
                </View>
                <Text style={styles.checkLabel}>
                  I understand revealing is my choice, and I can stop here.
                </Text>
              </Pressable>

              <Button
                label="Choose to reveal"
                variant="primary"
                size="lg"
                onPress={handleReveal}
                disabled={!agreed}
                loading={reveal.isPending}
                style={styles.cta}
              />

              <Pressable style={styles.secondary} onPress={() => router.back()} accessibilityRole="button">
                <Text style={styles.secondaryText}>Stay anonymous for now</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: ScreenPaddingH },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Space.xs,
    paddingBottom: Space.xs,
  },
  scroll: { paddingTop: Space.md, paddingBottom: Space.xl, alignItems: 'stretch' },
  emblem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,208,58,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Space.lg,
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 30,
    letterSpacing: -0.5,
    color: AppColors.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    lineHeight: 24,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: Space.sm,
    marginBottom: Space.xl,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 18,
    marginBottom: Space.xl,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Space.md,
  },
  cardTitle: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: AppColors.textSecondary,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Space.sm,
  },
  shareLabel: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: AppColors.text,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: Space.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.6,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: AppColors.accent, borderColor: AppColors.accent },
  checkLabel: {
    flex: 1,
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: AppColors.text,
  },
  cta: { borderRadius: 999 },
  secondary: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Space.md,
  },
  secondaryText: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    color: AppColors.textSecondary,
  },
  inputLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: AppColors.textSecondary,
    marginBottom: Space.sm,
  },
  input: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: Typography.fonts.body,
    fontSize: 16,
    color: AppColors.text,
    marginBottom: Space.lg,
  },
  waitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Space.xl,
  },
  waitText: {
    fontFamily: Typography.fonts.body,
    fontSize: 14,
    color: AppColors.textSecondary,
  },
});
