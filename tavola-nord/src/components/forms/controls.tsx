"use client";

import { useId, useRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

type FieldShell = { label: ReactNode; hint?: ReactNode; error?: string; className?: string };

function describedBy(id: string, hint: unknown, error: unknown): string | undefined {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

function Shell({ id, label, hint, error, className, children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="field-hint mb-1.5">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({ label, hint, error, className, ...input }: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error} className={className}>
      <input id={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} {...input} />
    </Shell>
  );
}

export function TextArea({ label, hint, error, className, ...input }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error} className={className}>
      <textarea id={id} rows={3} className="input" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} {...input} />
    </Shell>
  );
}

export function SelectField({ label, hint, error, className, children, ...input }: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error} className={className}>
      <select id={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error)} {...input}>
        {children}
      </select>
    </Shell>
  );
}

/** A number with minus and plus buttons. Clamps typed values when the field loses focus. */
export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  decreaseLabel,
  increaseLabel,
  step = 1,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  step?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const commit = (raw: number) => onChange(Math.min(max, Math.max(min, Number.isFinite(raw) ? Math.round(raw) : min)));
  const roundButton =
    "grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink text-xl font-bold leading-none hover:bg-ink hover:text-mist disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink";

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" className={roundButton} aria-label={decreaseLabel} disabled={value <= min} onClick={() => commit(value - step)}>
        <span aria-hidden="true">−</span>
      </button>
      <input
        ref={inputRef}
        key={value}
        type="number"
        inputMode="numeric"
        aria-label={label}
        defaultValue={value}
        min={min}
        max={max}
        className="h-11 w-14 rounded-[var(--radius-field)] border-2 border-ink bg-paper text-center font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        onBlur={(event) => commit(Number(event.target.value))}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(Number(event.currentTarget.value));
          }
        }}
      />
      <button type="button" className={roundButton} aria-label={increaseLabel} disabled={value >= max} onClick={() => commit(value + step)}>
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}

export function SubmitButton({ pending, children, pendingLabel, className = "btn btn-primary w-full sm:w-auto" }: { pending: boolean; children: ReactNode; pendingLabel: string; className?: string }) {
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Announced to screen readers when it appears. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-[var(--radius-field)] border-2 border-tomato bg-[#f8ebe7] px-4 py-3 font-medium text-[#6f1f18]">
      {children}
    </div>
  );
}
