import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { ExerciseArt } from '@/components/ExerciseArt';
import { Ring } from '@/components/Ring';
import { Sheet } from '@/components/Sheet';
import { T } from '@/components/T';
import { IconButton, PrimaryButton, Screen, Segments, TextButton } from '@/components/ui';
import { accent, colors, fonts, glass, shadows, tint } from '@/constants/theme';
import { AREA_NAMES } from '@/data/areas';
import { getExercise } from '@/data/exercises';
import type { Exercise } from '@/data/types';
import { goBack } from '@/lib/flow';
import { cueSchedule, guideFor, restLine, speechSeconds, startLine, switchLine } from '@/lib/guide';
import { success, tap } from '@/lib/haptics';
import { COUNTDOWN, holdFor, restSeconds, SWITCH_SECONDS } from '@/lib/holds';
import { playSound, preloadSounds, speak, stopSpeaking } from '@/lib/sounds';
import { useViewport } from '@/lib/viewport';
import { findSession, useAppStore } from '@/store/useAppStore';

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function SessionPlayer() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  // Short phones get a slightly smaller ring and tighter spacing so nothing is pushed off-screen.
  const compact = useViewport().height < 760;
  const ringSize = compact ? 216 : 268;
  const session = useAppStore((s) => findSession(s, id));
  const recordSession = useAppStore((s) => s.recordSession);
  // Your own hold times from the preview, fixed for the length of the session.
  const [holds] = useState(() => useAppStore.getState().holds);
  // The rest before each stretch, from Sound & timer, also fixed for the session.
  const [readySeconds] = useState(() => restSeconds(useAppStore.getState().readySeconds));

  const moves: Exercise[] = (session?.exerciseIds ?? []).map((m) => getExercise(m)).filter((e): e is Exercise => !!e);
  const [index, setIndex] = useState(0);
  // Each move starts with a rest, then the hold. A two-sided move holds the first side,
  // takes a short break to switch, then holds the second side.
  const [phase, setPhase] = useState<'ready' | 'move' | 'switch'>(readySeconds > 0 ? 'ready' : 'move');
  const [side, setSide] = useState<1 | 2>(1);
  const [left, setLeft] = useState(() => (readySeconds > 0 ? readySeconds : moves[0] ? holdFor(moves[0], holds) : 1));
  const [playing, setPlaying] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const elapsed = useRef(0);
  const finished = useRef(false);

  const move = moves[index];
  const total = phase === 'ready' ? readySeconds : phase === 'switch' ? SWITCH_SECONDS : move ? holdFor(move, holds) : 1;
  const last = index === moves.length - 1;

  const goTo = (i: number, skipReady = false) => {
    const target = moves[i];
    if (!target) return;
    const straightIn = skipReady || readySeconds === 0;
    setIndex(i);
    setPhase(straightIn ? 'move' : 'ready');
    setSide(1);
    setLeft(straightIn ? holdFor(target, holds) : readySeconds);
    setPlaying(true);
  };

  const startSecondSide = () => {
    if (!move) return;
    setPhase('move');
    setSide(2);
    setLeft(holdFor(move, holds));
    setPlaying(true);
  };

  const finish = () => {
    if (!session || finished.current) return;
    finished.current = true;
    success();
    if (useAppStore.getState().sounds.voice) speak('Well done. Session complete.', 900);
    const recordId = recordSession(session, elapsed.current, moves.length);
    router.replace({ pathname: '/complete', params: { id: recordId } });
  };

  // Load the chimes up front, so the first one plays without a delay. Leaving early stops the voice;
  // finishing lets "Session complete" play out.
  useEffect(() => {
    preloadSounds();
    return () => {
      if (!finished.current) stopSpeaking();
    };
  }, []);

  // The guide (lib/guide.ts, with each move's script in data/guide.ts) talks you through every move:
  // in the rest, what's next and how to get into position; as it starts, the movement and how long;
  // through it, form and breathing cues; at the switch, how to change sides; and a countdown at the end.
  // The voice is a setting (Sound & timer → Voice). The same words show under the picture either way.
  // The latest cue said during a hold, tagged with its stage, so it only shows while that stage lasts.
  const [cue, setCue] = useState<{ stage: string; text: string } | null>(null);
  // This hold's cues, by seconds left on the timer.
  const cues = useRef<Record<number, string>>({});
  // When the voice will have finished what it's saying (ms), so a queued line and the cues after it allow for it.
  const speakingUntil = useRef(0);
  const restedFor = useRef(-1);

  /** Say a line (if the voice is on) and return how many seconds until it's finished. */
  const say = (text: string, { delay = 0, queue = false }: { delay?: number; queue?: boolean } = {}): number => {
    const now = Date.now();
    const begins = queue ? Math.max(now + delay, speakingUntil.current) : now + delay;
    speakingUntil.current = begins + speechSeconds(text) * 1000;
    if (useAppStore.getState().sounds.voice) speak(text, delay, { queue });
    return (speakingUntil.current - now) / 1000;
  };

  // Runs only when the move or its stage changes, never on the timer's every-second updates.
  // Each line starts just after the chime that marks the change, so the two don't talk over each other.
  const announce = useEffectEvent(() => {
    if (!move) return;
    if (phase === 'ready') {
      restedFor.current = index;
      cues.current = {};
      say(restLine(move, index === 0), { delay: index === 0 ? 0 : 900 });
    } else if (phase === 'switch') {
      cues.current = {};
      say(switchLine(move), { delay: 400 });
    } else {
      const hold = holdFor(move, holds);
      // Straight into a move (the rest was skipped): its name and setup come first.
      const withSetup = side === 1 && restedFor.current !== index;
      // After the rest or the switch, wait for that line to finish rather than cutting it off.
      const busy = say(startLine(move, hold, { side, withSetup }), { delay: 500, queue: !withSetup });
      cues.current = cueSchedule(move, hold, busy);
    }
  });
  useEffect(() => announce(), [index, phase, side]);

  // Pausing stops the voice mid-line; the next cue picks up when you play again.
  useEffect(() => {
    if (!playing) stopSpeaking();
  }, [playing]);

  // One tick a second while playing: rest → hold (→ switch → second side) → next move, or finish after the last.
  const tick = useEffectEvent(() => {
    elapsed.current += 1;
    const sounds = useAppStore.getState().sounds;
    if (left > 1) {
      const now = left - 1;
      if (phase === 'move') {
        // The last seconds of every hold, counted aloud: "5, 4, 3, 2, 1". Before that, the move's cues.
        if (now <= COUNTDOWN) {
          if (sounds.voice) speak(String(now));
        } else if (cues.current[now]) {
          say(cues.current[now]);
          setCue({ stage: `${index}:${phase}:${side}`, text: cues.current[now] });
        }
      }
      setLeft(now);
      return;
    }
    if (phase === 'ready' && move) {
      tap();
      if (sounds.readyEnd) playSound('go');
      setPhase('move');
      setSide(1);
      setLeft(holdFor(move, holds));
      return;
    }
    if (phase === 'switch') {
      tap();
      if (sounds.readyEnd) playSound('go');
      startSecondSide();
      return;
    }
    // A hold's time is up.
    if (sounds.moveEnd) playSound('done');
    if (move?.eachSide && side === 1) {
      // First side done: a short break to change sides.
      tap();
      setPhase('switch');
      setLeft(SWITCH_SECONDS);
      return;
    }
    if (last) finish();
    else goTo(index + 1);
  });

  useEffect(() => {
    if (!playing || !move || leaving) return;
    const timer = setInterval(() => tick(), 1000);
    return () => clearInterval(timer);
  }, [playing, move, leaving]);

  // The Android back button asks before ending, like the X.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setLeaving(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  if (!session || moves.length === 0) return <Redirect href="/" />;

  const next = moves[index + 1];
  const ready = phase === 'ready';
  const switching = phase === 'switch';
  // Rests and the switch between sides are the quiet stages: a muted ring and time.
  const between = ready || switching;
  const half = phase === 'move' && move.eachSide ? (side === 1 ? 'First side' : 'Second side') : null;
  // Under the picture, the guide's words for this stage: how to set up, the movement, then each cue as it's said.
  const guide = guideFor(move);
  const caption =
    cue?.stage === `${index}:${phase}:${side}` ? cue.text : ready ? guide.setup : switching ? (guide.other ?? 'Change to your other side.') : guide.go;

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="close" label="End session" onPress={() => setLeaving(true)} />
        <View style={styles.headerText}>
          <T variant="smallStrong" center numberOfLines={1} style={{ fontSize: 15 }}>
            {session.title}
          </T>
          <T variant="caption" center>
            {`${index + 1} of ${moves.length}`}
          </T>
        </View>
        {last && phase === 'move' && !(move.eachSide && side === 1) ? (
          <View style={{ width: 44 }} />
        ) : (
          <Pressable accessibilityRole="button" onPress={() => (ready ? goTo(index, true) : switching || last ? startSecondSide() : goTo(index + 1))} style={styles.skip}>
            <T variant="smallStrong" color={colors.muted} style={{ fontSize: 15 }}>
              Skip
            </T>
          </Pressable>
        )}
      </View>
      <View style={styles.segments}>
        <Segments count={moves.length} filled={index} active={index} />
      </View>

      <View style={[styles.stage, compact && styles.stageCompact]}>
        <Ring size={ringSize} stroke={6} progress={left / total} color={between ? accent(0.35) : colors.green}>
          {/* The second side of a two-sided move shows the picture flipped; it turns over during the switch break. */}
          <ExerciseArt exercise={move} size={ringSize - 44} shadow breathe={playing && !between} mirrored={move.eachSide && (switching || side === 2)} />
        </Ring>
      </View>

      <T variant="kicker" center style={[styles.kicker, compact && styles.kickerCompact]}>
        {ready ? (index === 0 ? 'Get ready' : 'Rest') : switching ? 'Switch sides' : AREA_NAMES[move.area]}
        {half ? <T variant="caption" style={styles.side}>{`  ·  ${half}`}</T> : null}
      </T>
      <T variant="title" center style={styles.name}>
        {move.name}
      </T>
      <T variant="body" color={colors.muted} center style={[styles.tip, compact && styles.tipCompact]}>
        {caption}
      </T>
      <T center style={[styles.time, compact && styles.timeCompact, between && styles.timeReady]}>
        {clock(Math.max(0, left))}
      </T>

      <View style={styles.flex} />

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous move"
          onPress={() => {
            tap();
            goTo(Math.max(0, index - 1));
          }}
          style={({ pressed }) => [styles.round, pressed && styles.pressed]}
        >
          <Icon name="prev" size={22} color={colors.ink} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause' : 'Play'}
          onPress={() => {
            tap();
            setPlaying((p) => !p);
          }}
          style={({ pressed }) => [styles.play, pressed && styles.pressed]}
        >
          {playing ? <Icon name="pause" size={28} color={colors.onGreen} strokeWidth={2.6} /> : <Icon name="play" size={28} color={colors.onGreen} />}
        </Pressable>
        {last ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Finish session" onPress={finish} style={({ pressed }) => [styles.round, styles.finish, pressed && styles.pressed]}>
            <Icon name="check" size={24} color={colors.onGreen} strokeWidth={2.6} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next move"
            onPress={() => {
              tap();
              goTo(index + 1);
            }}
            style={({ pressed }) => [styles.round, pressed && styles.pressed]}
          >
            <Icon name="next" size={22} color={colors.ink} />
          </Pressable>
        )}
      </View>

      <View style={[styles.upNext, compact && styles.upNextCompact]}>
        {next ? (
          <>
            <ExerciseArt exercise={next} size={38} dot={false} />
            <T variant="small" style={styles.flex}>
              Up next
            </T>
            <T variant="bodyStrong" numberOfLines={1} style={styles.upNextName}>
              {next.name}
            </T>
          </>
        ) : (
          <>
            <T variant="small" style={[styles.flex, { paddingLeft: 8 }]}>
              Last move
            </T>
            <Pressable accessibilityRole="button" onPress={finish} style={styles.finishLink}>
              <T variant="bodyStrong" color={colors.greenText} style={{ fontSize: 15 }}>
                Finish
              </T>
              <Icon name="chevron" size={16} color={colors.greenText} strokeWidth={2.4} />
            </Pressable>
          </>
        )}
      </View>

      <Sheet visible={leaving} onClose={() => setLeaving(false)}>
        <T variant="title" center style={styles.sheetTitle}>
          End this session?
        </T>
        <T variant="body" color={colors.muted} center style={styles.sheetBody}>
          {index === 0 ? 'Nothing is saved until you finish.' : `${index} of ${moves.length} moves done. Progress is saved when you finish.`}
        </T>
        <PrimaryButton label="Keep going" style={styles.sheetCta} onPress={() => setLeaving(false)} />
        <TextButton label="End session" color={colors.flameText} onPress={() => goBack()} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44 },
  headerText: { flex: 1 },
  skip: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  segments: { marginTop: 12, flexDirection: 'row' },
  stage: { marginTop: 24, alignItems: 'center' },
  stageCompact: { marginTop: 12 },
  kicker: { marginTop: 22 },
  kickerCompact: { marginTop: 14 },
  side: { color: colors.muted, letterSpacing: 0, textTransform: 'none', fontFamily: fonts.semibold },
  name: { marginTop: 6 },
  // Room for three lines, so the guide's longer lines don't push the timer around as they change.
  tip: { marginTop: 8, minHeight: 69, alignSelf: 'center', maxWidth: 320 },
  tipCompact: { marginTop: 4, minHeight: 63, fontSize: 15, lineHeight: 21 },
  time: { marginTop: 10, fontFamily: fonts.display, fontSize: 44, lineHeight: 48, letterSpacing: -1, color: colors.ink, fontVariant: ['tabular-nums'] },
  timeCompact: { marginTop: 4, fontSize: 36, lineHeight: 40 },
  timeReady: { color: colors.muted },
  flex: { flex: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 30 },
  round: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: tint(0.14),
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: shadows.small,
  },
  finish: { backgroundColor: colors.green, borderColor: colors.green },
  play: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', boxShadow: shadows.button },
  pressed: { transform: [{ scale: 0.96 }] },
  upNext: {
    marginTop: 22,
    height: 56,
    borderRadius: 28,
    paddingLeft: 9,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: glass,
    borderWidth: 1,
    borderColor: tint(0.10),
  },
  upNextCompact: { marginTop: 14 },
  upNextName: { fontSize: 15, maxWidth: 170 },
  finishLink: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
  sheetTitle: { marginTop: 22, fontSize: 28, lineHeight: 32 },
  sheetBody: { marginTop: 10, alignSelf: 'center', maxWidth: 300 },
  sheetCta: { marginTop: 24 },
});
