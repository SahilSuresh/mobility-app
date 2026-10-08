import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

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

/** Load the sounds ahead of time, so the first one plays without a delay. */
export function preloadSounds(): void {
  try {
    (Object.keys(SOURCES) as Sound[]).forEach(playerFor);
  } catch {
    // Sound is a nice-to-have: the session works the same without it.
  }
}

/** Play a sound from the start. */
export function playSound(sound: Sound): void {
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

let pending: ReturnType<typeof setTimeout> | null = null;

/** Say something aloud, cutting off anything still being said. `delayMs` lets a chime finish first. */
export function speak(text: string, delayMs = 0): void {
  if (pending) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = null;
    try {
      Speech.stop();
      Speech.speak(text, { rate: 0.95 });
    } catch {
      // Voice is a nice-to-have: the session works the same without it.
    }
  }, delayMs);
}

/** Stop anything being said, such as when a session ends. */
export function stopSpeaking(): void {
  if (pending) clearTimeout(pending);
  pending = null;
  try {
    Speech.stop();
  } catch {
    // Nothing to stop.
  }
}
