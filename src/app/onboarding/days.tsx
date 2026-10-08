import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Appear, STAGGER, usePopSounds } from '@/components/Appear';
import { AreaIcon } from '@/components/AreaIcon';
import { Icon, type IconName } from '@/components/Icon';
import { OnboardingHeader } from '@/components/OnboardingHeader';
import { T } from '@/components/T';
import { PrimaryButton, Screen } from '@/components/ui';
import { accent, colors, fonts, glass, MAX_FONT_SCALE, tint } from '@/constants/theme';
import { CUSTOM_MINUTES, DAY_OPTIONS, MINUTE_OPTIONS } from '@/data/content';
import type { DaysPerWeek, Minutes, PlannedSession } from '@/data/types';
import { DAY_LETTER, DAY_LONG, weekdayIndex } from '@/lib/dates';
import { goBack } from '@/lib/flow';
import { tap } from '@/lib/haptics';
import { generateSessions, planStartDay } from '@/lib/plan';
import { playSound, preloadSounds } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

const KIND_LABEL: Record<PlannedSession['kind'], string> = {
  mixed: 'All your areas',
  focus: 'Focus day',
  recovery: 'Gentle, to end the week',
  quick: 'Quick',
  programme: 'Programme',
  custom: 'Your routine',
};

// In onboarding the screen builds itself in order: the question, the week day by day, the days picker, then the button.
// "Minutes per session" waits until the days are picked.
const ROWS_AT = 300;
const PICKERS_AT = ROWS_AT + 7 * STAGGER + 120;
const BUTTON_AT = PICKERS_AT + 140;

