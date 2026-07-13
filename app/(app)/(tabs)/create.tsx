/**
 * Create — "a letter you leave on a page".
 *
 * Not a form. The screen IS a sheet of paper: you write directly onto it in the
 * typewriter face, borderless. The ONLY line is a hand-drawn pencil margin rule.
 * A gold ink-drop travels DOWN that margin as you approach the 120-char limit —
 * ambient, organic, no counter. The signal's "opening" (a feeling / a place / a
 * memory / a thought) is a single tappable word with a hand-drawn underline, not
 * a row of chips. You don't press "Send" — you press a wax/ink SEAL: a deliberate
 * haptic thunk, the ink blooms, and the page resets (mock; future `signals` insert).
 *
 * Calm, unrushed, Kindle-minimal. Special Elite is the writing face (its correct
 * use); everything chrome-like is Satoshi. Signal-yellow stays scarce: the caret,
 * the ink-drop, the underline, the seal.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable,
  useWindowDimensions, type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, withSpring, runOnJS, Easing,
} from 'react-native-reanimated';
import { AppColors, Typography } from '@/constants/theme';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { InkBloom } from '@/components/ui/InkBloom';
import { SIGNAL_FORMATS, SIGNAL_MAX_CHARS, DAILY_SIGNAL_CAP } from '@/constants/mockSignals';
import { SIGNAL_PROMPTS } from '@/constants/prompts';

const GUTTER = 46;           // left margin where the pencil rule + ink-drop live
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CreateScreen() {
  const { width, height } = useWindowDimensions();
  const remaining = DAILY_SIGNAL_CAP - 1; // mock: one dropped today

  const [formatIdx, setFormatIdx] = useState(0);
  const [text, setText] = useState('');
  const [zoneH, setZoneH] = useState(0);
  const [wordW, setWordW] = useState(0);
  const [bloom, setBloom] = useState(0); // increment to fire the ink-bloom seal effect
  const [promptIdx, setPromptIdx] = useState(0); // rotating ghost placeholder
  const sealRef = useRef<View>(null);
  const [sealPos, setSealPos] = useState({ x: width / 2, y: height * 0.6 });

  const format = SIGNAL_FORMATS[formatIdx];
  const canLeave = text.trim().length >= 3;

  // Ink level: 0 (empty) → 1 (full). Drives the ink-drop's travel down the margin.
  const fill = useSharedValue(0);
  const sealScale = useSharedValue(1);
  const pageFade = useSharedValue(1);
  const pageLift = useSharedValue(0);
  const ghostOpacity = useSharedValue(1);

  // Rotate the unfinished-sentence prompts while the page is empty. Gentle
  // crossfade; pauses the moment you start writing.
  const advancePrompt = () => {
    setPromptIdx((i) => (i + 1) % SIGNAL_PROMPTS.length);
    ghostOpacity.value = withTiming(1, { duration: 600 });
  };
  const isEmpty = text.length === 0;
  useEffect(() => {
    if (!isEmpty) return;
    ghostOpacity.value = withTiming(1, { duration: 300 });
    const id = setInterval(() => {
      ghostOpacity.value = withTiming(0, { duration: 450 }, (finished) => {
        'worklet';
        if (finished) runOnJS(advancePrompt)();
      });
    }, 4800);
    return () => clearInterval(id);
  }, [isEmpty]);

  const onChange = (v: string) => {
    setText(v);
    fill.value = withTiming(Math.min(1, v.length / SIGNAL_MAX_CHARS), { duration: 220 });
  };

  const cycleFormat = () => {
    Haptics.selectionAsync();
    setFormatIdx((i) => (i + 1) % SIGNAL_FORMATS.length);
  };

  // Fires once the ink has set: clear the page for a fresh sheet.
  const onBloomDone = () => {
    setText('');
    fill.value = withTiming(0, { duration: 1 });
    pageLift.value = 0;
    pageFade.value = withTiming(1, { duration: 420 });
  };

  const leave = () => {
    if (!canLeave) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    // The seal presses — a deliberate thunk. The ink stamps at the seal and the
    // written words lift + drift off the page toward the board, then it resets.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    sealScale.value = withSequence(
      withTiming(0.84, { duration: 90 }),
      withSpring(1, { damping: 6, stiffness: 180 }),
    );
    pageFade.value = withTiming(0, { duration: 560, easing: Easing.in(Easing.cubic) });
    pageLift.value = withTiming(-46, { duration: 620, easing: Easing.out(Easing.cubic) });
    setBloom((b) => b + 1);
  };

  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fill.value * Math.max(0, zoneH - 16) }],
    opacity: 0.35 + fill.value * 0.65,
  }));
  const sealStyle = useAnimatedStyle(() => ({ transform: [{ scale: sealScale.value }] }));
  const pageStyle = useAnimatedStyle(() => ({
    opacity: pageFade.value,
    transform: [{ translateY: pageLift.value }],
  }));
  const ghostStyle = useAnimatedStyle(() => ({ opacity: ghostOpacity.value * 0.5 }));

  // Hand-drawn geometry (deterministic — no runtime randomness).
  const ruleH = zoneH || 320;
  const rulePath = `M8 2 Q4 ${ruleH * 0.28} 8 ${ruleH * 0.5} T8 ${ruleH - 2}`;
  const underlinePath = wordW > 4
    ? `M0 5 Q ${wordW * 0.28} 0 ${wordW * 0.52} 5 T ${wordW} 4`
    : '';

  return (
    <PaperBackground style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* faint dateline / cap — like the corner of a page, no chrome */}
        <View style={styles.head}>
          <Text style={styles.dateline}>today · {remaining} of {DAILY_SIGNAL_CAP} left</Text>
        </View>

        <Animated.View style={[styles.page, pageStyle]}>
          {/* The opening — a single tappable word with a hand-drawn underline */}
          <Pressable onPress={cycleFormat} style={styles.opening} hitSlop={10}>
            <View>
              <Text
                style={styles.openingWord}
                onLayout={(e: LayoutChangeEvent) => setWordW(e.nativeEvent.layout.width)}
              >
                {format.label.toLowerCase()} —
              </Text>
              {!!underlinePath && (
                <Svg width={wordW} height={8} style={styles.underline}>
                  <Path d={underlinePath} stroke={AppColors.accentDeep} strokeWidth={1.6} fill="none" strokeLinecap="round" />
                </Svg>
              )}
            </View>
            <Text style={styles.openingHint}>{format.hint}</Text>
          </Pressable>

          {/* The writing zone — paper only, one hand-drawn margin rule + travelling ink */}
          <View style={styles.zone} onLayout={(e) => setZoneH(e.nativeEvent.layout.height)}>
            <Svg width={16} height={ruleH} style={styles.rule} pointerEvents="none">
              <Path d={rulePath} stroke={AppColors.text} strokeWidth={1} strokeOpacity={0.18} fill="none" strokeLinecap="round" />
            </Svg>
            <Animated.View style={[styles.inkDrop, dropStyle]} pointerEvents="none" />

            {isEmpty && (
              <Animated.Text style={[styles.ghost, ghostStyle]} pointerEvents="none">
                {SIGNAL_PROMPTS[promptIdx]}
              </Animated.Text>
            )}
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={onChange}
              multiline
              maxLength={SIGNAL_MAX_CHARS}
              textAlignVertical="top"
              selectionColor={AppColors.accentDeep}
              autoFocus
              scrollEnabled={false}
            />
          </View>
        </Animated.View>

        {/* Leave it — a wax/ink seal (the re: colon), not a button */}
        <View
          ref={sealRef}
          style={styles.sealArea}
          onLayout={() =>
            sealRef.current?.measureInWindow((mx, my, mw) =>
              setSealPos({ x: mx + mw / 2, y: my + 30 }),
            )
          }
        >
          <AnimatedPressable onPress={leave} style={[styles.seal, sealStyle]} accessibilityRole="button" accessibilityLabel="Leave this signal on the board">
            <Svg width={56} height={56} viewBox="0 0 56 56">
              <Circle cx={28} cy={28} r={25} fill={AppColors.ink} opacity={canLeave ? 1 : 0.28} />
              <Circle cx={28} cy={21} r={3} fill={AppColors.accent} opacity={canLeave ? 1 : 0.35} />
              <Circle cx={28} cy={35} r={3} fill={AppColors.accent} opacity={canLeave ? 1 : 0.35} />
            </Svg>
          </AnimatedPressable>
          <Text style={[styles.sealCaption, { opacity: canLeave ? 1 : 0.5 }]}>
            {canLeave ? 'press the seal to leave it on the board' : 'write a few words first'}
          </Text>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Contained GPU ink-stamp bloom, originating at the seal */}
      <InkBloom trigger={bloom} x={sealPos.x} y={sealPos.y} onDone={onBloomDone} />
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  // Paper grain comes from PaperBackground; this screen deliberately keeps ZERO borders.
  root: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1, paddingHorizontal: 30 },
  head: { paddingTop: 6, paddingBottom: 4, alignItems: 'flex-end' },
  dateline: {
    fontFamily: Typography.fonts.body, fontSize: 11, letterSpacing: 0.5,
    textTransform: 'uppercase', color: AppColors.textSecondary,
  },

  page: { flex: 1, paddingTop: 18 },

  opening: { marginBottom: 22 },
  openingWord: {
    fontFamily: 'SpecialElite', fontSize: 22, color: AppColors.text, alignSelf: 'flex-start',
  },
  underline: { position: 'absolute', bottom: -6, left: 0 },
  openingHint: {
    fontFamily: Typography.fonts.body, fontSize: 13, color: AppColors.textSecondary, marginTop: 12,
  },

  zone: { flex: 1, position: 'relative', paddingLeft: GUTTER },
  rule: { position: 'absolute', left: 16, top: 0 },
  inkDrop: {
    position: 'absolute', left: 18, top: 2, width: 11, height: 11, borderRadius: 6,
    backgroundColor: AppColors.accent,
  },
  ghost: {
    position: 'absolute', left: GUTTER, top: 0, right: 0,
    fontFamily: 'SpecialElite', fontSize: 21, lineHeight: 32, color: AppColors.textSecondary,
  },
  input: {
    flex: 1, padding: 0, margin: 0,
    fontFamily: 'SpecialElite', fontSize: 21, lineHeight: 32, color: AppColors.text,
  },

  sealArea: { alignItems: 'center', paddingBottom: 14, paddingTop: 6 },
  seal: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  sealCaption: {
    fontFamily: Typography.fonts.body, fontSize: 12, letterSpacing: 0.3,
    color: AppColors.textSecondary, marginTop: 8,
  },
});
