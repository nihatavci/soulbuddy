/**
 * components/ui/ReplyStatusNote.tsx
 *
 * Honest, calm confirmation shown after a reply is sent without triggering
 * mutual resonance. States the real, current facts only — no fake
 * "processing" delay, no read-receipt claim about the other person, no
 * urgency framing. Presentational only; the caller decides when to render it
 * and what happens on continue.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '@/components/icons/Icon';
import { AppColors, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

interface ReplyStatusNoteProps {
  title: string;
  body: string;
  ctaLabel: string;
  onContinue: () => void;
}

export function ReplyStatusNote({ title, body, ctaLabel, onContinue }: ReplyStatusNoteProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Icon name="check" size={26} color={AppColors.accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Button label={ctaLabel} variant="primary" size="lg" onPress={onContinue} style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 8 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    backgroundColor: AppColors.elevated, borderWidth: 1, borderColor: AppColors.border, marginBottom: 20,
  },
  title: {
    fontFamily: 'PlayfairDisplay', fontSize: 24, letterSpacing: -0.3, color: AppColors.text,
    marginBottom: 10, textAlign: 'center',
  },
  body: {
    fontFamily: Typography.fonts.body, fontSize: 14, lineHeight: 21, color: AppColors.textSecondary,
    textAlign: 'center', marginBottom: 32, maxWidth: 320,
  },
  cta: { borderRadius: 999, alignSelf: 'stretch' },
});
