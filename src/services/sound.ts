import laughUrl from "../assets/audio/naiwa-laugh.wav";

let laugh: HTMLAudioElement | null = null;

export function playNaiwaLaugh(): void {
  if (typeof Audio === "undefined") {
    return;
  }

  laugh ??= new Audio(laughUrl);
  laugh.currentTime = 0;
  void laugh.play().catch(() => {
    // Autoplay can be blocked until the first user gesture; ignore it.
  });
}
