"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--cocoa)] px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-80"
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
      )}
      <span>{pending ? "Generating…" : "Generate & save"}</span>
    </button>
  );
}
