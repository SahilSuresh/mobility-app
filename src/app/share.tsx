import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Appear, STAGGER, usePopSounds } from '@/components/Appear';
import { BodyFigure } from '@/components/BodyFigure';
import { CountUp } from '@/components/CountUp';
import { Icon } from '@/components/Icon';
import { T } from '@/components/T';
import { IconButton, PrimaryButton, Screen, SecondaryButton } from '@/components/ui';
import { config } from '@/constants/config';
import { colors, fonts, NATIVE_DRIVER } from '@/constants/theme';
import type { AreaId } from '@/data/types';
import { goBack } from '@/lib/flow';
import { success, tap } from '@/lib/haptics';
import { minutesOf, plannedDone, streak, thisWeek, weekDays, weeklyTarget, weekNumber } from '@/lib/progress';
import { canShareImages, captureCard, saveImage, shareImage } from '@/lib/share';
import { playSound } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

/** The card's three colourways. Each one sets every colour on the card, so the saved image looks the same anywhere. */
const LOOKS = {
  forest: {
    label: 'Forest',
    gradient: ['#2F7A56', '#1F4A37', '#142A20'],
    ink: colors.cream,
    soft: '#CFE8DA',
    accent: colors.mint,
    onAccent: '#143524',
    rule: 'rgba(207,232,218,0.2)',
    faint: 'rgba(207,232,218,0.16)',
    figure: '#3B6351',
    glow: colors.mint,
  },
  sage: {
    label: 'Sage',
    gradient: ['#F1F5EF', '#DFEADF', '#C9DCCB'],
    ink: '#16301F',
    soft: '#45614F',
    accent: '#1F5A3E',
    onAccent: colors.cream,
    rule: 'rgba(31,90,62,0.16)',
    faint: 'rgba(31,90,62,0.12)',
    figure: '#C2D6C4',
    glow: '#2F7A56',
  },
  sand: {
    label: 'Sand',
    gradient: ['#FAF1E4', '#F0DCC2', '#E4C39C'],
    ink: '#1F3A2B',
    soft: '#6B5843',
    accent: '#1F5A3E',
    onAccent: colors.cream,
    rule: 'rgba(80,55,30,0.16)',
    faint: 'rgba(80,55,30,0.12)',
    figure: '#E3D6C0',
    glow: '#2F7A56',
  },
} as const;
type LookId = keyof typeof LOOKS;
type CardLook = (typeof LOOKS)[LookId];

/** When each part of the card comes in, in ms after the screen opens. */
const AT = { card: 0, text: 220, number: 380, days: 560, stats: 560 + 7 * STAGGER + 80, buttons: 900 };
/** By now every number has finished counting, so a saved card never catches one mid-count. */
const SETTLED = AT.stats + 800;

/** Said in the first person, since it's your card: the plan done, some sessions in, or none yet. */
function headline(sessions: number, done: number, target: number): string {
  if (target > 0 && done >= target) return 'Week complete.';
  if (sessions === 0) return 'A fresh week ahead.';
  return target > done ? 'On my way.' : 'Keeping it moving.';
}

/** "5–11 Oct", or "29 Sept – 5 Oct" across two months. */
function weekRange(start: Date, end: Date): string {
  const day = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric' });
  const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'short' });
  return month(start) === month(end) ? `${day(start)}–${day(end)} ${month(end)}` : `${day(start)} ${month(start)} – ${day(end)} ${month(end)}`;
}

