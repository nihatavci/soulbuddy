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
  Keyboard, useWindowDimensions, type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, cancelAnimation, runOnJS, Easing,
} from 'react-native-reanimated';
import { AppColors, Typography } from '@/constants/theme';
import { PaperBackground } from '@/components/ui/PaperBackground';
import { InkBloom } from '@/components/ui/InkBloom';
import { SealMark } from '@/components/ui/SealMark';
import { SIGNAL_FORMATS, SIGNAL_MAX_CHARS, DAILY_SIGNAL_CAP } from '@/constants/mockSignals';
import { SIGNAL_PROMPTS } from '@/constants/prompts';

const GUTTER = 46;           // left margin where the pencil rule + ink-drop live
const HOLD_MS = 1100;        // how long to press-and-hold the seal to commit
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A quiet poetic line that fades in while you hold the seal.
const HOLD_LINES = [
  'Hold it. Let the ink find the paper.',
  'No rush — the true things soak in slowly.',
  'Stay a breath longer.',
  'Press, and let it become real.',
  'Some things are truer when you don’t hurry them.',
];

export default function CreateScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const remaining = DAILY_SIGNAL_CAP - 1; // mock: one dropped today

  // Back to the Board. Dismiss the keyboard first so the tab bar is reachable too.
  const goBack = () => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    router.navigate('/(app)/(tabs)' as any);
  };

  const [formatIdx, setFormatIdx] = useState(0);
  const [text, setText] = useState('');
  const [zoneH, setZoneH] = useState(0);
  const [wordW, setWordW] = useState(0);
  const [promptIdx, setPromptIdx] = useState(0); // rotating ghost placeholder
  const [holdLine, setHoldLine] = useState(HOLD_LINES[0]); // poetry shown while holding
  const sealRef = useRef<View>(null);
  const holdingRef = useRef(false);
  const lineIdxRef = useRef(0);
  const [sealPos, setSealPos] = useState({ x: width / 2, y: height * 0.6 });

  const format = SIGNAL_FORMATS[formatIdx];
  const canLeave = text.trim().length >= 3;

  // Ink level: 0 (empty) → 1 (full). Drives the ink-drop's travel down the margin.
  const fill = useSharedValue(0);
  const hold = useSharedValue(0);       // press-and-hold progress 0→1 (grows the ink)
  const spin = useSharedValue(0);       // seal dots orbit while holding (atom-like)
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

  // Settle the orbiting dots back to a calm vertical colon (shortest way).
  const settleSpin = () => {
    const cur = spin.value % (2 * Math.PI);
    cancelAnimation(spin);
    spin.value = cur;
    spin.value = withTiming(cur > Math.PI ? 2 * Math.PI : 0, { duration: 340 });
  };

  // Held the seal long enough → the page drifts off toward the board, then resets.
  const commit = () => {
    holdingRef.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    settleSpin();
    pageFade.value = withTiming(0, { duration: 480, easing: Easing.in(Easing.cubic) });
    pageLift.value = withTiming(-46, { duration: 560, easing: Easing.out(Easing.cubic) });
    setTimeout(() => {
      setText('');
      fill.value = withTiming(0, { duration: 1 });
      hold.value = withTiming(0, { duration: 380 });
      pageLift.value = 0;
      pageFade.value = withTiming(1, { duration: 420 });
    }, 560);
  };

  const beginHold = () => {
    if (!canLeave) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    holdingRef.current = true;
    lineIdxRef.current = (lineIdxRef.current + 1) % HOLD_LINES.length;
    setHoldLine(HOLD_LINES[lineIdxRef.current]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // hold grows the ink; the seal dots orbit (atom) and spiral in as it fills.
    hold.value = withTiming(1, { duration: HOLD_MS, easing: Easing.inOut(Easing.quad) }, (finished) => {
      'worklet';
      if (finished) runOnJS(commit)();
    });
    spin.value = 0;
    spin.value = withRepeat(withTiming(2 * Math.PI, { duration: 850, easing: Easing.linear }), -1, false);
  };

  const endHold = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    // released early → the ink recedes (no signal left)
    hold.value = withTiming(0, { duration: 320 });
    settleSpin();
  };

  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: fill.value * Math.max(0, zoneH - 16) }],
    opacity: 0.35 + fill.value * 0.65,
  }));
  const sealStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - hold.value * 0.12 }] }));
  const holdLineStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, hold.value * 1.8) }));
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
        {/* back to the board + faint dateline — like the corner of a page */}
        <View style={styles.head}>
          <Pressable onPress={goBack} hitSlop={14} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back to the board">
            <Feather name="chevron-left" size={22} color={AppColors.text} />
          </Pressable>
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

        {/* Leave it — press & hold the wax/ink seal (the re: colon) */}
        <View
          ref={sealRef}
          style={styles.sealArea}
          onLayout={() =>
            sealRef.current?.measureInWindow((mx, my, mw) =>
              setSealPos({ x: mx + mw / 2, y: my + 46 }),
            )
          }
        >
          <Animated.Text style={[styles.holdLine, holdLineStyle]} pointerEvents="none">
            {holdLine}
          </Animated.Text>
          <AnimatedPressable
            onPressIn={beginHold}
            onPressOut={endHold}
            delayLongPress={100000}
            style={[styles.seal, sealStyle]}
            accessibilityRole="button"
            accessibilityLabel="Press and hold to leave this signal on the board"
          >
            <SealMark hold={hold} spin={spin} enabled={canLeave} size={56} />
          </AnimatedPressable>
          <Text style={[styles.sealCaption, { opacity: canLeave ? 1 : 0.5 }]}>
            {canLeave ? 'press & hold the seal' : 'write a few words first'}
          </Text>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Ink that grows while you hold the seal */}
      <InkBloom progress={hold} x={sealPos.x} y={sealPos.y} />
    </PaperBackground>
  );
}

const styles = StyleSheet.create({
  // Paper grain comes from PaperBackground; this screen deliberately keeps ZERO borders.
  root: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1, paddingHorizontal: 30 },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 6, paddingBottom: 4,
  },
  backBtn: { padding: 4, marginLeft: -6 },
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

  sealArea: { alignItems: 'center', paddingBottom: 14, paddingTop: 2 },
  holdLine: {
    fontFamily: 'SpecialElite', fontSize: 15, lineHeight: 21, color: AppColors.text,
    textAlign: 'center', height: 44, marginBottom: 4, paddingHorizontal: 24,
  },
  seal: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  sealCaption: {
    fontFamily: Typography.fonts.body, fontSize: 12, letterSpacing: 0.3,
    color: AppColors.textSecondary, marginTop: 8,
  },
});
