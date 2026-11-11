"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** A submit button for server-action forms. Shows progress, then confirms that the change was saved. */
export function SaveButton({ children, className = "btn btn-ink" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  const [saved, setSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (pending) {
      wasPending.current = true;
      setSaved(false);
      return;
    }
    if (!wasPending.current) return;
    wasPending.current = false;
    setSaved(true);
    const timer = setTimeout(() => setSaved(false), 4000);
    return () => clearTimeout(timer);
  }, [pending]);

  return (
    <span className="inline-flex items-center gap-3">
      <button type="submit" className={className} disabled={pending} aria-busy={pending}>
        {pending ? <span className="spinner" aria-hidden="true" /> : null}
        {children}
      </button>
      <span role="status" className="text-[0.9375rem] font-semibold text-basil">
        {saved ? "Saved" : ""}
      </span>
    </span>
  );
}
