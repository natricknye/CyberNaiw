interface SpeechBubbleProps {
  message: string | null;
  nonce?: number;
}

export default function SpeechBubble({
  message,
  nonce,
}: SpeechBubbleProps) {
  return (
    <div className="speech-bubble" aria-live="polite">
      {message ? (
        <span key={nonce ?? message} className="speech-bubble__text">
          {message}
        </span>
      ) : null}
    </div>
  );
}
