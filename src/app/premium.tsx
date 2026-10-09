import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Animated, Easing, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Appear, STAGGER, usePopSounds } from '@/components/Appear';
import { BodyFigure } from '@/components/BodyFigure';
import { Icon, type IconName } from '@/components/Icon';
import { T } from '@/components/T';
import { IconButton, PrimaryButton, Screen } from '@/components/ui';
import { config } from '@/constants/config';
import { accent, colors, fonts, NATIVE_DRIVER, shadows, tint } from '@/constants/theme';
import { AREA_NAMES, AREA_ORDER, sortAreas } from '@/data/areas';
import type { AreaId } from '@/data/types';
import { continueFirstRun, goBack } from '@/lib/flow';
import { success, tap } from '@/lib/haptics';
import { yearlySaving } from '@/lib/paywall';
import { buy, loadOptions, purchasesTestMode, restore, type PaywallOption } from '@/lib/purchases';
import { playSound, playStartSound } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

const BENEFITS: { icon: IconName; label: string }[] = [
  { icon: 'calendar', label: 'Your full plan, every session' },
  { icon: 'sliders', label: 'Adjusts to how each session felt' },
  { icon: 'layers', label: 'Every area and programme' },
  { icon: 'arc', label: 'Your progress over time' },
];

const ALL_AREAS = Object.fromEntries(AREA_ORDER.map((a) => [a, 0.55])) as Partial<Record<AreaId, number>>;

/**
 * When each part builds in, in ms. Quick on purpose: the price, the trial terms and the button must be readable
 * almost at once, so everything is in place within about a second.
 */
const AT = { head: 0, card: 120, benefits: 240, timeline: 240 + BENEFITS.length * STAGGER + 40, plans: 620, cta: 300 };

/**
 * Premium. Every session needs it (or its free trial). Opened after the plan is ready and whenever someone
 * without it taps Start; with `then`, a successful purchase goes straight on to that session.
 */
