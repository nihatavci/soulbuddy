import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppColors, Typography, Space, BorderRadius } from '@/constants/theme';
import {
  getConsentPreferences,
  saveConsentPreferences,
} from '@/lib/consent';
import { optInMixpanel } from '@/lib/mixpanel';
import { useT } from '@/context/LanguageContext';

interface Props {
  visible: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}

export function AiConsentGate({ visible, onEnable, onDismiss }: Props) {
  const t = useT();
  const handleEnable = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = getConsentPreferences();
    saveConsentPreferences({ ...current, aiProcessing: true });
    optInMixpanel();
    onEnable();
  };

  const handleDismiss = () => {
    Haptics.selectionAsync();
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.iconWrap}>
            <Feather name="cpu" size={24} color={AppColors.accent} />
          </View>
          <Text style={styles.title}>{t('aiConsent.title')}</Text>
          <Text style={styles.body}>
            {t('aiConsent.bodyPrefix')}{' '}
            <Text style={styles.bold}>{t('aiConsent.secureService')}</Text>{t('aiConsent.bodySuffix')}
          </Text>
          <Pressable style={styles.primary} onPress={handleEnable}>
            <Feather name="zap" size={16} color={AppColors.background} style={{ marginRight: 8 }} />
            <Text style={styles.primaryText}>{t('aiConsent.enableContinue')}</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={handleDismiss}>
            <Text style={styles.secondaryText}>{t('aiConsent.keepOff')}</Text>
          </Pressable>
          <View style={styles.links}>
            <Pressable onPress={() => Linking.openURL('https://example.com/privacy')}>
              <Text style={styles.link}>{t('common.privacyPolicy')}</Text>
            </Pressable>
            <Text style={styles.linkSep}>·</Text>
            <Pressable onPress={() => Linking.openURL('https://example.com/terms')}>
              <Text style={styles.link}>{t('common.termsOfUse')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: AppColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Space.lg,
    paddingTop: Space.lg,
    paddingBottom: Space.xl,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: AppColors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Space.md,
  },
  title: {
    fontFamily: Typography.fonts.heading,
    fontSize: 20,
    color: AppColors.text,
    lineHeight: 26,
    marginBottom: Space.sm,
  },
  body: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    color: AppColors.textSecondary,
    lineHeight: 22,
    marginBottom: Space.lg,
  },
  bold: {
    fontFamily: Typography.fonts.heading,
    color: AppColors.text,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Space.sm,
    marginTop: Space.sm,
  },
  link: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: AppColors.textSecondary,
    textDecorationLine: 'underline',
  },
  linkSep: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.accent,
    borderRadius: BorderRadius.full,
    paddingVertical: Space.md,
    marginBottom: Space.sm,
  },
  primaryText: {
    fontFamily: Typography.fonts.heading,
    fontSize: 15,
    color: AppColors.background,
    letterSpacing: 0.1,
  },
  secondary: {
    alignItems: 'center',
    paddingVertical: Space.md,
  },
  secondaryText: {
    fontFamily: Typography.fonts.body,
    fontSize: 15,
    color: AppColors.textSecondary,
  },
});
