/**
 * components/ui/SwipeToDelete.tsx
 *
 * Apple-style swipe-left-to-reveal-delete (Mail/Reminders pattern): one red
 * "Delete" affordance the full height of the row, revealed by dragging left.
 * Deliberately ONE action, not a row of stacked buttons — when a row needs
 * more than one kind of delete (e.g. "for me" vs "for everyone"), the
 * caller's `onPress` should open its own confirm/choice UI (Alert.alert),
 * the same way iMessage's own swipe-to-delete works. Presentational only.
 */
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Icon } from '@/components/icons/Icon';
import { AppColors, Typography } from '@/constants/theme';

interface SwipeToDeleteProps {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
  /** When true, renders children with no swipe affordance at all. */
  disabled?: boolean;
  /** The wrapped content's own trailing corner radii — the revealed panel
   * matches them exactly, so it reads as behind the same shape rather than
   * a bare rectangle peeking out. */
  topRightRadius?: number;
  bottomRightRadius?: number;
  /** Alignment/sizing for the swipeable wrapper itself — pass alignSelf and
   * maxWidth here so the wrapper doesn't stretch wider than its content
   * (important when the child is a variable-width chat bubble). */
  style?: StyleProp<ViewStyle>;
}

export function SwipeToDelete({
  children, label, onPress, disabled, topRightRadius = 0, bottomRightRadius = 0, style,
}: SwipeToDeleteProps) {
  if (disabled) return <>{children}</>;

  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={[
            styles.action,
            { borderTopRightRadius: topRightRadius, borderBottomRightRadius: bottomRightRadius },
          ]}
        >
          <Icon name="trash" size={18} color="#FFFFFF" />
          <Text style={styles.actionLabel} numberOfLines={1}>{label}</Text>
        </Pressable>
      )}
      overshootRight={false}
      rightThreshold={40}
      containerStyle={[styles.container, style]}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  // Swipeable measures its child's own box — any vertical spacing between
  // rows belongs OUTSIDE this component (on a wrapping View), never on the
  // swiped child itself, or the revealed panel ends up a different height
  // than the visible content.
  container: { justifyContent: 'center' },
  action: {
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 14,
    backgroundColor: AppColors.error,
  },
  actionLabel: {
    fontFamily: Typography.fonts.body,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