/** How often and how long, on one screen, with the real week those choices build. Also opened from Settings to edit both. */
export default function Routine() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1';
  const draft = useAppStore((s) => s.draft);
  const plan = useAppStore((s) => s.plan);
  const setDraft = useAppStore((s) => s.setDraft);
  const createPlan = useAppStore((s) => s.createPlan);
  const updatePlan = useAppStore((s) => s.updatePlan);
  const source = editing && plan ? plan : draft;
  const [days, setDays] = useState<DaysPerWeek>(source.days);
  // Days picked by hand, or undefined for one of the preset spreads.
  const [weekdays, setWeekdays] = useState<number[] | undefined>(source.weekdays);
  const [minutes, setMinutes] = useState<Minutes>(source.minutes);
  // In onboarding the days come first: nothing is picked, and the minutes stay hidden, until they're chosen.
  const [daysPicked, setDaysPicked] = useState(editing);

  // The build-up and the pops are for onboarding; editing from Settings opens straight away and quietly.
  const still = editing;
  useEffect(() => {
    if (!still) preloadSounds();
  }, [still]);
  usePopSounds(still ? undefined : ROWS_AT, 7);

  const chooseDays = (n: DaysPerWeek) => {
    setDaysPicked(true);
    setDays(n);
    setWeekdays(undefined);
    if (!editing) setDraft({ days: n, weekdays: undefined });
  };
  const chooseWeekdays = (list: number[]) => {
    setDaysPicked(true);
    setWeekdays(list);
    setDays(list.length);
    if (!editing) setDraft({ days: list.length, weekdays: list });
  };
  const chooseMinutes = (m: Minutes) => {
    setMinutes(m);
    if (!editing) setDraft({ minutes: m });
  };

  // A new plan starts today, so its week is shown from today. An existing plan keeps the day it started on.
  const today = weekdayIndex(new Date());
  const startDay = editing && plan ? planStartDay(plan) : today;
  const order = [0, 1, 2, 3, 4, 5, 6].map((k) => (startDay + k) % 7);

  // The real week these choices build, from the same generator the plan uses.
  const week = useMemo(
    () => generateSessions({ areas: source.areas, goal: source.goal, level: source.level, days, weekdays, minutes, levels: {}, startDay }),
    [source.areas, source.goal, source.level, days, weekdays, minutes, startDay],
  );
  const byDay = new Map(week.map((s) => [s.weekday, s]));

  return (
    <Screen>
      <OnboardingHeader step={editing ? undefined : 3} />
      <Appear still={still}>
        <T variant="title" style={styles.title} accessibilityRole="header">
          {editing ? 'Your routine' : 'Fit it into your week'}
        </T>
      </Appear>
      <Appear still={still} delay={120}>
        <T variant="body" color={colors.muted} style={styles.sub}>
          Pick what you can keep up. You can change it any time.
        </T>
      </Appear>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Appear still={still} delay={200}>
          <View
            style={styles.week}
            accessibilityLabel={
              daysPicked ? `${days === 7 ? 'Every day' : `${days} days a week`}, ${minutes} minutes each, ${days * minutes} minutes a week` : 'Your week, once you pick your days'
            }
          >
            <View style={styles.weekHead}>
              <T variant="kicker">Your week</T>
              <T variant="smallStrong" color={colors.greenText} accessibilityLiveRegion="polite">
                {daysPicked ? `${days * minutes} min a week` : 'Pick your days below'}
              </T>
            </View>
            {order.map((i, k) => {
              const s = byDay.get(i);
              const name = !editing && i === today ? 'Today' : DAY_LONG[i].slice(0, 3);
              return (
                <Appear key={i} still={still} delay={ROWS_AT + k * STAGGER} style={[styles.row, styles.rowRule]}>
                  <T variant="smallStrong" color={s && daysPicked ? colors.ink : colors.faint} style={styles.dayName}>
                    {name}
                  </T>
                  {daysPicked ? (
                    // The sessions fill in down the week once the days are picked.
                    <Appear key="filled" still={still} delay={k * 40} style={styles.line}>
                      {s ? <SessionLine session={s} /> : <RestLine />}
                    </Appear>
                  ) : (
                    <EmptyLine />
                  )}
                </Appear>
              );
            })}
          </View>
        </Appear>

      </ScrollView>

      <Appear still={still} delay={PICKERS_AT}>
        <DaysPicker
          days={days}
          weekdays={weekdays}
          picked={daysPicked}
          current={week.map((w) => w.weekday)}
          sound={!still}
          onPreset={chooseDays}
          onCustom={chooseWeekdays}
        />
      </Appear>
      {daysPicked ? (
        <Appear still={still}>
          <MinutesPicker value={minutes} sound={!still} onChange={chooseMinutes} />
        </Appear>
      ) : null}

      <Appear still={still} delay={BUTTON_AT}>
        <PrimaryButton
          label={editing ? 'Save' : daysPicked ? 'Build my plan' : 'Pick your days'}
          disabled={!daysPicked}
          style={styles.cta}
          onPress={() => {
            if (editing) {
              updatePlan({ days, weekdays, minutes });
              goBack();
            } else {
              playSound('build');
              createPlan();
              router.push('/onboarding/building');
            }
          }}
        />
      </Appear>
    </Screen>
  );
}

