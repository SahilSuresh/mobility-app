import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Appear } from '@/components/Appear';
import { Icon, type IconName } from '@/components/Icon';
import { ExerciseArt } from '@/components/ExerciseArt';
import { Sheet } from '@/components/Sheet';
import { T } from '@/components/T';
import { IconButton, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { accent, colors, fonts, glass, MAX_FONT_SCALE, tint } from '@/constants/theme';
import { AREA_NAMES, AREA_ORDER, sortAreas } from '@/data/areas';
import { ROUTINE_IDEAS } from '@/data/content';
import { durationLabel, exercisesForArea, getExercise } from '@/data/exercises';
import type { AreaId, Exercise } from '@/data/types';
import { goBack, startSession } from '@/lib/flow';
import { tap } from '@/lib/haptics';
import { fewerUpsAndDowns, minutesForMoves, routineSession } from '@/lib/plan';
import { playSound, preloadSounds } from '@/lib/sounds';
import { useAppStore } from '@/store/useAppStore';

type Filters = { areas: AreaId[] };

const ROUNDS = [
  { n: 1, label: 'Once' },
  { n: 2, label: 'Twice' },
  { n: 3, label: '3 times' },
];

/** Every move, grouped by area (neck down to feet), easiest first within each. */
const LIBRARY: Exercise[] = AREA_ORDER.flatMap((a) => exercisesForArea(a));

/** A name from what's in the routine: "Hips", "Hips & lower back", or "Full body" for three or more areas. */
function suggestName(ids: string[]): string {
  const areas = sortAreas([...new Set(ids.map((id) => getExercise(id)?.area).filter((a): a is AreaId => !!a))]);
  if (areas.length === 0) return 'My routine';
  if (areas.length === 1) return AREA_NAMES[areas[0]];
  if (areas.length === 2) return `${AREA_NAMES[areas[0]]} & ${AREA_NAMES[areas[1]].toLowerCase()}`;
  return 'Full body';
}

/**
 * Build a routine in two steps. Pick: tap any stretch to add it (the tray shows your order), filter by area or search.
 * Order & name: move things up or down, let it order itself so you get down to the floor once, choose rounds, name it.
 * Opened with `id` to edit a saved routine, or `idea` to start from one of the ideas.
 */
export default function RoutineBuilder() {
  const { id, idea } = useLocalSearchParams<{ id?: string; idea?: string }>();
  const existing = useAppStore((s) => (id ? s.routines.find((r) => r.id === id) : undefined));
  const planAreas = useAppStore((s) => s.plan?.areas ?? []);
  const saveRoutine = useAppStore((s) => s.saveRoutine);
  const startCustom = useAppStore((s) => s.startCustom);
  const reduceMotion = useReducedMotion();
  const template = ROUTINE_IDEAS.find((i) => i.id === idea);

  const [step, setStep] = useState<'pick' | 'arrange'>('pick');
  const [picked, setPicked] = useState<string[]>(() => existing?.moves ?? template?.moves ?? []);
  const [name, setName] = useState(existing?.name ?? template?.name ?? '');
  const [rounds, setRounds] = useState(existing?.rounds ?? 1);
  // The areas picked in the Filters sheet: any number of them (none picked = all).
  const [areas, setAreas] = useState<AreaId[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [query, setQuery] = useState('');
  const [leaving, setLeaving] = useState(false);

  useEffect(() => preloadSounds(), []);

  const startedWith = existing?.moves ?? template?.moves ?? [];
  const dirty = picked.join() !== startedWith.join() || (existing ? name !== existing.name || rounds !== existing.rounds : false);
  const ids = Array.from({ length: rounds }, () => picked).flat();
  const minutes = picked.length ? minutesForMoves(ids) : 0;
  const finalName = name.trim() || suggestName(picked);

  const q = query.trim().toLowerCase();
  const matches = (e: Exercise, f: Filters) =>
    f.areas.length === 0 || f.areas.includes(e.area);
  const filters: Filters = { areas };
  const shown = LIBRARY.filter((e) => matches(e, filters) && (!q || e.name.toLowerCase().includes(q) || AREA_NAMES[e.area].toLowerCase().includes(q)));
  const filterCount = areas.length;
  // "Hips, Knees"
  const filterSummary = sortAreas(areas)
    .map((a) => AREA_NAMES[a])
    .join(', ');
  const clearFilters = () => {
    setAreas([]);
  };

  const toggle = (e: Exercise) => {
    tap();
    const on = picked.includes(e.id);
    playSound(on ? 'deselect' : 'select');
    setPicked(on ? picked.filter((x) => x !== e.id) : [...picked, e.id]);
  };
  const animate = () => {
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= picked.length) return;
    tap();
    playSound('select');
    animate();
    const next = [...picked];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setPicked(next);
  };
  const remove = (moveId: string) => {
    tap();
    playSound('deselect');
    animate();
    const next = picked.filter((x) => x !== moveId);
    setPicked(next);
    if (next.length === 0) setStep('pick');
  };
  const smartOrder = fewerUpsAndDowns(picked);
  const alreadySmart = smartOrder.join() === picked.join();

  const close = () => (dirty ? setLeaving(true) : goBack());
  const save = (thenStart: boolean) => {
    const routineId = saveRoutine({ id: existing?.id, name: finalName, moves: picked, rounds });
    if (!thenStart) {
      playSound('build');
      goBack();
      return;
    }
    const routine = useAppStore.getState().routines.find((r) => r.id === routineId);
    if (!routine) return;
    const session = routineSession(routine);
    startCustom(session);
    // Out of the builder first, so the preview opens over the Routines tab.
    router.back();
    startSession(session.id);
  };

  return (
    <Screen modal>
      <View style={styles.header}>
        {step === 'pick' ? (
          <IconButton icon="close" label="Close" onPress={close} />
        ) : (
          <IconButton
            icon="back"
            label="Back to picking"
            onPress={() => {
              tap();
              setStep('pick');
            }}
          />
        )}
        <View style={styles.flex}>
          <T variant="smallStrong" center>
            {existing ? 'Edit routine' : 'New routine'}
          </T>
          <T variant="caption" center>
            {step === 'pick' ? 'Step 1 of 2 · Pick' : 'Step 2 of 2 · Order & name'}
          </T>
        </View>
        <View style={styles.headerSpace} />
      </View>

      {step === 'pick' ? (
        <>
          <Appear>
            <T style={styles.title} accessibilityRole="header">
              Pick your stretches
            </T>
          </Appear>

          {/* The tray: what you've picked, in the order it will play. Tap one to take it out. */}
          <Appear delay={60}>
            {picked.length === 0 ? (
              <View style={styles.trayEmpty}>
                <T variant="caption" center>
                  Tap stretches below to add them. They play in the order you pick.
                </T>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tray} contentContainerStyle={styles.trayContent}>
                {picked.map((moveId, i) => {
                  const e = getExercise(moveId);
                  if (!e) return null;
                  return (
                    <Appear key={moveId} kind="pop">
                      <Pressable accessibilityRole="button" accessibilityLabel={`${i + 1}. ${e.name}. Remove`} onPress={() => toggle(e)} style={styles.trayItem}>
                        <ExerciseArt exercise={e} size={46} dot={false} outline />
                        <View style={styles.trayNumber}>
                          <T style={styles.trayNumberText}>{String(i + 1)}</T>
                        </View>
                      </Pressable>
                    </Appear>
                  );
                })}
              </ScrollView>
            )}
          </Appear>

          <Appear delay={120} style={styles.searchRow}>
            <View style={styles.search}>
              <Icon name="search" size={17} color={colors.muted} strokeWidth={2.2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search stretches"
                placeholderTextColor={colors.faint}
                style={styles.searchInput}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                returnKeyType="search"
                accessibilityLabel="Search stretches"
              />
              {query ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')}>
                  <Icon name="close" size={15} color={colors.muted} strokeWidth={2.4} />
                </Pressable>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={filterCount ? `Filters, ${filterCount} on` : 'Filters'}
              onPress={() => {
                tap();
                playSound('select');
                setFiltering(true);
              }}
              style={({ pressed }) => [styles.filterButton, filterCount > 0 && styles.filterButtonOn, pressed && styles.pressed]}
            >
              <Icon name="sliders" size={16} color={filterCount ? colors.onGreen : colors.ink} strokeWidth={2.2} />
              <T style={[styles.filterButtonText, filterCount > 0 && styles.filterButtonTextOn]}>{filterCount ? `Filters · ${filterCount}` : 'Filters'}</T>
            </Pressable>
          </Appear>

          {filterCount ? (
            <Appear style={styles.activeRow}>
              <T variant="caption" numberOfLines={2} style={styles.flex}>
                {`${shown.length} ${shown.length === 1 ? 'stretch' : 'stretches'} · ${filterSummary}`}
              </T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear filters"
                hitSlop={10}
                onPress={() => {
                  tap();
                  playSound('deselect');
                  clearFilters();
                }}
              >
                <T variant="smallStrong" color={colors.greenText}>
                  Clear
                </T>
              </Pressable>
            </Appear>
          ) : null}

          <ScrollView style={styles.flex} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {shown.map((e, i) => {
              const order = picked.indexOf(e.id);
              const on = order >= 0;
              return (
                <Appear key={e.id} kind="pop" delay={220 + Math.min(i, 11) * 35} style={styles.cell}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${e.name}, ${AREA_NAMES[e.area]}, ${durationLabel(e)}`}
                    accessibilityHint="Long press to see how to do it and why it helps"
                    onPress={() => toggle(e)}
                    onLongPress={() => {
                      tap();
                      router.push({ pathname: '/exercise/[id]', params: { id: e.id } });
                    }}
                    style={({ pressed }) => [styles.cellInner, pressed && styles.pressed]}
                  >
                    <View style={[styles.ring, on && styles.ringOn]}>
                      <ExerciseArt exercise={e} size={78} dot={false} />
                    </View>
                    {on ? (
                      <View style={styles.badge}>
                        <T style={styles.badgeText}>{String(order + 1)}</T>
                      </View>
                    ) : null}
                    <T style={styles.cellName} numberOfLines={2} center>
                      {e.name}
                    </T>
                    <T variant="caption" numberOfLines={1} center style={styles.cellMeta}>
                      {durationLabel(e)}
                    </T>
                  </Pressable>
                </Appear>
              );
            })}
            {shown.length === 0 ? (
              <T variant="body" color={colors.muted} center style={styles.none}>
                No stretches match. Try another area or search.
              </T>
            ) : null}
          </ScrollView>

          <T variant="caption" center style={styles.hint}>
            Tap to add · Hold to see how and why
          </T>
          <PrimaryButton
            label={picked.length ? `Next · ${picked.length} ${picked.length === 1 ? 'stretch' : 'stretches'} · ${minutes} min` : 'Pick a stretch to start'}
            disabled={picked.length === 0}
            onPress={() => {
              tap();
              playSound('next');
              setStep('arrange');
            }}
          />
        </>
      ) : (
        <>
          <ScrollView style={styles.flex} contentContainerStyle={styles.arrange} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Appear>
              <T style={styles.title} accessibilityRole="header">
                Order & name
              </T>
            </Appear>
            <Appear delay={60}>
              <T variant="kicker" style={styles.label}>
                Name
              </T>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={suggestName(picked)}
                placeholderTextColor={colors.faint}
                maxLength={30}
                style={styles.nameInput}
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                accessibilityLabel="Routine name"
                returnKeyType="done"
              />
            </Appear>

            <Appear delay={120}>
              <T variant="kicker" style={styles.label}>
                Play it
              </T>
              <View style={styles.segments} accessibilityRole="radiogroup" accessibilityLabel="How many times through">
                {ROUNDS.map((r) => {
                  const on = rounds === r.n;
                  return (
                    <Pressable
                      key={r.n}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`${r.label} through`}
                      onPress={() => {
                        tap();
                        if (!on) playSound('select');
                        setRounds(r.n);
                      }}
                      style={[styles.segment, on && styles.segmentOn]}
                    >
                      <T style={[styles.segmentText, on && styles.segmentTextOn]}>{r.label}</T>
                    </Pressable>
                  );
                })}
              </View>
            </Appear>

            <Appear delay={180} style={styles.orderHead}>
              <T variant="kicker">{`Order · ${minutes} min`}</T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fewer ups and downs: standing moves first, then kneeling, sitting and lying"
                accessibilityState={{ disabled: alreadySmart }}
                disabled={alreadySmart}
                onPress={() => {
                  tap();
                  playSound('select');
                  animate();
                  setPicked(smartOrder);
                }}
                style={({ pressed }) => [styles.smart, alreadySmart && styles.smartDone, pressed && styles.pressed]}
              >
                <Icon name={alreadySmart ? 'check' : 'layers'} size={14} color={colors.greenText} strokeWidth={2.2} />
                <T variant="smallStrong" color={colors.greenText}>
                  {alreadySmart ? 'Easy order' : 'Fewer ups and downs'}
                </T>
              </Pressable>
            </Appear>
            <T variant="caption" style={styles.orderNote}>
              {alreadySmart
                ? 'Standing first, floor last: you only get down once.'
                : 'Tap to put standing moves first and lying ones last, so you get down to the floor once.'}
            </T>

            <View style={styles.list}>
              {picked.map((moveId, i) => {
                const e = getExercise(moveId);
                if (!e) return null;
                return (
                  <Appear key={moveId} delay={240 + Math.min(i, 8) * 50} style={[styles.row, i > 0 && styles.rowRule]}>
                    <T style={styles.rowNumber}>{String(i + 1)}</T>
                    <ExerciseArt exercise={e} size={44} dot={false} />
                    <View style={styles.flex}>
                      <T variant="bodyStrong" numberOfLines={1}>
                        {e.name}
                      </T>
                      <T variant="caption" numberOfLines={1}>
                        {`${AREA_NAMES[e.area]} · ${durationLabel(e)}`}
                      </T>
                    </View>
                    <SmallButton icon="up" label={`Move ${e.name} up`} disabled={i === 0} onPress={() => move(i, i - 1)} />
                    <SmallButton icon="down" label={`Move ${e.name} down`} disabled={i === picked.length - 1} onPress={() => move(i, i + 1)} />
                    <SmallButton icon="close" label={`Remove ${e.name}`} onPress={() => remove(moveId)} />
                  </Appear>
                );
              })}
            </View>
            <TextButton
              label="+ Add more stretches"
              color={colors.greenText}
              style={styles.addMore}
              onPress={() => {
                tap();
                setStep('pick');
              }}
            />
          </ScrollView>

          <Appear kind="pop" delay={300}>
            <PrimaryButton label={existing ? 'Save changes' : 'Save routine'} icon="check" onPress={() => save(false)} />
          </Appear>
          <TextButton label={`Save and start · ${minutes} min`} color={colors.greenText} style={styles.saveStart} onPress={() => save(true)} />
        </>
      )}

      <FiltersSheet
        visible={filtering}
        onClose={() => setFiltering(false)}
        value={filters}
        planAreas={planAreas}
        results={LIBRARY.filter((e) => matches(e, filters)).length}
        onChange={(next) => {
          setAreas(next.areas);
        }}
        onClear={clearFilters}
      />

      <Sheet visible={leaving} onClose={() => setLeaving(false)}>
        <T variant="title" center style={styles.sheetTitle}>
          {existing ? 'Discard changes?' : 'Discard this routine?'}
        </T>
        <T variant="body" color={colors.muted} center style={styles.sheetBody}>
          {existing ? 'Your saved routine stays as it was.' : "What you've picked won't be saved."}
        </T>
        <PrimaryButton label="Keep building" style={styles.sheetCta} onPress={() => setLeaving(false)} />
        <TextButton
          label="Discard"
          color={colors.flameText}
          onPress={() => {
            setLeaving(false);
            goBack();
          }}
        />
      </Sheet>
    </Screen>
  );
}

/**
 * Every area at once, wrapped so nothing scrolls sideways: pick any number, or your plan's areas in one tap.
 * Changes apply as you tap, and the button says how many stretches match.
 */
function FiltersSheet({
  visible,
  onClose,
  value,
  planAreas,
  results,
  onChange,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  value: Filters;
  planAreas: AreaId[];
  results: number;
  onChange: (next: Filters) => void;
  onClear: () => void;
}) {
  const toggle = <K,>(list: K[], item: K) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const yours = planAreas.length > 0 && sortAreas(value.areas).join() === sortAreas(planAreas).join();
  const any = value.areas.length > 0;
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.sheetHead}>
        <T style={styles.sheetHeading} accessibilityRole="header">
          Filters
        </T>
        {any ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            hitSlop={10}
            onPress={() => {
              tap();
              playSound('deselect');
              onClear();
            }}
          >
            <T variant="smallStrong" color={colors.greenText}>
              Clear all
            </T>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sheetLabelRow}>
        <T variant="kicker">Area</T>
        {planAreas.length ? (
          <FilterChip small label="Your areas" icon="target" on={yours} onPress={() => onChange({ ...value, areas: yours ? [] : planAreas })} />
        ) : null}
      </View>
      <View style={styles.chipGrid}>
        {AREA_ORDER.map((a, i) => (
          <Appear key={a} kind="pop" delay={i * 25} style={styles.chipHalf}>
            <FilterChip
              label={AREA_NAMES[a]}
              count={LIBRARY.filter((e) => e.area === a).length}
              on={value.areas.includes(a)}
              onPress={() => onChange({ ...value, areas: toggle(value.areas, a) })}
            />
          </Appear>
        ))}
      </View>

      <PrimaryButton
        label={results ? `Show ${results} ${results === 1 ? 'stretch' : 'stretches'}` : 'No stretches match'}
        disabled={results === 0}
        style={styles.sheetShow}
        onPress={() => {
          tap();
          playSound('next');
          onClose();
        }}
      />
    </Sheet>
  );
}

function FilterChip({
  label,
  on,
  icon,
  count,
  small,
  onPress,
}: {
  label: string;
  on: boolean;
  icon?: IconName;
  count?: number;
  small?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={() => {
        tap();
        playSound(on ? 'deselect' : 'select');
        onPress();
      }}
      style={[styles.chip, small && styles.chipSmall, on && styles.chipOn]}
    >
      {on ? <Icon name="check" size={13} color={colors.onGreen} strokeWidth={2.6} /> : icon && !on ? <Icon name={icon} size={13} color={colors.greenText} strokeWidth={2.2} /> : null}
      <T style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>
        {label}
      </T>
      {count !== undefined ? <T style={[styles.chipCount, on && styles.chipTextOn]}>{String(count)}</T> : null}
    </Pressable>
  );
}

/** A small round button in a row: up, down or remove. */
function SmallButton({ icon, label, disabled, onPress }: { icon: 'up' | 'down' | 'close'; label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.small, disabled && styles.smallDisabled, pressed && styles.pressed]}
    >
      <View style={icon === 'close' ? undefined : { transform: [{ rotate: icon === 'up' ? '-90deg' : '90deg' }] }}>
        <Icon name={icon === 'close' ? 'close' : 'chevron'} size={icon === 'close' ? 13 : 15} color={colors.ink} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerSpace: { width: 44 },
  title: { marginTop: 14, fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: colors.ink },

  trayEmpty: { marginTop: 12, minHeight: 64, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: tint(0.18) },
  tray: { marginTop: 12, marginHorizontal: -24, flexGrow: 0 },
  trayContent: { gap: 8, paddingHorizontal: 24, paddingVertical: 4, minHeight: 64, alignItems: 'center' },
  trayItem: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  trayNumber: { position: 'absolute', top: 0, right: 0, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, borderWidth: 2, borderColor: colors.bgTop },
  trayNumberText: { fontFamily: fonts.bold, fontSize: 10.5, color: colors.onGreen },

  searchRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: glass, borderWidth: 1, borderColor: colors.border },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: glass, borderWidth: 1, borderColor: colors.border },
  filterButtonOn: { backgroundColor: colors.green, borderColor: colors.green },
  filterButtonText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  filterButtonTextOn: { color: colors.onGreen },
  activeRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  searchInput: { flex: 1, height: 44, fontFamily: fonts.medium, fontSize: 15, color: colors.ink },

  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipSmall: { height: 32, paddingHorizontal: 11, borderRadius: 16 },
  chipCount: { fontFamily: fonts.semibold, fontSize: 12, color: colors.faint },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  chipHalf: { width: '48.5%' },
  sheetHead: { marginTop: 18, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sheetHeading: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32, color: colors.ink },
  sheetLabelRow: { marginTop: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetShow: { marginTop: 22 },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  chipTextOn: { color: colors.onGreen },

  // Three to a row from the left, so a short last row lines up under the others instead of spreading out.
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, marginHorizontal: -4, paddingTop: 14, paddingBottom: 12 },
  cell: { width: '33.333%', paddingHorizontal: 4 },
  cellInner: { alignItems: 'center' },
  ring: { padding: 3, borderRadius: 50, borderWidth: 2.5, borderColor: 'transparent' },
  ringOn: { borderColor: colors.green, backgroundColor: accent(0.12) },
  badge: { position: 'absolute', top: 0, right: 6, minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, borderWidth: 2, borderColor: colors.bgTop },
  badgeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.onGreen },
  cellName: { marginTop: 6, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17, color: colors.ink, minHeight: 34 },
  cellMeta: { fontSize: 11.5 },
  none: { width: '100%', paddingVertical: 30 },
  hint: { marginTop: 4, marginBottom: 8 },

  arrange: { paddingBottom: 16 },
  label: { marginTop: 20, marginBottom: 8 },
  nameInput: { height: 50, paddingHorizontal: 16, borderRadius: 16, backgroundColor: glass, borderWidth: 1, borderColor: colors.border, fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  segments: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 18, backgroundColor: tint(0.08) },
  segment: { flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.green },
  segmentText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  segmentTextOn: { color: colors.onGreen },

  orderHead: { marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  smart: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: colors.greenTint },
  smartDone: { backgroundColor: 'transparent' },
  orderNote: { marginTop: 6 },
  list: { marginTop: 10, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  rowRule: { borderTopWidth: 1, borderTopColor: colors.line },
  rowNumber: { width: 18, textAlign: 'center', fontFamily: fonts.bold, fontSize: 13, color: colors.muted },
  small: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(0.07) },
  smallDisabled: { opacity: 0.3 },
  addMore: { marginTop: 8 },
  saveStart: { marginTop: 6 },

  sheetTitle: { marginTop: 22, fontSize: 28, lineHeight: 32 },
  sheetBody: { marginTop: 8, alignSelf: 'center', maxWidth: 300 },
  sheetCta: { marginTop: 22 },
});
