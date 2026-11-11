"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">This page couldn&apos;t load</h1>
      <p className="mt-2">Your data hasn&apos;t changed. Check that the database is reachable, then try again.</p>
      <button type="button" className="btn btn-ink mt-4" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