export default function Share() {
  const plan = useAppStore((s) => s.plan);
  const history = useAppStore((s) => s.history);
  const card = useRef<View>(null);
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [lookId, setLookId] = useState<LookId>('forest');
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState('');
  // When the screen opened, to know when the card has finished building in.
  const [opened] = useState(() => Date.now());
  // The card rises in as the screen opens, and gives a small squeeze when its colour changes.
  const [enter] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [squeeze] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (reduceMotion) return;
    const anim = Animated.spring(enter, { toValue: 1, friction: 7, tension: 60, useNativeDriver: NATIVE_DRIVER });
    anim.start();
    return () => anim.stop();
  }, [enter, reduceMotion]);
  usePopSounds(plan ? AT.days : undefined, 7);

  // "Saved" shows on the button for a moment, then it goes back to "Save image".
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2200);
    return () => clearTimeout(timer);
  }, [saved]);

  if (!plan) return null;

  const now = new Date();
  const week = thisWeek(history, now);
  const days = weekDays(plan, history, now);
  const done = plannedDone(plan, history, now);
  const target = weeklyTarget(plan, now);
  const moves = week.reduce((n, h) => n + h.moves, 0);
  // Areas you trained this week glow brightly; the rest of your plan's areas faintly.
  const trained = new Set(week.flatMap((h) => h.areas));
  const glows = Object.fromEntries(plan.areas.map((a) => [a, trained.has(a) ? 1 : 0.35])) as Partial<Record<AreaId, number>>;
  const look = LOOKS[lookId];
  const cardWidth = Math.min(316, width - 48);

  const pick = (id: LookId) => {
    if (id === lookId) return;
    tap();
    playSound('select');
    setLookId(id);
    if (reduceMotion) return;
    squeeze.setValue(0.96);
    Animated.spring(squeeze, { toValue: 1, friction: 5, tension: 160, useNativeDriver: NATIVE_DRIVER }).start();
  };

  const run = async (action: 'save' | 'share') => {
    if (busy) return;
    setNote('');
    if (!canShareImages) {
      setNote('Sharing isn’t available here.');
      return;
    }
    setBusy(action);
    try {
      // Let the numbers finish counting first, so the image shows the real totals.
      const wait = opened + SETTLED - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      const uri = await captureCard(card);
      if (action === 'share') {
        const result = await shareImage(uri);
        if (result === 'downloaded') setNote('This browser can’t share images, so the card was downloaded instead.');
        if (result === 'unavailable') setNote('Sharing isn’t available on this device. Try Save image.');
        return;
      }
      let ok: boolean;
      try {
        ok = await saveImage(uri);
      } catch {
        // Saving isn't available here: the share sheet has "Save Image" too.
        await shareImage(uri);
        return;
      }
      if (ok) {
        success();
        playSound('done');
        setSaved(true);
        setNote(canSaveToPhotos ? 'Saved to Photos.' : 'Saved. You’ll find it in your downloads.');
      } else {
        setNote('Allow Unknot to add photos in Settings to save the card.');
      }
    } catch {
      setNote('That didn’t work. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const enterStyle = {
    opacity: enter.interpolate({ inputRange: [0, 0.5], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }, { scale: Animated.multiply(enter.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }), squeeze) }],
  };

  return (
    <Screen modal>
      <View style={styles.header}>
        <IconButton icon="close" label="Close" onPress={() => goBack()} />
        <T variant="bodyStrong" center style={styles.flex}>
          Share your week
        </T>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.stage}>
        {/* The shadow sits outside the captured view, so the saved image is just the card. */}
        <Animated.View style={[styles.cardShadow, enterStyle]}>
          <View ref={card} collapsable={false} style={[styles.card, { width: cardWidth }]}>
            <LinearGradient colors={look.gradient} locations={[0, 0.55, 1]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFill} />
            <WeekCard look={look} plan={{ week: weekNumber(plan, now), range: weekRange(days[0].date, days[6].date) }} sessions={week.length} done={done} target={target} days={days} minutes={minutesOf(week)} moves={moves} streakDays={streak(plan, history, now)} glows={glows} />
          </View>
        </Animated.View>

        <Appear delay={AT.buttons} style={styles.looks}>
          <View style={styles.lookRow} accessibilityRole="radiogroup" accessibilityLabel="Card colour">
            {(Object.keys(LOOKS) as LookId[]).map((id) => {
              const on = id === lookId;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={LOOKS[id].label}
                  hitSlop={6}
                  onPress={() => pick(id)}
                  style={[styles.swatchRing, on && { borderColor: colors.green }]}
                >
                  <LinearGradient colors={LOOKS[id].gradient} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={styles.swatch} />
                </Pressable>
              );
            })}
          </View>
          <T variant="caption" center>
            {look.label}
          </T>
        </Appear>
      </View>

      {note ? (
        <Appear key={note} kind="rise">
          <T variant="caption" center style={styles.note} accessibilityLiveRegion="polite">
            {note}
          </T>
        </Appear>
      ) : null}
      <Appear delay={AT.buttons + 80} style={styles.buttons}>
        <SecondaryButton
          label={busy === 'save' ? 'Saving…' : saved ? 'Saved' : 'Save image'}
          icon={saved ? 'check' : 'download'}
          style={styles.flex}
          onPress={() => run('save')}
        />
        <PrimaryButton label={busy === 'share' ? 'Opening…' : 'Share'} icon="share" style={styles.flex} disabled={busy !== null} onPress={() => run('share')} />
      </Appear>
    </Screen>
  );
}

/** On a phone the card goes to Photos; in the browser it downloads. */
const canSaveToPhotos = Platform.OS !== 'web';

type CardProps = {
  look: CardLook;
  plan: { week: number; range: string };
  /** Every session this week, plan or not: the big number, and the ticks on the days. */
  sessions: number;
  /** The plan's sessions done, out of `target`. */
  done: number;
  target: number;
  days: ReturnType<typeof weekDays>;
  minutes: number;
  moves: number;
  streakDays: number;
  glows: Partial<Record<AreaId, number>>;
};

