import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { useAppStore } from '@/store/useAppStore';

/**
 * Short sounds. The session player's chimes: `done` when a move ends, `go` when the rest ends.
 * Soft pops for picking areas: `pop` as each one appears, `select` and `deselect` as it's tapped.
 * `build` for "Build my plan": three rising bell notes. `ready` as the plan appears. `start` for every Start button.
 * `next` for Continue in onboarding: two warm marimba notes. `tab` for switching tabs: one soft marimba tock.
 */
const SOURCES = {
  done: require('../../assets/sounds/done.wav'),
  go: require('../../assets/sounds/go.wav'),
  pop: require('../../assets/sounds/pop.wav'),
  select: require('../../assets/sounds/select.wav'),
  deselect: require('../../assets/sounds/deselect.wav'),
  build: require('../../assets/sounds/build.wav'),
  ready: require('../../assets/sounds/ready.wav'),
  start: require('../../assets/sounds/start.wav'),
  next: require('../../assets/sounds/next.wav'),
  tab: require('../../assets/sounds/tab.wav'),
} as const;

export type Sound = keyof typeof SOURCES;

/**
 * A few players per sound, kept for the whole run of the app (so a chime still finishes when the screen changes).
 * Sounds tapped in quick succession, like switching tabs or the pops of a list building in, each get their own
 * player and can overlap, instead of one player being restarted mid-way.
 */
const POOL: Partial<Record<Sound, number>> = { pop: 4 };
/** Players for every other sound: enough for any button tapped quickly a few times in a row. */
const POOL_DEFAULT = 3;

/**
 * One player and whether it's ready to play at once: sitting at the start and not playing. Rewinding is
 * asynchronous, so a player is rewound as soon as it finishes; playing one that's still at its end would play
 * nothing, which is what made every other quick tab tap silent.
 */
type Slot = { player: AudioPlayer; ready: boolean; startedAt: number };

const pools: Partial<Record<Sound, Slot[]>> = {};

/**
 * The phone's audio setup for the app: mix with the user's own music rather than pausing it, and respect the
 * silent switch. Set once, before the first sound. Speech waits for it too: changing the audio setup while a line
 * is starting garbles it on iPhone, which is what mangled the first exercise's name.
 */
let audioSetup: Promise<void> | null = null;

function setUpAudio(): Promise<void> {
  audioSetup ??= setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
  return audioSetup;
}

function makeSlot(sound: Sound): Slot {
  // keepAudioSessionActive: by default, on iPhone, a player switches the app's audio off 0.1s after it finishes
  // (unless another player is still going). The guide's voice uses that same audio, so a chime ending would cut
  // the voice mid-sentence: the "go" chime at the start of every move silenced the move's instructions. The app
  // mixes with other apps' audio, so keeping it on never interrupts anyone's music.
  const slot: Slot = { player: createAudioPlayer(SOURCES[sound], { keepAudioSessionActive: true }), ready: true, startedAt: 0 };
  slot.player.addListener('playbackStatusUpdate', (status) => {
    if (!status.didJustFinish) return;
    slot.player
      .seekTo(0)
      .then(() => {
        slot.ready = true;
      })
      .catch(() => undefined);
  });
  return slot;
}

function poolFor(sound: Sound): Slot[] {
  setUpAudio();
  pools[sound] ??= Array.from({ length: POOL[sound] ?? POOL_DEFAULT }, () => makeSlot(sound));
  return pools[sound];
}

/** Load the sounds ahead of time, so the first one plays without a delay. Also picks the guide's voice. */
export function preloadSounds(): void {
  try {
    (Object.keys(SOURCES) as Sound[]).forEach(poolFor);
  } catch {
    // Sound is a nice-to-have: the session works the same without it.
  }
  pickVoice();
}

/**
 * Browsers block sound until the person has tapped or clicked the page, and log an error for every sound tried
 * before that (such as the pops as onboarding builds in). On web, wait for that first tap. Phones have no such rule.
 */
function canPlay(): boolean {
  if (Platform.OS !== 'web') return true;
  const activation = (globalThis as { navigator?: { userActivation?: { hasBeenActive: boolean } } }).navigator?.userActivation;
  return activation ? activation.hasBeenActive : true;
}

/**
 * Play a sound from the start, every time, however quickly it's asked for again. A ready player plays at once;
 * if every player is busy, the one started longest ago is rewound and played once the rewind has landed.
 */
export function playSound(sound: Sound): void {
  if (!canPlay()) return;
  try {
    const pool = poolFor(sound);
    const free = pool.find((s) => s.ready);
    const slot = free ?? pool.reduce((oldest, s) => (s.startedAt < oldest.startedAt ? s : oldest));
    slot.ready = false;
    slot.startedAt = Date.now();
    if (free) {
      slot.player.play();
      return;
    }
    slot.player
      .seekTo(0)
      .then(() => slot.player.play())
      .catch(() => undefined);
  } catch {
    // Sound is a nice-to-have: the session works the same without it.
  }
}

