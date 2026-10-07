import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BodyFigure } from '@/components/BodyFigure';
import { Icon, type IconName } from '@/components/Icon';
import { T } from '@/components/T';
import { IconButton, PrimaryButton, Screen } from '@/components/ui';
import { config } from '@/constants/config';
import { accent, colors, fonts, shadows, tint } from '@/constants/theme';
import { AREA_NAMES, AREA_ORDER, sortAreas } from '@/data/areas';
import type { AreaId } from '@/data/types';
import { continueFirstRun, goBack } from '@/lib/flow';
import { success, tap } from '@/lib/haptics';
import { yearlySaving } from '@/lib/paywall';
import { buy, loadOptions, purchasesLive, restore, type PaywallOption } from '@/lib/purchases';
import { playStartSound } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

const BENEFITS: { icon: IconName; label: string }[] = [
  { icon: 'calendar', label: 'Your full plan, every session' },
  { icon: 'sliders', label: 'Adjusts to how each session felt' },
  { icon: 'layers', label: 'Every area and programme' },
  { icon: 'arc', label: 'Your progress over time' },
];

const ALL_AREAS = Object.fromEntries(AREA_ORDER.map((a) => [a, 0.55])) as Partial<Record<AreaId, number>>;

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
  const [options, setOptions] = useState<PaywallOption[]>([]);
  const [selected, setSelected] = useState<PaywallOption['id']>('annual');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFlag('seenPaywall');
    loadOptions().then((list) => {
      setOptions(list);
      if (!list.some((o) => o.id === 'annual') && list[0]) setSelected(list[0].id);
    });
  }, [setFlag]);

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
      if (await buy(option)) {
        // The trial or subscription has started: it sounds like every other start.
        playStartSound();
        setPremium(true);
        success();
        unlocked();
      }
    } catch {
      setMessage('The purchase did not go through. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const restorePurchases = async () => {
    setMessage('');
    const active = await restore();
    if (active) {
      setPremium(true);
      unlocked();
    } else {
      setMessage(active === null ? 'Restore works once the App Store is connected.' : 'No purchases to restore.');
    }
  };

  if (isPremium && !busy) {
    return (
      <Screen modal>
        <IconButton icon="close" label="Close" onPress={close} />
        <View style={styles.activeStage}>
          <View style={styles.activeFigure}>
            <View style={styles.activeHalo} />
            <BodyFigure height={200} glows={ALL_AREAS} />
          </View>
          <T variant="title" center style={{ marginTop: 20 }}>
            Premium is on
          </T>
          <T variant="body" color={colors.muted} center style={{ marginTop: 8 }}>
            Every session, area and programme is open.
          </T>
        </View>
        <PrimaryButton label="Done" onPress={close} />
      </Screen>
    );
  }

  const areas = sortAreas(plan?.areas ?? []);
  const glows = Object.fromEntries(areas.map((a) => [a, 1])) as Partial<Record<AreaId, number>>;
  const trial = option?.trial;
  const cta = trial ? 'Start free trial' : 'Subscribe';
  const terms = option ? `${trial ? `${trial} free, then ` : ''}${option.price} a ${option.period}. Cancel anytime.` : '';

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
        <T variant="kicker">{plan ? 'Your plan is ready' : 'Premium'}</T>
        <T variant="title" style={styles.title} accessibilityRole="header">
          {trial ? `Try it free for ${trial}` : 'Unlock your plan'}
        </T>

        {plan ? (
          <View style={styles.planCard}>
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
          </View>
        ) : null}

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.label} style={styles.benefit}>
              <View style={styles.benefitIcon}>
                <Icon name={b.icon} size={16} color={colors.green} />
              </View>
              <T variant="body" style={styles.benefitText}>
                {b.label}
              </T>
            </View>
          ))}
        </View>

        {trial ? (
          <View style={styles.timeline}>
            <Step icon="check" title="Today" body="Full access to your plan, free." first />
            <Step icon="calendar" title={`In ${trial}`} body={`Your subscription starts, unless you cancel before then in your ${storeName()} settings.`} />
          </View>
        ) : null}

        <View style={styles.plans} accessibilityRole="radiogroup">
          {options.map((o) => {
            const on = o.id === selected;
            const best = o.id === 'annual';
            return (
              <Pressable
                key={o.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${o.title}, ${o.price} a ${o.period}${o.perMonth ? `, ${o.perMonth} a month` : ''}${o.trial ? `, ${o.trial} free` : ''}`}
                onPress={() => {
                  tap();
                  setSelected(o.id);
                }}
                style={[styles.plan, on && styles.planOn]}
              >
                <View style={[styles.radio, on && styles.radioOn]}>{on ? <Icon name="check" size={12} color={colors.onGreen} strokeWidth={3} /> : null}</View>
                <View style={styles.planInfo}>
                  <View style={styles.planTitleRow}>
                    <T variant="bodyStrong">{o.title}</T>
                    {best && saving ? (
                      <View style={styles.badge}>
                        <T style={styles.badgeText}>Save {saving}%</T>
                      </View>
                    ) : null}
                  </View>
                  <T variant="caption">{o.trial ? `${o.trial} free, then ${o.price} a ${o.period}` : `${o.price} a ${o.period}`}</T>
                </View>
                <View style={styles.planPrice}>
                  <T style={styles.priceBig}>{o.perMonth ?? o.price}</T>
                  <T variant="caption">a month</T>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator color={colors.onGreen} />
        </View>
      ) : (
        <PrimaryButton label={cta} onPress={purchase} disabled={!option} />
      )}
      <T variant="caption" center style={{ marginTop: 10 }}>
        {message || terms}
      </T>
      {!purchasesLive() ? (
        <T variant="caption" center color={colors.greenText} style={{ marginTop: 4 }}>
          Test mode: example prices, no payment is taken.
        </T>
      ) : null}
      <View style={styles.links}>
        <T variant="caption" style={styles.link} onPress={() => Linking.openURL(config.links.terms)}>
          Terms
        </T>
        <T variant="caption" style={styles.link} onPress={() => Linking.openURL(config.links.privacy)}>
          Privacy
        </T>
      </View>
    </Screen>
  );
}

/** Where subscriptions are managed: Google Play on Android, the App Store everywhere else. */
function storeName(): string {
  return Platform.OS === 'android' ? 'Google Play' : 'App Store';
}

function Step({ icon, title, body, first }: { icon: IconName; title: string; body: string; first?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepDot, first && styles.stepDotFirst]}>
        <Icon name={icon} size={13} color={first ? colors.onGreen : colors.green} strokeWidth={2.4} />
      </View>
      <View style={styles.stepText}>
        <T variant="smallStrong">{title}</T>
        <T variant="caption">{body}</T>
      </View>
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

  busy: { height: 56, borderRadius: 28, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  links: { marginTop: 6, flexDirection: 'row', justifyContent: 'center', gap: 16 },
  link: { fontSize: 12, textDecorationLine: 'underline' },
  activeStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeFigure: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  activeHalo: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: accent(0.09) },
});
