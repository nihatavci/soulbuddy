/**
 * Profile screen
 *
 * Displays the user's name and email, lets them edit their display name.
 * Avatar is rendered as initials (no image upload required).
 * Navigates to account.tsx for security/account settings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  Linking,
} from 'react-native';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedPressable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography, CardThemes } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Toast } from '@/components/glow/index';
import { presentCustomerCenter } from '@/lib/revenuecat';
import { useEntitlements } from '@/hooks/useEntitlements';
import {
  isPushOptedIn,
  optInPush,
  optOutPush,
  requestPushPermission,
  hasPushPermission,
  sendTestPushNotification,
} from '@/lib/onesignal';
import { trackMixpanelPushPermissionGranted as trackPushPermissionGranted, trackMixpanelPushPermissionDenied as trackPushPermissionDenied, optInMixpanel, optOutMixpanel } from '@/lib/mixpanel';
import { useT } from '@/context/LanguageContext';
import { Feather } from '@expo/vector-icons';
import {
  getConsentPreferences,
  saveConsentPreferences,
  getCcpaDoNotSell,
  setCcpaDoNotSell,
  type ConsentPreferences,
} from '@/lib/consent';
import { useAccountDeletion } from '@/hooks/useAccountDeletion';


function getInitials(name: string | null | undefined, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function ProfileScreen() {
  const t = useT();
  const router = useRouter();
  const { user, isLoading, isAnonymous } = useAuth();
  const { data: entitlements } = useEntitlements();
  const isPro = entitlements?.isPro ?? false;
  const { loading: deletingAccount, confirmDelete } = useAccountDeletion();

  const displayName = user?.name ?? '';
  const email       = user?.email ?? '';
  const initials    = getInitials(displayName, email);

  // ─── Notification preferences ──────────────────────────────────────────────
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    // Read current push opt-in state on mount
    setPushEnabled(isPushOptedIn());
  }, []);

  const handleTogglePush = useCallback(async (value: boolean) => {
    Haptics.selectionAsync();
    if (value) {
      // If OS permission hasn't been granted yet, request it
      if (!hasPushPermission()) {
        const granted = await requestPushPermission();
        if (!granted) {
          trackPushPermissionDenied();
          Toast.show(
            t('profile.toasts.enablePushInSettings'),
            { type: 'info', duration: 4000, position: 'top' },
          );
          Linking.openSettings();
          return; // Don't flip the toggle — user denied OS permission
        }
        trackPushPermissionGranted();
      }
      optInPush();
      setPushEnabled(true);
      // Send a real push after a 2s delay — gives OneSignal time to register
      // the subscription before delivery. This proves the pipeline works.
      if (user?.id) {
        setTimeout(() => sendTestPushNotification(user.id), 2000);
      }
    } else {
      optOutPush();
      setPushEnabled(false);
    }
  }, [user?.id]);

  // ─── Privacy consent preferences ────────────────────────────────────────────
  const [consent, setConsent] = useState<ConsentPreferences>(getConsentPreferences);

  const handleToggleConsent = useCallback((key: keyof ConsentPreferences, value: boolean) => {
    Haptics.selectionAsync();
    const updated = { ...consent, [key]: value };
    setConsent(updated);
    saveConsentPreferences(updated);

    // Apply analytics consent immediately
    if (key === 'analytics') {
      if (value) optInMixpanel();
      else optOutMixpanel();
    }

    Toast.show(
      value ? t('profile.toasts.preferenceEnabled') : t('profile.toasts.preferenceDisabled'),
      { type: 'success', duration: 1500, position: 'top' },
    );
  }, [consent]);

  // ─── CCPA "Do Not Sell" ──────────────────────────────────────────────────
  const [doNotSell, setDoNotSell] = useState(getCcpaDoNotSell);

  const handleToggleDoNotSell = useCallback((value: boolean) => {
    Haptics.selectionAsync();
    setDoNotSell(value);
    setCcpaDoNotSell(value);
    // When user opts out of selling, also disable analytics
    if (value && consent.analytics) {
      const updated = { ...consent, analytics: false };
      setConsent(updated);
      saveConsentPreferences(updated);
      optOutMixpanel();
    }
    Toast.show(
      value ? t('profile.toasts.dataSharingOptedOut') : t('profile.toasts.dataSharingOptedIn'),
      { type: 'success', duration: 1500, position: 'top' },
    );
  }, [consent]);

  // ─── Name editing ─────────────────────────────────────────────────────────
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput]     = useState(displayName);
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [nameFocused, setNameFocused] = useState(false);

  const handleSaveName = async () => {
    if (!user) return;
    if (!nameInput.trim()) {
      setSaveError(t('profile.nameEmpty'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaveError(null);
    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: nameInput.trim() },
      });
      if (error) throw error;
      setEditingName(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show(t('profile.nameUpdated'), { type: 'success', duration: 2000, position: 'top' });
    } catch (err: any) {
      const msg = err?.message ?? t('profile.failedUpdate');
      setSaveError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show(msg, { type: 'error', duration: 3000, position: 'top' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setNameInput(displayName);
    setSaveError(null);
    setEditingName(false);
  };

  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={AppColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isAnonymous ? (
          <>
            {/* Avatar — light cream circle with gold profile icon */}
            <View style={styles.avatarSection}>
              <View style={[styles.avatarCircle, styles.localAvatarCircle]}>
                <Feather name="user" size={32} color={AppColors.accent} />
              </View>
              {isPro && (
                <View style={styles.proBadge}>
                  <Feather name="star" size={10} color="#FFFFFF" />
                  <Text style={styles.proBadgeText}>MyApp Pro</Text>
                </View>
              )}
            </View>

            {/* Back-up hero — framed as protection, not "create account from nothing" */}
            <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.guestHero}>
              <View style={styles.guestHeroIconWrap}>
                <Feather name="shield" size={18} color={AppColors.accentDeep} />
              </View>
              <Text style={styles.guestHeroHeadline}>{t('profile.backUpAccount')}</Text>
              <Text style={styles.guestHeroBody}>
                {t('profile.guestHeroBody')}
              </Text>
              <Pressable
                style={styles.guestHeroCTA}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(app)/signup');
                }}
              >
                <Text style={styles.guestHeroCTAText}>{t('account.backUpWithEmail')}</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </Pressable>
            </Animated.View>
          </>
        ) : (
          <>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
              <Text style={styles.avatarSubtext}>{t('profile.avatarSubtext')}</Text>
            </View>

            {/* Info Card */}
            <Animated.View entering={FadeInDown.duration(300).springify()} style={[styles.card, { backgroundColor: CardThemes.slate.bg }]}>
              {/* Name Row */}
              <View style={styles.fieldRow}>
                <View style={styles.fieldLeft}>
                  <Text style={styles.fieldLabel}>{t('profile.displayName')}</Text>
                  {editingName ? (
                    <AnimatedInputWrapper focused={nameFocused} style={styles.fieldInputWrap}>
                      <TextInput
                        style={styles.fieldInput}
                        value={nameInput}
                        onChangeText={val => { setNameInput(val); setSaveError(null); }}
                        placeholder={t('profile.yourNamePlaceholder')}
                        placeholderTextColor={AppColors.textSecondary}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleSaveName}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                      />
                    </AnimatedInputWrapper>
                  ) : (
                    <Text style={styles.fieldValue}>{displayName || '—'}</Text>
                  )}
                </View>

                {editingName ? (
                  <View style={styles.editActions}>
                    <Pressable style={styles.cancelBtn} onPress={handleCancelEdit}>
                      <Text style={styles.cancelBtnText}>{t('profile.cancel')}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                      onPress={handleSaveName}
                      disabled={saving}
                    >
                      {saving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.saveBtnText}>{t('profile.save')}</Text>
                      }
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.editBtn}
                    onPress={() => { setEditingName(true); Haptics.selectionAsync(); }}
                  >
                    <Ionicons name="pencil-outline" size={18} color={AppColors.textSecondary} />
                  </Pressable>
                )}
              </View>

              {saveError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{saveError}</Text>
                </View>
              )}

              <View style={styles.divider} />

              {/* Email Row (read-only) */}
              <View style={styles.fieldRow}>
                <View style={styles.fieldLeft}>
                  <Text style={styles.fieldLabel}>{t('profile.email')}</Text>
                  <Text style={styles.fieldValue}>{email || '—'}</Text>
                </View>
                <View style={styles.readOnlyBadge}>
                  <Text style={styles.readOnlyText}>{t('profile.verified')}</Text>
                </View>
              </View>
            </Animated.View>
          </>
        )}

        {/* Account Settings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.account')}</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(300).delay(80).springify()} style={[styles.card, styles.premiumCard]}>
          {!isAnonymous && (
            <>
              <Pressable
                style={styles.menuRow}
                onPress={() => router.push('/(app)/account')}
              >
                <View style={styles.menuRowLeft}>
                  <View style={styles.menuIcon}>
                    <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.menuLabel}>{t('profile.passwordSecurity')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={AppColors.textSecondary} />
              </Pressable>

              <View style={styles.divider} />
            </>
          )}

          {/* Enhance your replies */}
          <View style={styles.enhanceWrap}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: '/(app)/paywall', params: { source: 'profile_powerup' } });
              }}
              style={{ width: '100%', backgroundColor: '#FFF8E6', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)', paddingVertical: 14, paddingHorizontal: 16 }}
            >
              <View style={styles.enhanceInner}>
                <View style={styles.enhanceIconChip}>
                  <Feather name="zap" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.enhanceLabel}>{t('profile.enhanceReplies')}</Text>
                  <Text style={styles.enhanceSub}>
                    {t('profile.enhanceReplies_inactive')}
                  </Text>
                </View>
                <View style={styles.enhanceStartChip}>
                  <Text style={styles.enhanceStartChipText}>{t('common.start')}</Text>
                  <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                </View>
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* Notifications */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.notifications')}</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(300).delay(160).springify()} style={[styles.card, styles.premiumCard]}>
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{t('profile.pushNotifications')}</Text>
                <Text style={styles.menuSub}>{t('profile.pushNotificationsSubtitle')}</Text>
              </View>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: AppColors.border, true: AppColors.accent }}
              thumbColor="#fff"
            />
          </View>
        </Animated.View>

        {/* Privacy */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('common.privacy')}</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(300).delay(200).springify()} style={[styles.card, styles.premiumCard]}>
          {/* Analytics toggle */}
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIcon}>
                <Feather name="bar-chart-2" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{t('profile.analytics')}</Text>
                <Text style={styles.menuSub}>{t('profile.analyticsSubtitle')}</Text>
              </View>
            </View>
            <Switch
              value={consent.analytics}
              onValueChange={(v) => handleToggleConsent('analytics', v)}
              trackColor={{ false: AppColors.border, true: AppColors.accent }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          {/* Crash Reporting toggle */}
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIcon}>
                <Feather name="alert-triangle" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{t('profile.crashReports')}</Text>
                <Text style={styles.menuSub}>{t('profile.crashReportsSubtitle')}</Text>
              </View>
            </View>
            <Switch
              value={consent.crashReport}
              onValueChange={(v) => handleToggleConsent('crashReport', v)}
              trackColor={{ false: AppColors.border, true: AppColors.accent }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          {/* AI Processing toggle */}
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIcon}>
                <Feather name="cpu" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{t('profile.aiProcessing')}</Text>
                <Text style={styles.menuSub}>{t('profile.aiProcessingSubtitle')}</Text>
              </View>
            </View>
            <Switch
              value={consent.aiProcessing}
              onValueChange={(v) => handleToggleConsent('aiProcessing', v)}
              trackColor={{ false: AppColors.border, true: AppColors.accent }}
              thumbColor="#fff"
            />
          </View>
        </Animated.View>

        {/* CCPA */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.californiaPrivacy')}</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(300).delay(220).springify()} style={[styles.card, styles.premiumCard]}>
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIcon}>
                <Feather name="slash" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{t('profile.doNotSell')}</Text>
                <Text style={styles.menuSub}>{t('profile.doNotSellSubtitle')}</Text>
              </View>
            </View>
            <Switch
              value={doNotSell}
              onValueChange={handleToggleDoNotSell}
              trackColor={{ false: AppColors.border, true: AppColors.accent }}
              thumbColor="#fff"
            />
          </View>
        </Animated.View>

        {/* Subscription */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('profile.subscription')}</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(300).delay(300).springify()} style={[styles.card, styles.premiumCard]}>
          {/* Current plan row */}
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name="star-outline" size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.menuLabel}>{t('profile.currentPlan')}</Text>
                <Text style={styles.menuSub}>{isPro ? 'MyApp Pro' : t('profile.free')}</Text>
              </View>
            </View>
            {!isPro && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/(app)/paywall', params: { source: 'profile' } });
                }}
                style={{ backgroundColor: AppColors.accent, borderRadius: 14, paddingVertical: 9, paddingHorizontal: 16 }}
              >
                <Text style={{ fontFamily: Typography.fonts.heading, fontSize: 12.5, color: '#FFFFFF', letterSpacing: 0.3 }}>
                  {t('profile.upgrade')}
                </Text>
              </Pressable>
            )}
          </View>

          {isPro && (
            <>
              <View style={styles.divider} />
              {/* Manage Subscription — opens RevenueCat Customer Center */}
              <Pressable
                style={styles.menuRow}
                onPress={() => presentCustomerCenter()}
              >
                <View style={styles.menuRowLeft}>
                  <View style={styles.menuIcon}>
                    <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.menuLabel}>{t('profile.manageSubscription')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={AppColors.textSecondary} />
              </Pressable>
            </>
          )}
        </Animated.View>

        {/* Delete / Reset account — Apple 5.1.1(v) compliance */}
        <Animated.View entering={FadeInDown.duration(300).delay(400).springify()} style={styles.card}>
          <Pressable
            style={styles.menuRow}
            onPress={confirmDelete}
            disabled={deletingAccount}
            accessibilityRole="button"
            accessibilityLabel={isAnonymous ? t('profile.resetAndStartOver') : t('profile.deleteAccount')}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFE5EA' }]}>
                <Feather name="trash-2" size={18} color="#E11D48" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuLabel, { color: '#E11D48' }]}>
                  {isAnonymous ? t('profile.resetAndStartOver') : t('profile.deleteAccount')}
                </Text>
                <Text style={styles.menuSub}>
                  {isAnonymous ? t('profile.resetSubtitle') : t('profile.deleteAccountSubtitle')}
                </Text>
              </View>
            </View>
            {deletingAccount ? <ActivityIndicator size="small" color="#E11D48" /> : null}
          </Pressable>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: AppColors.background,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: Typography.fonts.heading, fontSize: 18, color: AppColors.text },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: AppColors.text,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  avatarInitials: { fontFamily: Typography.fonts.heading, fontSize: 30, color: '#fff', letterSpacing: 1 },
  avatarSubtext: { fontFamily: Typography.fonts.body, fontSize: 12, color: AppColors.textSecondary, marginTop: 8 },

  card: {
    borderRadius: 20, padding: 0,
    overflow: 'hidden',
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
  },
  fieldLeft: { flex: 1, marginRight: 12 },
  fieldLabel: {
    fontFamily: Typography.fonts.body, fontSize: 11, color: AppColors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4,
  },
  fieldValue: { fontFamily: Typography.fonts.body, fontSize: 16, color: AppColors.text },
  fieldInputWrap: {
    borderBottomWidth: 1, borderBottomColor: AppColors.text,
  },
  fieldInput: {
    fontFamily: Typography.fonts.body, fontSize: 16, color: AppColors.text,
    paddingVertical: 2,
  },
  editBtn: { padding: 6 },
  editActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelBtn: { paddingVertical: 7, paddingHorizontal: 12 },
  cancelBtnText: { fontFamily: Typography.fonts.body, fontSize: 14, color: AppColors.textSecondary },
  saveBtn: {
    backgroundColor: AppColors.text, borderRadius: 10,
    paddingVertical: 7, paddingHorizontal: 16, minWidth: 60, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: Typography.fonts.heading, fontSize: 14, color: '#fff' },
  readOnlyBadge: {
    backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  readOnlyText: { fontFamily: Typography.fonts.body, fontSize: 11, color: '#2e7d32' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginHorizontal: 18 },
  errorBox: {
    backgroundColor: 'rgba(232,93,86,0.08)', paddingHorizontal: 18,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(232,93,86,0.15)',
  },
  errorText: { fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.accent },

  sectionHeader: { marginBottom: 12, marginTop: 10 },
  sectionTitle: {
    fontFamily: Typography.fonts.heading,
    fontSize: 13,
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.14)',
    shadowColor: '#1A0F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
  },
  menuRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: AppColors.accent,
    shadowColor: AppColors.accentDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 2,
  },
  menuLabel: {
    fontFamily: Typography.fonts.heading,
    fontSize: 15,
    color: AppColors.text,
    letterSpacing: -0.1,
  },
  menuSub: {
    fontFamily: Typography.fonts.body,
    fontSize: 12.5,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  upgradeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.accent,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: AppColors.accentDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  upgradeChipText: {
    fontFamily: Typography.fonts.heading,
    fontSize: 12.5,
    color: '#1A0F00',
    letterSpacing: 0.2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.accentLight,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.28)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: AppColors.accent,
  },
  activeBadgeText: {
    fontFamily: Typography.fonts.heading,
    fontSize: 11,
    color: AppColors.accentDeep,
    letterSpacing: 0.4,
  },

  // Enhance row — RadiantButton with polished-gold theme, cream shimmer
  enhanceWrap: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  enhanceInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  enhanceIconChip: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.accent,
    shadowColor: AppColors.accentDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  enhanceLabel: {
    fontFamily: Typography.fonts.heading,
    fontSize: 15,
    lineHeight: 19,
    color: '#1A0F00',
    letterSpacing: -0.1,
  },
  enhanceSub: {
    fontFamily: Typography.fonts.body,
    fontSize: 12.5,
    color: 'rgba(26,15,0,0.68)',
    marginTop: 2,
  },
  enhanceStartChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A0F00',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  enhanceStartChipText: {
    fontFamily: Typography.fonts.heading,
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  enhanceActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  enhanceActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: AppColors.accentDeep,
  },
  enhanceActiveText: {
    fontFamily: Typography.fonts.heading,
    fontSize: 11,
    color: AppColors.accentDeep,
    letterSpacing: 0.4,
  },

  // Local-only (pre-signup) state — avatar mirrors the home-tab sign-in button
  localAvatarCircle: {
    backgroundColor: AppColors.accentLight,
    borderWidth: 1.5,
    borderColor: AppColors.accentMuted,
    shadowColor: AppColors.accentDeep,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: AppColors.accent,
  },
  proBadgeText: {
    fontFamily: Typography.fonts.heading,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  guestHero: {
    backgroundColor: AppColors.accentLight,
    borderWidth: 1,
    borderColor: AppColors.accentMuted,
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
  },
  guestHeroIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: AppColors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  guestHeroHeadline: {
    fontFamily: Typography.fonts.heading,
    fontSize: 20,
    color: AppColors.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  guestHeroBody: {
    fontFamily: Typography.fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: AppColors.textSecondary,
    marginBottom: 16,
  },
  guestHeroCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.accent,
    paddingVertical: 13,
    borderRadius: 14,
  },
  guestHeroCTAText: {
    fontFamily: Typography.fonts.heading,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
});