/** The card itself: the week, how it went, each day, and the totals. Everything in it is captured into the image. */
function WeekCard({ look, plan, sessions, done, target, days, minutes, moves, streakDays, glows }: CardProps) {
  return (
    <View style={styles.cardInner}>
      <Appear delay={AT.text + 200} style={styles.figure}>
        <View pointerEvents="none">
          <BodyFigure height={170} glows={glows} fill={look.figure} glowColor={look.glow} />
        </View>
      </Appear>

      <Appear delay={AT.text}>
        <T style={[styles.kicker, { color: look.accent }]}>{`WEEK ${plan.week} · ${plan.range.toUpperCase()}`}</T>
        <T style={[styles.headline, { color: look.ink }]}>{headline(sessions, done, target)}</T>
      </Appear>

      <Appear delay={AT.number} style={styles.numberRow}>
        <CountUp value={sessions} delay={AT.number} style={[styles.big, { color: look.ink }]} />
      </Appear>
      <Appear delay={AT.number + 60}>
        <T style={[styles.caption, { color: look.soft }]}>{sessions === 1 ? 'session this week' : 'sessions this week'}</T>
        <T style={[styles.planLine, { color: look.accent }]}>{`${done} of ${target} planned`}</T>
      </Appear>

      <View style={styles.days}>
        {days.map((d, i) => (
          <Appear key={d.weekday} delay={AT.days + i * STAGGER} kind="pop" style={styles.day}>
            <T style={[styles.letter, { color: d.isToday ? look.accent : look.soft }, d.isToday && styles.letterToday]}>{d.letter}</T>
            <DayMark status={d.status} look={look} />
          </Appear>
        ))}
      </View>

      <Appear delay={AT.stats} style={[styles.stats, { borderTopColor: look.rule }]}>
        <Stat value={minutes} label="minutes" look={look} delay={AT.stats} />
        <View style={[styles.statRule, { backgroundColor: look.rule }]} />
        <Stat value={moves} label="moves" look={look} delay={AT.stats + 80} />
        <View style={[styles.statRule, { backgroundColor: look.rule }]} />
        <Stat value={streakDays} label="day streak" look={look} delay={AT.stats + 160} />
      </Appear>

      <View style={[styles.footer, { borderTopColor: look.rule }]}>
        <T style={[styles.brand, { color: look.ink }]}>{config.appName}</T>
        <T style={[styles.site, { color: look.soft }]}>unknot.page</T>
      </View>
    </View>
  );
}

/** One day of the week: a tick when trained, a ring when a session is planned (bolder today), a faint dot to rest. */
function DayMark({ status, look }: { status: ReturnType<typeof weekDays>[number]['status']; look: CardLook }) {
  if (status === 'done') {
    return (
      <View style={[styles.mark, { backgroundColor: look.accent }]}>
        <Icon name="check" size={13} color={look.onAccent} strokeWidth={3} />
      </View>
    );
  }
  if (status === 'today') {
    return (
      <View style={[styles.mark, { borderWidth: 2, borderColor: look.accent }]}>
        <View style={[styles.todayDot, { backgroundColor: look.accent }]} />
      </View>
    );
  }
  if (status === 'planned' || status === 'missed') return <View style={[styles.mark, { borderWidth: 1.5, borderColor: status === 'planned' ? look.soft : look.faint }]} />;
  return (
    <View style={styles.mark}>
      <View style={[styles.restDot, { backgroundColor: look.faint }]} />
    </View>
  );
}

function Stat({ value, label, look, delay }: { value: number; label: string; look: CardLook; delay: number }) {
  return (
    <View style={styles.stat}>
      <CountUp value={value} delay={delay} style={[styles.statValue, { color: look.ink }]} />
      <T style={[styles.statLabel, { color: look.soft }]}>{label}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardShadow: { borderRadius: 32, boxShadow: '0px 30px 50px -24px rgba(20,42,32,0.55)' },
  card: { borderRadius: 32, overflow: 'hidden' },
  cardInner: { padding: 24 },
  figure: { position: 'absolute', right: 16, top: 62 },
  kicker: { fontFamily: fonts.bold, fontSize: 11.5, letterSpacing: 1.3 },
  headline: { marginTop: 8, maxWidth: 170, fontFamily: fonts.display, fontSize: 24, lineHeight: 29 },
  numberRow: { marginTop: 14, flexDirection: 'row', alignItems: 'baseline' },
  big: { fontFamily: fonts.display, fontSize: 68, lineHeight: 72, letterSpacing: -2 },
  caption: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 19 },
  planLine: { marginTop: 2, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  days: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 6 },
  letter: { fontFamily: fonts.semibold, fontSize: 11.5 },
  letterToday: { fontFamily: fonts.bold },
  mark: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  todayDot: { width: 8, height: 8, borderRadius: 4 },
  restDot: { width: 6, height: 6, borderRadius: 3 },
  stats: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statRule: { width: 1, height: 30 },
  statValue: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  statLabel: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12 },
  footer: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontFamily: fonts.display, fontSize: 16 },
  site: { fontFamily: fonts.semibold, fontSize: 12 },
  looks: { marginTop: 22, alignItems: 'center', gap: 6 },
  lookRow: { flexDirection: 'row', gap: 14 },
  swatchRing: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.12)' },
  note: { marginBottom: 12 },
  buttons: { flexDirection: 'row', gap: 10 },
});
