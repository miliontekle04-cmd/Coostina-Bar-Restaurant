"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { brand } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import { routes, type Locale } from "@/i18n/routes";
import type { AvailabilityResult } from "@/lib/booking";
import { formatDate } from "@/lib/format";
import { bookingIcs } from "@/lib/ics";
import type { ErrorCode } from "@/lib/validation";
import { postJson } from "../forms/api";
import { FormAlert, Stepper, SubmitButton, TextArea, TextField } from "../forms/controls";

type Times = { state: "idle" | "loading" | "error" } | { state: "done"; result: AvailabilityResult };
type Confirmation = { code: string; manageUrl: string | null };

export function BookingForm({
  locale,
  initialDate,
  initialTime = "",
  minDate,
  maxDate,
}: {
  locale: Locale;
  initialDate: string;
  /** Picked in advance when it's still free, for example from the free times on the home page. */
  initialTime?: string;
  minDate: string;
  maxDate: string;
}) {
  const t = getDictionary(locale);
  const [guests, setGuests] = useState(2);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [times, setTimes] = useState<Times>({ state: "idle" });
  const [reloadKey, setReloadKey] = useState(0);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", notes: "", website: "" });
  const [errors, setErrors] = useState<Record<string, ErrorCode>>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!date) {
      setTimes({ state: "idle" });
      return;
    }
    const controller = new AbortController();
    setTimes({ state: "loading" });
    fetch(`/api/availability?date=${encodeURIComponent(date)}&guests=${guests}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const result = (await response.json()) as AvailabilityResult;
        setTimes({ state: "done", result });
        setTime((current) => (result.status === "ok" && result.slots.some((s) => s.time === current && s.available) ? current : ""));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setTimes({ state: "error" });
      });
    return () => controller.abort();
  }, [date, guests, reloadKey]);

  useEffect(() => {
    if (!confirmation) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    confirmationRef.current?.focus({ preventScroll: true });
  }, [confirmation]);

  const updateContact = useCallback(
    (field: keyof typeof contact, value: string) => {
      setContact((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (!current[field]) return current;
        const { [field]: _removed, ...rest } = current;
        return rest;
      });
    },
    [],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    const payload = { date, time, guests, ...contact, locale };
    setPending(true);
    // The rules load on first submit, which keeps the page itself light.
    const validation = await import("@/lib/validation").catch(() => null);
    if (!validation) {
      setPending(false);
      setAlert(t.apiErrors.network);
      return;
    }
    const parsed = validation.reservationSchema.safeParse(payload);
    if (!parsed.success) {
      setPending(false);
      setErrors(validation.fieldErrors(parsed.error));
      setAlert(t.apiErrors.form);
      return;
    }
    setErrors({});
    const result = await postJson<Confirmation>("/api/reservations", payload);
    setPending(false);
    if (result.ok) {
      setConfirmation(result.data);
      return;
    }
    if (result.fields) setErrors(result.fields as Record<string, ErrorCode>);
    if (result.code === "slot_taken" || result.code === "closed") setReloadKey((key) => key + 1);
    setAlert(t.apiErrors[result.code as keyof typeof t.apiErrors] ?? t.apiErrors.server);
  }

  function addToCalendar() {
    if (!confirmation) return;
    const manage = confirmation.manageUrl ? new URL(confirmation.manageUrl, window.location.origin).href : "";
    const ics = bookingIcs({
      uid: `${confirmation.code}@coostina`,
      date,
      time,
      durationMinutes: brand.booking.seatingMinutes,
      timeZone: brand.timeZone,
      summary: `${brand.fullName}, ${t.common.guests(guests)}`,
      location: `${brand.fullName}, ${brand.address.street}, ${brand.address.postalCode} ${brand.address.city}`,
      description: [`${t.book.reference}: ${confirmation.code}`, `${t.common.phone}: ${brand.phone.display}`, manage].filter(Boolean).join("\n"),
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `coostina-${date}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  function reset() {
    setConfirmation(null);
    setTime("");
    setContact({ name: "", email: "", phone: "", notes: "", website: "" });
    setReloadKey((key) => key + 1);
  }

  if (confirmation) {
    return (
      <section className="max-w-2xl rounded-2xl bg-basil p-6 text-white sm:p-10 on-dark" aria-labelledby="booking-confirmed">
        <h2 id="booking-confirmed" ref={confirmationRef} tabIndex={-1} className="display text-4xl outline-none sm:text-5xl">
          {t.book.confirmedHeading}
        </h2>
        <p className="mt-4">{t.book.confirmedBody(contact.name, contact.email)}</p>
        <dl className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold">{t.book.reference}</dt>
          <dd data-testid="booking-code" className="text-lg font-bold tracking-wide">{confirmation.code}</dd>
          <dt className="font-semibold">{t.book.when}</dt>
          <dd>
            {formatDate(date, locale)}, {time}
          </dd>
          <dt className="font-semibold">{t.book.party}</dt>
          <dd>{t.common.guests(guests)}</dd>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          {confirmation.manageUrl ? (
            <Link href={confirmation.manageUrl} className="btn btn-oil">
              {t.book.manage}
            </Link>
          ) : null}
          <button type="button" className="btn btn-outline" onClick={addToCalendar}>
            {t.book.addToCalendar}
          </button>
          <button type="button" className="btn btn-outline" onClick={reset}>
            {t.book.bookAnother}
          </button>
        </div>
        <p className="mt-4 text-[0.9375rem]">{t.book.keepLink}</p>
      </section>
    );
  }

  const slots = times.state === "done" && times.result.status === "ok" ? times.result.slots : [];
  const anyFree = slots.some((slot) => slot.available);
  const showDetails = Boolean(time);

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-10">
      <div className="flex flex-wrap items-start gap-x-10 gap-y-6">
        <div>
          <span id="party-label" className="field-label">
            {t.book.guests}
          </span>
          <div role="group" aria-labelledby="party-label">
            <Stepper
              value={guests}
              min={1}
              max={brand.booking.maxParty}
              onChange={setGuests}
              label={t.book.guests}
              decreaseLabel={t.common.decrease}
              increaseLabel={t.common.increase}
            />
          </div>
        </div>
        <TextField
          label={t.common.date}
          type="date"
          value={date}
          min={minDate}
          max={maxDate}
          onChange={(event) => setDate(event.target.value)}
          error={errors.date ? t.errors[errors.date] : undefined}
          className="w-full max-w-60"
        />
      </div>

      <p className="field-hint -mt-6">
        {t.book.largeGroup(brand.eventsPhone.display)}{" "}
        <Link className="link" href={routes.events[locale]}>
          {t.book.largeGroupLink}
        </Link>
      </p>

      <fieldset aria-busy={times.state === "loading"}>
        <legend className="display mb-4 text-3xl text-ink">{t.book.chooseTime}</legend>

        {times.state === "idle" ? <p>{t.book.chooseDate}</p> : null}

        {times.state === "loading" ? (
          <div>
            <p className="sr-only" role="status">{t.book.loadingTimes}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="skeleton h-12" />
              ))}
            </div>
          </div>
        ) : null}

        {times.state === "error" ? (
          <FormAlert>
            <span>{t.book.timesError} </span>
            <button type="button" className="link" onClick={() => setReloadKey((key) => key + 1)}>
              {t.common.tryAgain}
            </button>
          </FormAlert>
        ) : null}

        {times.state === "done" && times.result.status === "closed" ? <p role="status">{t.book.closedDay}</p> : null}
        {times.state === "done" && times.result.status === "past" ? <p role="status">{t.book.pastDay}</p> : null}
        {times.state === "done" && times.result.status === "too_far" ? <p role="status">{t.book.tooFar}</p> : null}
        {times.state === "done" && times.result.status === "ok" && !anyFree ? <p role="status">{t.book.fullDay}</p> : null}

        {slots.length > 0 && anyFree ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots.map((slot) => (
              <label
                key={slot.time}
                className={`relative grid min-h-12 place-items-center rounded-full border-2 text-center font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-lagoon ${
                  !slot.available
                    ? "cursor-not-allowed border-line text-ink-soft line-through"
                    : time === slot.time
                      ? "cursor-pointer border-ink bg-ink text-mist"
                      : "cursor-pointer border-ink hover:bg-ink/10"
                }`}
              >
                <input
                  type="radio"
                  name="time"
                  value={slot.time}
                  checked={time === slot.time}
                  disabled={!slot.available}
                  onChange={() => {
                    setTime(slot.time);
                    setAlert(null);
                  }}
                  className="absolute inset-0 cursor-[inherit] opacity-0"
                />
                {slot.time}
                {!slot.available ? <span className="sr-only"> ({t.book.unavailable})</span> : null}
              </label>
            ))}
          </div>
        ) : null}

        {errors.time ? <p className="field-error">{t.errors[errors.time]}</p> : null}
      </fieldset>

      {alert && !showDetails ? <FormAlert>{alert}</FormAlert> : null}

      {showDetails ? (
        <fieldset className="space-y-5">
          <legend className="display mb-4 text-3xl text-ink">{t.book.details}</legend>
          <TextField label={t.common.name} autoComplete="name" value={contact.name} onChange={(e) => updateContact("name", e.target.value)} error={errors.name ? t.errors[errors.name] : undefined} required />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label={t.common.email} type="email" autoComplete="email" value={contact.email} onChange={(e) => updateContact("email", e.target.value)} error={errors.email ? t.errors[errors.email] : undefined} required />
            <TextField label={t.common.phone} type="tel" autoComplete="tel" value={contact.phone} onChange={(e) => updateContact("phone", e.target.value)} error={errors.phone ? t.errors[errors.phone] : undefined} required />
          </div>
          <TextArea label={<>{t.common.notes} <span className="font-normal text-ink-soft">({t.common.optional})</span></>} hint={t.book.notesHint} value={contact.notes} onChange={(e) => updateContact("notes", e.target.value)} error={errors.notes ? t.errors[errors.notes] : undefined} />
          {/* Hidden from people. Bots that fill it in are ignored. */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={contact.website} onChange={(e) => updateContact("website", e.target.value)} />
            </label>
          </div>
          {alert ? <FormAlert>{alert}</FormAlert> : null}
          <SubmitButton pending={pending} pendingLabel={t.common.sending}>
            {t.book.submit}
          </SubmitButton>
          <p className="field-hint">{t.book.consent}</p>
        </fieldset>
      ) : null}
    </form>
  );
}
