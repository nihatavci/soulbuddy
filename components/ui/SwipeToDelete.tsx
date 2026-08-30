/**
 * components/ui/SwipeToDelete.tsx
 *
 * Apple-style swipe-left-to-reveal-actions wrapper (Mail/Messages/Photos
 * pattern): dragging the row left reveals one or more action buttons behind
 * it, most-destructive last (so the final, easiest-to-tap position is the
 * one actually intended for the common case). Presentational only — the
 * caller decides what each action does and whether to confirm first.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Icon } from '@/components/icons/Icon';
import { AppColors, Typography } from '@/constants/theme';

export interface SwipeAction {
  key: string;
  label: string;
  icon?: string;
  /** 'danger' renders a red background; 'neutral' a muted one. */
  tone?: 'danger' | 'neutral';
  onPress: () => void;
}

interface SwipeToDeleteProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  /** When true, renders children with no swipe affordance at all. */
  disabled?: boolean;
}

const ACTION_WIDTH = 92;

export function SwipeToDelete({ children, actions, disabled }: SwipeToDeleteProps) {
  if (disabled || actions.length === 0) return <>{children}</>;

  return (
    <Swipeable
      renderRightActions={() => (
        <View style={styles.actionsRow}>
          {actions.map((a) => (
            <Pressable
              key={a.key}
              onPress={a.onPress}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={[
                styles.action,
                { backgroundColor: a.tone === 'neutral' ? AppColors.textSecondary : AppColors.error },
              ]}
            >
              {a.icon && <Icon name={a.icon} size={18} color="#FFFFFF" />}
              <Text style={styles.actionLabel} numberOfLines={2}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      overshootRight={false}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row' },
  action: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  actionLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
