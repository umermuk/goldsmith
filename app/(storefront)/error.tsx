"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold text-ink">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm text-ink-muted">
        {error.message || "An unexpected error occurred."}
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
