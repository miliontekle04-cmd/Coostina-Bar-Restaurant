"use client";

import Link from "next/link";
import { useState } from "react";
import { getDictionary } from "@/i18n/dictionaries";
import { routes, type Locale } from "@/i18n/routes";
import { postJson } from "../forms/api";
import { FormAlert, SubmitButton } from "../forms/controls";

export function ManageBooking({ locale, token, initialStatus, cancellable }: { locale: Locale; token: string; initialStatus: string; cancellable: boolean }) {
  const t = getDictionary(locale);
  const [status, setStatus] = useState(initialStatus);
  const [justCancelled, setJustCancelled] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  async function cancel() {
    setPending(true);
    setAlert(null);
    const result = await postJson<{ status: string }>("/api/reservations/cancel", { token });
    setPending(false);
    if (result.ok) {
      setStatus("cancelled");
      setJustCancelled(true);
      return;
    }
    if (result.code === "too_late") {
      setAlert(t.manage.tooLate);
      return;
    }
    setAlert(t.apiErrors[result.code as keyof typeof t.apiErrors] ?? t.apiErrors.server);
  }

  if (status === "cancelled") {
    return (
      <div className="space-y-4">
        <p role="status" className="font-semibold">
          {justCancelled ? t.manage.cancelledNow : t.manage.cancelled}
        </p>
        <Link href={routes.book[locale]} className="btn btn-primary">
          {t.manage.bookNew}
        </Link>
      </div>
    );
  }

  if (!cancellable) return <p>{t.manage.tooLate}</p>;

  return (
    <div className="space-y-4">
      {alert ? <FormAlert>{alert}</FormAlert> : null}
      {confirming ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void cancel();
          }}
          className="space-y-3"
        >
          <p className="font-semibold">{t.manage.confirmQuestion}</p>
          <div className="flex flex-wrap gap-3">
            <SubmitButton pending={pending} pendingLabel={t.manage.cancelling} className="btn btn-primary">
              {t.manage.confirmYes}
            </SubmitButton>
            <button type="button" className="btn btn-outline" onClick={() => setConfirming(false)}>
              {t.manage.confirmNo}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-outline" onClick={() => setConfirming(true)}>
          {t.manage.cancel}
        </button>
      )}
    </div>
  );
}
