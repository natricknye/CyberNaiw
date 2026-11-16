import type { NaiwaVoice, PetAge } from "../types/pet";
import andiUrl from "../assets/audio/naiwa-andi.wav";
import gagaUrl from "../assets/audio/naiwa-gaga.wav";
import gajiucaiUrl from "../assets/audio/naiwa-gajiucai.wav";
import ganbadeUrl from "../assets/audio/naiwa-ganbade.wav";
import laughUrl from "../assets/audio/naiwa-laugh-long.wav";
import olaUrl from "../assets/audio/naiwa-ola.wav";

const VOICE_URLS: Record<NaiwaVoice, string> = {
  andi: andiUrl,
  gaga: gagaUrl,
  ganbade: ganbadeUrl,
  laugh: laughUrl,
  ola: olaUrl,
  gajiucai: gajiucaiUrl,
};

const players = new Map<NaiwaVoice, HTMLAudioElement>();
let activePlayer: HTMLAudioElement | null = null;

// Known wall-clock durations at 1.0×; baby playback divides by 1.35.
const VOICE_DURATION_MS: Record<NaiwaVoice, number> = {
  andi: 1850,
  gaga: 1170,
  ganbade: 1110,
  laugh: 4110,
  ola: 960,
  gajiucai: 890,
};

function getPlayer(voice: NaiwaVoice): HTMLAudioElement {
  let player = players.get(voice);
  if (!player) {
    player = new Audio(VOICE_URLS[voice]);
    player.preload = "auto";
    player.volume = 0.9;
    players.set(voice, player);
  }
  return player;
}

export function stopNaiwaVoice(): void {
  if (!activePlayer) {
    return;
  }

  activePlayer.pause();
  try {
    activePlayer.currentTime = 0;
  } catch {
    // Ignore a player that has not loaded metadata yet.
  }
  activePlayer = null;
}

export function playNaiwaVoice(voice: NaiwaVoice, age: PetAge): number {
  if (typeof Audio === "undefined") {
    return 0;
  }

  const player = getPlayer(voice);
  // A new line must stop the previous one instead of stacking audio.
  if (activePlayer && activePlayer !== player) {
    activePlayer.pause();
    try {
      activePlayer.currentTime = 0;
    } catch {
      // Ignore a player that has not loaded metadata yet.
    }
  }
  activePlayer = player;
  player.pause();
  if (player.readyState > 0) {
    player.currentTime = 0;
  }
  const rate = age === "baby" ? 1.35 : 1;
  player.playbackRate = rate;
  (player as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch =
    false;
  void player.play().catch(() => {
    // Autoplay can be blocked until the first user gesture; ignore it.
  });

  const loadedDuration =
    Number.isFinite(player.duration) && player.duration > 0
      ? player.duration * 1000
      : VOICE_DURATION_MS[voice];
  return loadedDuration / rate;
}
