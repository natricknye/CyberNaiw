import type { PetAge } from "../types/pet";
import laughUrl from "../assets/audio/naiwa-laugh.wav";

let laugh: HTMLAudioElement | null = null;

export function playNaiwaLaugh(age: PetAge): void {
  if (typeof Audio === "undefined") {
    return;
  }

  laugh ??= new Audio(laughUrl);
  laugh.currentTime = 0;
  laugh.playbackRate = age === "baby" ? 1.35 : 1;
  (laugh as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch =
    false;
  void laugh.play().catch(() => {
    // Autoplay can be blocked until the first user gesture; ignore it.
  });
}