/** Whether either session chime is on in Sound & timer. Start and the session-complete chord follow it. */
export function chimesOn(): boolean {
  const { sounds } = useAppStore.getState();
  return sounds.moveEnd || sounds.readyEnd;
}

/** The sound for every Start button. It goes with the session chimes: turning them off in Sound & timer quiets it too. */
export function playStartSound(): void {
  if (chimesOn()) playSound('start');
}

/** A calm coaching pace: a touch slower than normal speech. Slower than this starts to sound drawn out on a phone. */
const RATE = 0.95;

/**
 * The guide's voice. Normally the phone's own default voice, the one it uses everywhere else. On an iPhone with one
 * of Apple's natural-sounding Premium or Enhanced English voices downloaded (Settings → Accessibility → Spoken
 * Content → Voices), that one is used instead, British first.
 *
 * iPhones also ship joke voices, several of them labelled British English (Rocko, Grandpa, Eddy, and the old
 * novelty ones like Fred, Albert or Zarvox). They must never be picked: an earlier version chose any British
 * voice and could land on one, which made the guide sound deep and strange. Android always keeps its default.
 */
let voice: string | undefined;
let voicePicked = false;

/** Apple's novelty voices: the classic Mac ones (com.apple.speech.synthesis.*) and the Eloquence set. */
const NOVELTY = /eloquence|speech\.synthesis|\b(albert|bad ?news|bahh|bells|boing|bubbles|cellos|deranged|eddy|flo|fred|good ?news|grandma|grandpa|hysterical|jester|junior|kathy|organ|ralph|reed|rocko|sandy|shelley|superstar|trinoids|whisper|wobble|zarvox)\b/i;

function pickVoice(): void {
  if (voicePicked || Platform.OS !== 'ios') return;
  voicePicked = true;
  Speech.getAvailableVoicesAsync()
    .then((voices) => {
      // Apple's downloadable voices say what they are in their identifier (Premium ones report "Default" quality).
      const tier = (v: Speech.Voice) => (/\.premium\./i.test(v.identifier) ? 2 : /\.enhanced\./i.test(v.identifier) || v.quality === Speech.VoiceQuality.Enhanced ? 1 : 0);
      const british = (v: Speech.Voice) => (v.language.toLowerCase().replace('_', '-') === 'en-gb' ? 1 : 0);
      const good = voices.filter((v) => v.language.toLowerCase().startsWith('en') && !NOVELTY.test(`${v.identifier} ${v.name}`) && tier(v) > 0);
      const best = good.sort((a, b) => tier(b) * 2 + british(b) - (tier(a) * 2 + british(a)))[0];
      if (best) voice = best.identifier;
    })
    .catch(() => undefined);
}

// Lines waiting to be said (each after its delay), so stopping can cancel them too.
const timers = new Set<ReturnType<typeof setTimeout>>();

// Lines handed to the phone that it hasn't finished yet, and when the voice last did anything, so a session can
// wait for the guide to finish talking. The safety limit means a missed "finished" event can never stall it.
let unfinished = 0;
let lastVoiceActivity = 0;
const STALE_MS = 20000;
// Bumped whenever speech is cut off, so a late "stopped" from a cut-off line can't count a newer line as finished.
let generation = 0;

function cancelPending(): void {
  timers.forEach(clearTimeout);
  timers.clear();
}

/** Whether the guide is still talking, or has a line about to start. */
export function isSpeaking(): boolean {
  if (Date.now() - lastVoiceActivity > STALE_MS) return false;
  return timers.size > 0 || unfinished > 0;
}

/**
 * Say something aloud. Normally it cuts off anything still being said; with `queue` it waits its turn instead,
 * such as the hold time after a setup line that's still going. `delayMs` lets a chime finish first.
 */
export function speak(text: string, delayMs = 0, { queue = false }: { queue?: boolean } = {}): void {
  if (!queue) cancelPending();
  lastVoiceActivity = Date.now();
  const timer = setTimeout(() => {
    // Never start speaking while the phone's audio is still being set up.
    setUpAudio().then(() => {
      timers.delete(timer);
      try {
        if (!queue) {
          Speech.stop();
          generation += 1;
          unfinished = 0;
        }
        const mine = generation;
        unfinished += 1;
        lastVoiceActivity = Date.now();
        const done = () => {
          if (mine !== generation) return;
          unfinished = Math.max(0, unfinished - 1);
          lastVoiceActivity = Date.now();
        };
        Speech.speak(text, { rate: RATE, voice, onDone: done, onStopped: done, onError: done });
      } catch {
        // Voice is a nice-to-have: the session works the same without it.
        unfinished = 0;
      }
    });
  }, delayMs);
  timers.add(timer);
}

/** Stop anything being said, such as when a session ends or is paused. */
export function stopSpeaking(): void {
  cancelPending();
  generation += 1;
  unfinished = 0;
  try {
    Speech.stop();
  } catch {
    // Nothing to stop.
  }
}
