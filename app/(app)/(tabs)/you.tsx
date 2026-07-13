/**
 * You — identity + settings summary (the "You" tab).
 *
 * Alias-first, privacy-first. Shows the chosen alias (never a real name), the
 * intent + boundaries the user set at onboarding, and a short list of settings
 * rows (profile, privacy, account, safety). Calm by design: no stats, no
 * streaks, no counters. Reads the profile via useProfile; sign-out via useAuth.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography } from '@/constants/theme';
import { ScreenPaddingH, Space } from '@/constants/spacing';
import { Wordmark } from '@/components/ui/Wordmark';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/context/AuthContext';
import { INTENT_OPTIONS, BOUNDARY_OPTIONS } from '@/constants/onboarding';
import { useT } from '@/context/LanguageContext';

type Row = {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  route: string;
};

const ROWS: Row[] = [
  { icon: 'user', label: 'Edit profile', route: '/(app)/profile' },
  { icon: 'lock', label: 'Privacy & consent', route: '/(app)/consent' },
  { icon: 'shield', label: 'Account', route: '/(app)/account' },
  { icon: 'flag', label: 'Safety & check-in', route: '/(app)/check-in' },
];

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export default function YouScreen() {
  const router = useRouter();
  const t = useT();
  const { data: profile } = useProfile();
  const { signOut } = useAuth();

  const intentLabels = useMemo(() => {
    const values = profile?.intent ?? [];
    return values.map((v) => {
      const opt = INTENT_OPTIONS.find((o) => o.value === v);
      return opt ? t(opt.labelKey) : v;
    });
  }, [profile?.intent, t]);

  const boundaryLabels = useMemo(() => {
    const values = profile?.boundaries ?? [];
    return values.map((v) => {
      const opt = BOUNDARY_OPTIONS.find((o) => o.value === v);
      return opt ? t(opt.labelKey) : v;
    });
  }, [profile?.boundaries, t]);

  const openRoute = (route: string) => {
    Haptics.selectionAsync();
    router.push(route as any);
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
  };

  return (
    <View style={styles.root}>
      <View style={styles.disc} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Wordmark size={24} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>You</Text>

          {/* Identity card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>YOUR ALIAS</Text>
            <Text style={styles.alias}>{profile?.alias ?? '—'}</Text>
            <Text style={styles.aliasNote}>Real name is never shown.</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Looking for</Text>
              {intentLabels.length > 0 ? (
                <View style={styles.chips}>
                  {intentLabels.map((label) => (
                    <Chip key={label} label={label} />
                  ))}
                </View>
              ) : (
                <Text style={styles.notSet}>Not set</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Boundaries</Text>
              {boundaryLabels.length > 0 ? (
                <View style={styles.chips}>
                  {boundaryLabels.map((label) => (
                    <Chip key={label} label={label} />
                  ))}
                </View>
              ) : (
                <Text style={styles.notSet}>Not set</Text>
              )}
            </View>
          </View>

          {/* Settings rows */}
          <View style={styles.list}>
            {ROWS.map((row) => (
              <Pressable
                key={row.route}
                style={styles.row}
                onPress={() => openRoute(row.route)}
                accessibilityRole="button"
              >
                <View style={styles.rowLeft}>
                  <Feather name={row.icon} size={18} color={AppColors.text} />
                  <Text style={styles.rowLabel}>{row.label}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={AppColors.textSecondary} />
              </Pressable>
            ))}
          </View>

          {/* Sign out */}
          <Pressable style={styles.signOut} onPress={handleSignOut} accessibilityRole="button">
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.background, overflow: 'hidden' },
  disc: {
    position: 'absolute', top: -170, right: -150, width: 400, height: 400,
    borderRadius: 200, backgroundColor: 'rgba(255,208,58,0.05)',
  },
  safe: { flex: 1, paddingHorizontal: ScreenPaddingH },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, paddingBottom: 8,
  },
  scroll: { paddingTop: 12, paddingBottom: 32 },
  title: {
    fontFamily: 'PlayfairDisplay', fontSize: 32, letterSpacing: -0.5,
    color: AppColors.text, marginBottom: 20,
  },
  card: {
    backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1,
    borderColor: AppColors.border, padding: 20,
  },
  cardLabel: {
    fontFamily: Typography.fonts.body, fontSize: 12, letterSpacing: 0.5,
    textTransform: 'uppercase', color: AppColors.accent,
  },
  alias: {
    fontFamily: 'PlayfairDisplay', fontSize: 28, letterSpacing: -0.3,
    color: AppColors.text, marginTop: 8,
  },
  aliasNote: {
    fontFamily: Typography.fonts.body, fontSize: 12,
    color: AppColors.textSecondary, marginTop: 4,
  },
  section: { marginTop: Space.lg },
  sectionTitle: {
    fontFamily: Typography.fonts.body, fontSize: 13, letterSpacing: 0.3,
    color: AppColors.textSecondary, marginBottom: Space.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Space['2xs'] + Space['3xs'] },
  chip: {
    backgroundColor: AppColors.elevated, borderWidth: 1, borderColor: AppColors.border,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.text },
  notSet: { fontFamily: Typography.fonts.body, fontSize: 14, color: AppColors.textSecondary },
  list: { marginTop: Space.xl },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: AppColors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  rowLabel: { fontFamily: Typography.fonts.body, fontSize: 16, color: AppColors.text },
  signOut: { marginTop: Space.xl, paddingVertical: 14, alignItems: 'center' },
  signOutText: { fontFamily: Typography.fonts.body, fontSize: 15, color: AppColors.error },
});
