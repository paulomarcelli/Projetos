export function FullscreenLoading({ text }: { text: string }) {
  return (
    <div className="fullscreen-loading" role="status" aria-live="polite">
      <span className="spinner spinner--lg spinner--light" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}