export default function Premium() {
  const { flow, then } = useLocalSearchParams<{ flow?: string; then?: string }>();
  const inFlow = flow === '1';
  const plan = useAppStore((s) => s.plan);
  const isPremium = useAppStore((s) => s.isPremium);
  const setPremium = useAppStore((s) => s.setPremium);
  const setFlag = useAppStore((s) => s.setFlag);
  const noteNudgeShown = useAppStore((s) => s.noteNudgeShown);
  const [options, setOptions] = useState<PaywallOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PaywallOption['id']>('annual');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  // A soft pop as each benefit lands.
  usePopSounds(isPremium ? undefined : AT.benefits + 120, BENEFITS.length);

  const fetchOptions = useCallback(() => {
    loadOptions().then((list) => {
      setOptions(list);
      setLoading(false);
      if (!list.some((o) => o.id === 'annual') && list[0]) setSelected(list[0].id);
    });
  }, []);

  useEffect(() => {
    setFlag('seenPaywall');
    // Seeing the paywall restarts the Premium pop-up's wait, so the two never come one after the other.
    noteNudgeShown();
    fetchOptions();
  }, [setFlag, noteNudgeShown, fetchOptions]);

  const retry = () => {
    setLoading(true);
    setMessage('');
    fetchOptions();
  };

  const close = () => (inFlow ? continueFirstRun('premium') : goBack());
  // After buying: on to the session that was waiting, or wherever we came from.
  const unlocked = () => {
    if (then) router.replace({ pathname: '/preview', params: { id: then } });
    else close();
  };
  const option = options.find((o) => o.id === selected);
  const saving = yearlySaving(options);

  const purchase = async () => {
    if (!option) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await buy(option);
      if (result === 'premium') {
        // The trial or subscription has started: it sounds like every other start.
        playStartSound();
        setPremium(true);
        success();
        unlocked();
      } else if (result !== 'cancelled') {
        setMessage(BUY_MESSAGES[result]);
      }
    } catch {
      setMessage('The purchase did not go through. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const restorePurchases = async () => {
    setMessage('');
    try {
      const active = await restore();
      if (active) {
        setPremium(true);
        unlocked();
      } else {
        setMessage(active === null ? `Restore works once the ${storeName()} is connected.` : 'No purchases to restore.');
      }
    } catch {
      setMessage(`Couldn't reach the ${storeName()}. Check your connection and try again.`);
    }
  };

  if (isPremium && !busy) {
    return (
      <Screen modal>
        <IconButton icon="close" label="Close" onPress={close} />
        <View style={styles.activeStage}>
          <Appear kind="pop" style={styles.activeFigure}>
            <View style={styles.activeHalo} />
            <BodyFigure height={200} glows={ALL_AREAS} />
          </Appear>
          <Appear delay={180}>
            <T variant="title" center style={{ marginTop: 20 }}>
              Premium is on
            </T>
            <T variant="body" color={colors.muted} center style={{ marginTop: 8 }}>
              Every session, area and programme is open.
            </T>
          </Appear>
        </View>
        <Appear delay={320}>
          <PrimaryButton label="Done" onPress={close} />
        </Appear>
      </Screen>
    );
  }

  const areas = sortAreas(plan?.areas ?? []);
  const glows = Object.fromEntries(areas.map((a) => [a, 1])) as Partial<Record<AreaId, number>>;
  const trial = option?.trial;
  const cta = trial ? 'Start free trial' : 'Subscribe';
  // What Apple and Google ask a subscription screen to spell out: the price, how often, and how renewal and cancelling work.
  const terms = option
    ? `${trial ? `${trial} free, then ` : ''}${option.price} a ${option.period}. Renews automatically unless you cancel at least 24 hours before the end of the ${trial ? 'trial or ' : ''}current period, in your ${storeName()} settings.`
    : '';

  return (
    <Screen modal>
      <View style={styles.header}>
        <IconButton icon="close" label="Close" onPress={close} />
        <Pressable accessibilityRole="button" onPress={restorePurchases} style={styles.restore}>
          <T variant="smallStrong" color={colors.muted} style={{ fontSize: 15 }}>
            Restore
          </T>
        </Pressable>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Appear delay={AT.head}>
          <T variant="kicker">{plan ? 'Your plan is ready' : 'Premium'}</T>
          <T variant="title" style={styles.title} accessibilityRole="header">
            {trial ? `Try it free for ${trial}` : 'Unlock your plan'}
          </T>
        </Appear>

        {plan ? (
          <Appear delay={AT.card} style={styles.planCard}>
            <View style={styles.bodies} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <BodyFigure height={92} view="front" glows={glows} />
              <BodyFigure height={92} view="back" glows={glows} />
            </View>
            <View style={styles.planText}>
              <T variant="bodyStrong" numberOfLines={2}>
                {areas.map((a) => AREA_NAMES[a]).join(', ')}
              </T>
              <T variant="caption">
                {plan.days === 7 ? 'Every day' : `${plan.days} days a week`} · {plan.minutes} min each
              </T>
            </View>
          </Appear>
        ) : null}

        <View style={styles.benefits}>
          {BENEFITS.map((b, i) => (
            <Appear key={b.label} delay={AT.benefits + i * STAGGER} style={styles.benefit}>
              <Appear kind="pop" delay={AT.benefits + i * STAGGER + 120} style={styles.benefitIcon}>
                <Icon name={b.icon} size={16} color={colors.green} />
              </Appear>
              <T variant="body" style={styles.benefitText}>
                {b.label}
              </T>
            </Appear>
          ))}
        </View>

        {trial ? (
          <View style={styles.timeline}>
            <Step icon="check" title="Today" body="Full access to your plan, free." first delay={AT.timeline} />
            <Step icon="calendar" title={`In ${trial}`} body={`Your subscription starts, unless you cancel before then in your ${storeName()} settings.`} delay={AT.timeline + 360} />
          </View>
        ) : null}

        {!loading && options.length === 0 ? (
          <View style={styles.unavailable}>
            <T variant="body" color={colors.muted} center>
              {`Couldn't load prices from the ${storeName()}. Check your connection and try again.`}
            </T>
            <Pressable accessibilityRole="button" onPress={retry} hitSlop={8} style={styles.retry}>
              <T variant="smallStrong" color={colors.greenText}>
                Try again
              </T>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.plans} accessibilityRole="radiogroup">
          {options.map((o, i) => {
            const on = o.id === selected;
            const best = o.id === 'annual';
            return (
              <Appear key={o.id} kind="pop" delay={AT.plans + i * STAGGER}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${o.title}, ${o.price} a ${o.period}${o.trial ? `, ${o.trial} free first` : ''}${perMonthNote(o)}`}
                  onPress={() => {
                    tap();
                    // The same soft pop as picking anything else in the app; tapping the plan already chosen stays quiet.
                    if (o.id !== selected) playSound('select');
                    setSelected(o.id);
                  }}
                  style={[styles.plan, on && styles.planOn]}
                >
                  {/* The tick springs in each time a plan is picked. */}
                  <View style={[styles.radio, on && styles.radioOn]}>
                    {on ? (
                      <Appear key={`tick-${o.id}`} kind="pop">
                        <Icon name="check" size={12} color={colors.onGreen} strokeWidth={3} />
                      </Appear>
                    ) : null}
                  </View>
                  <View style={styles.planInfo}>
                    <View style={styles.planTitleRow}>
                      <T variant="bodyStrong">{o.title}</T>
                      {best && saving ? (
                        <View style={styles.badge}>
                          <T style={styles.badgeText}>Save {saving}%</T>
                        </View>
                      ) : null}
                    </View>
                    <T variant="caption">{`${o.trial ? `${o.trial} free, then billed` : 'Billed'} every ${o.period}${perMonthNote(o)}`}</T>
                  </View>
                  {/* The amount actually charged is the biggest price on the screen (an App Store rule); the monthly equivalent stays small. */}
                  <View style={styles.planPrice}>
                    <T style={styles.priceBig}>{o.price}</T>
                    <T variant="caption">{`a ${o.period}`}</T>
                  </View>
                </Pressable>
              </Appear>
            );
          })}
        </View>
      </ScrollView>

      {busy || loading ? (
        <View style={styles.busy}>
          <ActivityIndicator color={colors.onGreen} />
        </View>
      ) : (
        <Appear delay={AT.cta}>
          <PrimaryButton label={cta} onPress={purchase} disabled={!option} />
          {option ? <Shine /> : null}
        </Appear>
      )}
      <T variant="caption" center style={{ marginTop: 10 }}>
        {message || terms}
      </T>
      {purchasesTestMode() ? (
        <T variant="caption" center color={colors.greenText} style={{ marginTop: 4 }}>
          Test mode: example prices, no payment is taken.
        </T>
      ) : null}
      <View style={styles.links}>
        <T variant="caption" style={styles.link} onPress={() => Linking.openURL(config.links.terms)}>
          Terms of Use
        </T>
        <T variant="caption" style={styles.link} onPress={() => Linking.openURL(config.links.privacy)}>
          Privacy Policy
        </T>
      </View>
    </Screen>
  );
}

const BUY_MESSAGES: Record<'pending' | 'inactive' | 'unavailable', string> = {
  pending: 'Your payment is waiting for approval. Premium turns on as soon as it goes through.',
  inactive: 'Your payment went through but Premium did not turn on. Tap Restore to try again.',
  unavailable: 'Subscriptions are not available right now. Please try again later.',
};

/** ", £2.50 a month" for a yearly plan, so it can be compared with monthly; nothing for a monthly one. */
function perMonthNote(o: PaywallOption): string {
  return o.period === 'year' && o.perMonth ? `, ${o.perMonth} a month` : '';
}

/** Where subscriptions are managed: Google Play on Android, the App Store everywhere else. */
function storeName(): string {
  return Platform.OS === 'android' ? 'Google Play' : 'App Store';
}

/**
 * One point on the trial timeline. The first draws a line down to the next as it comes in, so the two read
 * as a journey: today you're in, in 7 days the subscription starts.
 */
function Step({ icon, title, body, first, delay }: { icon: IconName; title: string; body: string; first?: boolean; delay: number }) {
  const reduceMotion = useReducedMotion();
  const [grow] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  useEffect(() => {
    if (!first || reduceMotion) return;
    const anim = Animated.sequence([
      Animated.delay(delay + 200),
      Animated.timing(grow, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [first, delay, grow, reduceMotion]);
  return (
    <Appear delay={delay} style={styles.step}>
      <View style={styles.stepRail}>
        <Appear kind="pop" delay={delay + 80} style={[styles.stepDot, first && styles.stepDotFirst]}>
          <Icon name={icon} size={13} color={first ? colors.onGreen : colors.green} strokeWidth={2.4} />
        </Appear>
        {first ? <Animated.View style={[styles.stepLine, { transform: [{ scaleY: grow }] }]} /> : null}
      </View>
      <View style={styles.stepText}>
        <T variant="smallStrong">{title}</T>
        <T variant="caption">{body}</T>
      </View>
    </Appear>
  );
}

/**
 * A soft band of light that sweeps across the main button every few seconds, to draw the eye without moving
 * anything you'd read. It sits over the button without catching taps, and stays off with Reduce Motion.
 */
function Shine() {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [sweep] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduceMotion || width === 0) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(1400),
        Animated.timing(sweep, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
        Animated.delay(1600),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, width, sweep]);
  if (reduceMotion) return null;
  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-120, width + 40] });
  return (
    <View pointerEvents="none" style={styles.shineClip} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View style={[styles.shineBand, { transform: [{ translateX }, { rotate: '18deg' }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restore: { height: 44, justifyContent: 'center', paddingHorizontal: 4 },
  scroll: { paddingTop: 12, paddingBottom: 16 },
  title: { marginTop: 6 },

  planCard: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  bodies: { flexDirection: 'row', gap: 2, paddingHorizontal: 6, borderRadius: 14, backgroundColor: accent(0.07) },
  planText: { flex: 1, gap: 2 },

  benefits: { marginTop: 18, gap: 10 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.greenTint, alignItems: 'center', justifyContent: 'center' },
  benefitText: { flex: 1, fontFamily: fonts.medium },

  timeline: { marginTop: 18, gap: 10, paddingLeft: 2 },
  step: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center' },
  // Runs from below the first dot down to the next one, across the gap between the steps, growing downwards.
  stepLine: { flex: 1, width: 2, marginTop: 3, marginBottom: -10, borderRadius: 1, backgroundColor: colors.green, opacity: 0.35, transformOrigin: 'top' },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenTint },
  stepDotFirst: { backgroundColor: colors.green },
  stepText: { flex: 1, gap: 1 },

  plans: { marginTop: 20, gap: 10 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  planOn: { borderWidth: 2, borderColor: colors.green, boxShadow: shadows.small, backgroundColor: accent(0.08) },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: tint(0.3), alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: colors.green, borderColor: colors.green },
  planInfo: { flex: 1, gap: 2 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { height: 20, paddingHorizontal: 8, borderRadius: 10, backgroundColor: colors.green, justifyContent: 'center' },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.onGreen },
  planPrice: { alignItems: 'flex-end' },
  priceBig: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: colors.ink },

  shineClip: { position: 'absolute', top: 0, left: 0, right: 0, height: 56, borderRadius: 28, overflow: 'hidden' },
  shineBand: { position: 'absolute', top: -20, bottom: -20, width: 70 },
  busy: { height: 56, borderRadius: 28, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  links: { marginTop: 6, flexDirection: 'row', justifyContent: 'center', gap: 16 },
  link: { fontSize: 12, textDecorationLine: 'underline' },
  unavailable: { marginTop: 20, alignItems: 'center', gap: 4 },
  retry: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  activeStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeFigure: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  activeHalo: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: accent(0.09) },
});
