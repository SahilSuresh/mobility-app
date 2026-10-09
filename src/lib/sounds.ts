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

// One player per sound for the whole run of the app, so a chime still finishes when the screen changes.
const players: Partial<Record<Sound, AudioPlayer>> = {};
let configured = false;

function playerFor(sound: Sound): AudioPlayer {
  if (!configured) {
    configured = true;
    // Mix with the user's own music rather than pausing it, and respect the phone's silent switch.
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
  }
  players[sound] ??= createAudioPlayer(SOURCES[sound]);
  return players[sound];
}

/** Load the sounds ahead of time, so the first one plays without a delay. Also picks the guide's voice. */
export function preloadSounds(): void {
  try {
    (Object.keys(SOURCES) as Sound[]).forEach(playerFor);
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

/** Play a sound from the start. */
export function playSound(sound: Sound): void {
  if (!canPlay()) return;
  try {
    const player = playerFor(sound);
    player.seekTo(0).catch(() => undefined);
    player.play();
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

/** A calm coaching pace: a little slower than normal speech. */
const RATE = 0.9;

/**
 * The guide's voice: the best English voice on the phone, preferring a British one and the higher-quality
 * "enhanced" voices people can download in their phone's settings. Until it's found, the phone's default is used.
 */
let voice: string | undefined;
let voicePicked = false;

function pickVoice(): void {
  if (voicePicked) return;
  voicePicked = true;
  Speech.getAvailableVoicesAsync()
    .then((voices) => {
      const english = voices.filter((v) => v.language.toLowerCase().startsWith('en'));
      const score = (v: Speech.Voice) => (v.quality === Speech.VoiceQuality.Enhanced ? 2 : 0) + (v.language.toLowerCase().replace('_', '-') === 'en-gb' ? 1 : 0);
      const best = english.sort((a, b) => score(b) - score(a))[0];
      // Only switch from the default for a voice that's actually better: enhanced, or at least British.
      if (best && score(best) > 0) voice = best.identifier;
    })
    .catch(() => undefined);
}

// Lines waiting to be said (each after its delay), so stopping can cancel them too.
const timers = new Set<ReturnType<typeof setTimeout>>();

function cancelPending(): void {
  timers.forEach(clearTimeout);
  timers.clear();
}

/**
 * Say something aloud. Normally it cuts off anything still being said; with `queue` it waits its turn instead,
 * such as the hold time after a setup line that's still going. `delayMs` lets a chime finish first.
 */
export function speak(text: string, delayMs = 0, { queue = false }: { queue?: boolean } = {}): void {
  if (!queue) cancelPending();
  const timer = setTimeout(() => {
    timers.delete(timer);
    try {
      if (!queue) Speech.stop();
      Speech.speak(text, { rate: RATE, voice });
    } catch {
      // Voice is a nice-to-have: the session works the same without it.
    }
  }, delayMs);
  timers.add(timer);
}

/** Stop anything being said, such as when a session ends or is paused. */
export function stopSpeaking(): void {
  cancelPending();
  try {
    Speech.stop();
  } catch {
    // Nothing to stop.
  }
}