/** The preset counts plus Custom, which opens a row of day toggles to pick the exact days. */
function DaysPicker({
  days,
  weekdays,
  picked,
  current,
  sound,
  onPreset,
  onCustom,
}: {
  days: DaysPerWeek;
  weekdays: number[] | undefined;
  /** False until the person picks: no count shows as chosen yet. */
  picked: boolean;
  /** The days the week uses right now, to start the custom pick from. */
  current: number[];
  /** Play the select and deselect pops on each tap. */
  sound: boolean;
  onPreset: (n: DaysPerWeek) => void;
  onCustom: (list: number[]) => void;
}) {
  const open = !!weekdays;
  const toggle = (d: number) => {
    if (!weekdays) return;
    const on = weekdays.includes(d);
    // At least one day stays on.
    if (on && weekdays.length === 1) return;
    tap();
    if (sound) playSound(on ? 'deselect' : 'select');
    onCustom(on ? weekdays.filter((x) => x !== d) : [...weekdays, d].sort((a, b) => a - b));
  };
  return (
    <View>
      <T variant="smallStrong" color={colors.muted} style={styles.pickerLabel}>
        Days a week
      </T>
      <View style={styles.segments} accessibilityRole="radiogroup" accessibilityLabel="Days a week">
        {DAY_OPTIONS.map((n) => (
          <Segment key={n} label={String(n)} describe={n === 7 ? 'Every day' : `${n} days a week`} on={picked && !open && days === n} sound={sound} onPress={() => onPreset(n)} />
        ))}
        <Segment
          label="Custom"
          small
          describe={open ? `Custom days, ${days} a week` : 'Pick your own days'}
          on={open}
          sound={sound}
          onPress={() => {
            if (!open) onCustom([...current].sort((a, b) => a - b));
          }}
        />
      </View>
      {open ? (
        <View style={styles.dayToggles} accessibilityLabel="Your days">
          {DAY_LETTER.map((letter, d) => {
            const on = weekdays.includes(d);
            return (
              <Pressable
                key={d}
                accessibilityRole="checkbox"
                accessibilityLabel={DAY_LONG[d]}
                accessibilityState={{ checked: on }}
                onPress={() => toggle(d)}
                style={({ pressed }) => [styles.dayToggle, on && styles.dayToggleOn, pressed && styles.pressed]}
              >
                <T style={[styles.dayToggleText, on && styles.dayToggleTextOn]}>{letter}</T>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** The preset lengths plus Custom, which opens a stepper for any length in the custom range. */
function MinutesPicker({ value, sound, onChange }: { value: Minutes; sound: boolean; onChange: (m: Minutes) => void }) {
  const isCustom = !MINUTE_OPTIONS.includes(value);
  const [open, setOpen] = useState(isCustom);
  const step = (by: number) => {
    tap();
    onChange(Math.min(CUSTOM_MINUTES.max, Math.max(CUSTOM_MINUTES.min, value + by)));
  };
  return (
    <View style={styles.pickerGap}>
      <T variant="smallStrong" color={colors.muted} style={styles.pickerLabel}>
        Minutes per session
      </T>
      <View style={styles.segments} accessibilityRole="radiogroup" accessibilityLabel="Minutes per session">
        {MINUTE_OPTIONS.map((m) => (
          <Segment
            key={m}
            label={String(m)}
            describe={`${m} minutes`}
            on={!open && value === m}
            sound={sound}
            onPress={() => {
              setOpen(false);
              onChange(m);
            }}
          />
        ))}
        <Segment
          label={open ? `${value}` : 'Custom'}
          small={!open}
          describe={open ? `Custom, ${value} minutes` : 'Custom length'}
          on={open}
          sound={sound}
          onPress={() => {
            setOpen(true);
            if (!isCustom) onChange(CUSTOM_MINUTES.start);
          }}
        />
      </View>
      {open ? (
        <View style={styles.stepper}>
          <StepButton icon="minus" label="One minute less" disabled={value <= CUSTOM_MINUTES.min} onPress={() => step(-1)} />
          <View style={styles.stepperValue} accessibilityLiveRegion="polite">
            <T style={styles.stepperNumber}>{value}</T>
            <T variant="caption">
              min · {CUSTOM_MINUTES.min} to {CUSTOM_MINUTES.max}
            </T>
          </View>
          <StepButton icon="plus" label="One minute more" disabled={value >= CUSTOM_MINUTES.max} onPress={() => step(1)} />
        </View>
      ) : null}
    </View>
  );
}

function Segment({
  label,
  describe,
  on,
  small,
  sound,
  onPress,
}: {
  label: string;
  describe: string;
  on: boolean;
  small?: boolean;
  sound?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={describe}
      onPress={() => {
        tap();
        if (sound && !on) playSound('select');
        onPress();
      }}
      style={({ pressed }) => [styles.segment, on && styles.segmentOn, pressed && !on && styles.pressed]}
    >
      <T maxFontSizeMultiplier={MAX_FONT_SCALE} style={[styles.segmentText, small && styles.segmentTextSmall, on && styles.segmentTextOn]}>
        {label}
      </T>
    </Pressable>
  );
}

function StepButton({ icon, label, disabled, onPress }: { icon: IconName; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.stepButton, disabled && styles.stepButtonDisabled, pressed && styles.pressed]}
    >
      <Icon name={icon} size={18} color={disabled ? colors.chevron : colors.ink} strokeWidth={2.4} />
    </Pressable>
  );
}

function SessionLine({ session }: { session: PlannedSession }) {
  const single = session.areas.length === 1 && session.kind !== 'recovery';
  const icon: IconName = session.kind === 'recovery' ? 'feather' : 'layers';
  return (
    <View style={styles.line}>
      {single ? (
        <AreaIcon area={session.areas[0]} size={28} />
      ) : (
        <View style={styles.iconDot}>
          <Icon name={icon} size={15} color={colors.green} strokeWidth={1.9} />
        </View>
      )}
      <View style={styles.lineText}>
        <T variant="smallStrong" numberOfLines={1}>
          {session.title}
        </T>
        <T variant="caption" numberOfLines={1} style={styles.kind}>
          {KIND_LABEL[session.kind]}
        </T>
      </View>
      <T variant="caption" style={styles.minutes}>
        {session.minutes} min
      </T>
    </View>
  );
}

/** A faint placeholder for a day, before the days are picked. */
function EmptyLine() {
  return (
    <View style={styles.line} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <View style={[styles.iconDot, styles.restDot]} />
      <View style={styles.placeholder} />
    </View>
  );
}

function RestLine() {
  return (
    <View style={styles.line}>
      <View style={[styles.iconDot, styles.restDot]}>
        <Icon name="moon" size={13} color={colors.chevron} strokeWidth={1.9} />
      </View>
      <T variant="small" color={colors.faint}>
        Rest
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 20 },
  sub: { marginTop: 8 },
  scroll: { flex: 1, marginTop: 16 },
  scrollContent: { paddingBottom: 12 },

  week: { borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  weekHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 40 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 10 },
  rowRule: { borderTopWidth: 1, borderTopColor: colors.line },
  dayName: { width: 44 },
  line: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  lineText: { flex: 1 },
  kind: { fontSize: 12, lineHeight: 15 },
  minutes: { fontFamily: fonts.semibold, color: colors.muted },
  iconDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.greenTint, alignItems: 'center', justifyContent: 'center' },
  restDot: { backgroundColor: tint(0.07) },
  placeholder: { width: '45%', height: 10, borderRadius: 5, backgroundColor: tint(0.07) },

  note: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  noteText: { flex: 1 },

  pickerLabel: { marginTop: 4, marginBottom: 8 },
  pickerGap: { marginTop: 10 },
  segments: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 18, backgroundColor: tint(0.08) },
  segment: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.green, boxShadow: `0px 6px 12px -8px ${accent(0.8)}` },
  pressed: { backgroundColor: glass },
  segmentText: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  segmentTextOn: { color: colors.onGreen },
  segmentTextSmall: { fontFamily: fonts.semibold, fontSize: 14 },

  dayToggles: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  dayToggle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  dayToggleOn: { backgroundColor: colors.green, borderColor: colors.green },
  dayToggleText: { fontFamily: fonts.bold, fontSize: 15, color: colors.muted },
  dayToggleTextOn: { color: colors.onGreen },

  stepper: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  stepButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepButtonDisabled: { opacity: 0.5 },
  stepperValue: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  stepperNumber: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: colors.ink },

  cta: { marginTop: 18 },
});
