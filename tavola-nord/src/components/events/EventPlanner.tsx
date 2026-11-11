"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { brand } from "@/config/brand";
import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/routes";
import { fromMinutes } from "@/lib/booking";
import { formatDate } from "@/lib/format";
import { formatNok, summarizeEnquiry, trimAllocations } from "@/lib/pricing";
import type { ErrorCode } from "@/lib/validation";
import { BanquetPlan, seatColour } from "../art/BanquetPlan";
import { postJson } from "../forms/api";
import { FormAlert, SelectField, Stepper, SubmitButton, TextArea, TextField } from "../forms/controls";

export type PlannerMenu = { id: number; name: string; priceNok: number; starter: string; main: string; dessert: string };

const timeOptions = Array.from({ length: 21 }, (_, i) => fromMinutes(12 * 60 + i * 30));

const blankContact = { name: "", email: "", phone: "", notes: "", companyName: "", orgNumber: "", website: "" };

export function EventPlanner({ locale, menus, minDate, maxDate }: { locale: Locale; menus: PlannerMenu[]; minDate: string; maxDate: string }) {
  const t = getDictionary(locale);
  const { minGuests, maxGuests, seatsPerTable } = brand.events;

  const [guests, setGuests] = useState(24);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [allocations, setAllocations] = useState(() => menus.map((menu) => ({ menuId: menu.id, guests: 0 })));
  const [contact, setContact] = useState(blankContact);
  const [companyInvoice, setCompanyInvoice] = useState(false);
  const [errors, setErrors] = useState<Record<string, ErrorCode>>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<{ code: string } | null>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);

  const summary = useMemo(() => summarizeEnquiry(guests, allocations, menus), [guests, allocations, menus]);
  const groups = allocations.map((allocation, index) => ({ guests: allocation.guests, colour: seatColour(index) }));
  const tableCount = Math.max(1, Math.ceil(guests / seatsPerTable));

  useEffect(() => {
    if (!sent) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    sentRef.current?.focus({ preventScroll: true });
  }, [sent]);

  function changeGuests(next: number) {
    const clamped = Math.min(maxGuests, Math.max(minGuests, next));
    setGuests(clamped);
    setAllocations((current) => trimAllocations(clamped, current));
  }

  function setMenuGuests(menuId: number, next: number) {
    setAllocations((current) => current.map((a) => (a.menuId === menuId ? { ...a, guests: next } : a)));
  }

  function field(name: keyof typeof blankContact, value: string) {
    setContact((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const { [name]: _removed, ...rest } = current;
      return rest;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    const payload = {
      guests,
      date,
      time,
      allocations: allocations.filter((a) => a.guests > 0),
      companyInvoice,
      locale,
      ...contact,
    };
    setPending(true);
    // The rules load on first submit, which keeps the page itself light.
    const validation = await import("@/lib/validation").catch(() => null);
    if (!validation) {
      setPending(false);
      setAlert(t.apiErrors.network);
      return;
    }
    const parsed = validation.enquirySchema.safeParse(payload);
    if (!parsed.success) {
      setPending(false);
      setErrors(validation.fieldErrors(parsed.error));
      setAlert(t.apiErrors.form);
      return;
    }
    setErrors({});
    const result = await postJson<{ code: string }>("/api/enquiries", payload);
    setPending(false);
    if (result.ok) {
      setSent(result.data);
      return;
    }
    if (result.fields) setErrors(result.fields as Record<string, ErrorCode>);
    setAlert(t.apiErrors[result.code as keyof typeof t.apiErrors] ?? t.apiErrors.server);
  }

  function reset() {
    setSent(null);
    setDate("");
    setTime("");
    setContact(blankContact);
    setCompanyInvoice(false);
    setAllocations(menus.map((menu) => ({ menuId: menu.id, guests: 0 })));
  }

  if (sent) {
    return (
      <section className="on-dark max-w-2xl rounded-2xl bg-basil p-6 text-white sm:p-10" aria-labelledby="enquiry-sent">
        <h2 id="enquiry-sent" ref={sentRef} tabIndex={-1} className="display text-4xl outline-none sm:text-5xl">
          {t.events.sentHeading}
        </h2>
        <p className="mt-4">{t.events.sentBody(contact.email)}</p>
        <dl className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold">{t.book.reference}</dt>
          <dd data-testid="enquiry-code" className="text-lg font-bold tracking-wide">{sent.code}</dd>
          <dt className="font-semibold">{t.book.when}</dt>
          <dd>
            {formatDate(date, locale)}
            {time ? `, ${time}` : ""}
          </dd>
          <dt className="font-semibold">{t.events.guestsLabel}</dt>
          <dd>{guests}</dd>
          {summary.totalNok > 0 ? (
            <>
              <dt className="font-semibold">{t.events.estimate}</dt>
              <dd>{formatNok(summary.totalNok, locale)}</dd>
            </>
          ) : null}
        </dl>
        <button type="button" className="btn btn-outline mt-8" onClick={reset}>
          {t.events.sendAnother}
        </button>
      </section>
    );
  }

  const sectionHeading = "display mb-4 text-3xl text-ink";

  return (
    <form onSubmit={submit} noValidate aria-labelledby="enquiry-form-heading" className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,1fr)_25rem]">
      <h2 id="enquiry-form-heading" className="sr-only">
        {t.events.formHeading}
      </h2>

      <div className="min-w-0 space-y-12">
        <fieldset>
          <legend className={sectionHeading}>{t.events.guestsHeading}</legend>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label htmlFor="guest-slider" className="sr-only">
              {t.events.guestsLabel}
            </label>
            <input
              id="guest-slider"
              type="range"
              className="slider min-w-52 flex-1"
              min={minGuests}
              max={maxGuests}
              value={guests}
              aria-valuetext={t.common.guests(guests)}
              onChange={(event) => changeGuests(Number(event.target.value))}
            />
            <Stepper
              value={guests}
              min={minGuests}
              max={maxGuests}
              onChange={changeGuests}
              label={t.events.guestsLabel}
              decreaseLabel={t.common.decrease}
              increaseLabel={t.common.increase}
            />
          </div>
          {errors.guests ? <p className="field-error">{t.errors[errors.guests]}</p> : null}
        </fieldset>

        <fieldset>
          <legend className={sectionHeading}>{t.events.whenHeading}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label={t.common.date}
              type="date"
              required
              value={date}
              min={minDate}
              max={maxDate}
              onChange={(event) => {
                setDate(event.target.value);
                setErrors(({ date: _removed, ...rest }) => rest);
              }}
              error={errors.date ? t.errors[errors.date] : undefined}
            />
            <SelectField label={t.common.time} value={time} onChange={(event) => setTime(event.target.value)}>
              <option value="">{t.events.timeUnknown}</option>
              {timeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </SelectField>
          </div>
        </fieldset>

        <fieldset>
          <legend className={sectionHeading}>{t.events.menusHeading}</legend>
          <p className="mb-5 max-w-prose">{t.events.menusHelp}</p>
          {/* Phones show the full summary further down, so this keeps the numbers in view. The summary announces changes. */}
          <div aria-hidden="true" className="on-dark sticky top-2 z-10 mb-4 flex justify-between gap-3 rounded-full bg-ink px-4 py-2 text-[0.9375rem] font-semibold text-mist lg:hidden">
            <span>{t.events.allocated(summary.allocated, guests)}</span>
            <span>{summary.totalNok > 0 ? formatNok(summary.totalNok, locale) : ""}</span>
          </div>
          {menus.length === 0 ? <p className="field-hint">{t.events.menusError}</p> : null}
          <ul className="grid gap-4 sm:grid-cols-2">
            {menus.map((menu, index) => {
              const allocated = allocations[index]?.guests ?? 0;
              const remaining = guests - summary.allocated;
              return (
                <li key={menu.id} className="flex flex-col rounded-2xl border-2 border-ink bg-paper p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-xl font-bold">
                      <span aria-hidden="true" className="inline-block size-4 shrink-0 rounded-full" style={{ background: seatColour(index) }} />
                      {menu.name}
                    </h3>
                    <p className="whitespace-nowrap font-semibold">
                      {formatNok(menu.priceNok, locale)}
                      <span className="sr-only"> {t.common.perPerson}</span>
                    </p>
                  </div>
                  <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.9375rem]">
                    <dt className="text-ink-soft">{t.events.starter}</dt>
                    <dd>{menu.starter}</dd>
                    <dt className="text-ink-soft">{t.events.main}</dt>
                    <dd>{menu.main}</dd>
                    <dt className="text-ink-soft">{t.events.dessert}</dt>
                    <dd>{menu.dessert}</dd>
                  </dl>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                    <Stepper
                      value={allocated}
                      min={0}
                      max={allocated + Math.max(remaining, 0)}
                      onChange={(next) => setMenuGuests(menu.id, next)}
                      label={t.events.guestsFor(menu.name)}
                      decreaseLabel={`${t.common.decrease}: ${menu.name}`}
                      increaseLabel={`${t.common.increase}: ${menu.name}`}
                    />
                    <button
                      type="button"
                      className="link min-h-11 text-left text-[0.9375rem] disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
                      disabled={remaining <= 0}
                      onClick={() => setMenuGuests(menu.id, allocated + remaining)}
                    >
                      {t.events.giveRest}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {errors.allocations ? <p className="field-error">{t.errors[errors.allocations]}</p> : null}
        </fieldset>

        <fieldset className="space-y-5">
          <legend className={sectionHeading}>{t.events.contactHeading}</legend>
          <TextField label={t.common.name} autoComplete="name" required value={contact.name} onChange={(e) => field("name", e.target.value)} error={errors.name ? t.errors[errors.name] : undefined} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label={t.common.email} type="email" autoComplete="email" required value={contact.email} onChange={(e) => field("email", e.target.value)} error={errors.email ? t.errors[errors.email] : undefined} />
            <TextField label={t.common.phone} type="tel" autoComplete="tel" required value={contact.phone} onChange={(e) => field("phone", e.target.value)} error={errors.phone ? t.errors[errors.phone] : undefined} />
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
            <input type="checkbox" className="size-5 accent-[var(--color-tomato)]" checked={companyInvoice} onChange={(e) => setCompanyInvoice(e.target.checked)} />
            {t.events.companyInvoice}
          </label>
          {companyInvoice ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label={t.events.companyName} autoComplete="organization" required value={contact.companyName} onChange={(e) => field("companyName", e.target.value)} error={errors.companyName ? t.errors[errors.companyName] : undefined} />
              <TextField label={t.events.orgNumber} inputMode="numeric" required value={contact.orgNumber} onChange={(e) => field("orgNumber", e.target.value)} error={errors.orgNumber ? t.errors[errors.orgNumber] : undefined} />
            </div>
          ) : null}
          <TextArea label={<>{t.common.notes} <span className="font-normal text-ink-soft">({t.common.optional})</span></>} hint={t.events.notesHint} value={contact.notes} onChange={(e) => field("notes", e.target.value)} error={errors.notes ? t.errors[errors.notes] : undefined} />
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={contact.website} onChange={(e) => field("website", e.target.value)} />
            </label>
          </div>
        </fieldset>
      </div>

      <aside aria-label={t.events.summary} className="on-dark rounded-2xl bg-ink p-6 text-mist lg:sticky lg:top-6">
        <h3 className="display text-2xl text-oil">{t.events.planHeading}</h3>
        <div className="mt-4 max-h-[22rem] overflow-y-auto rounded-xl bg-white/5 p-3">
          <BanquetPlan guests={guests} groups={groups} onDark className="mx-auto block w-full" />
        </div>

        <div role="status" aria-live="polite" className="mt-4 space-y-3">
          <p className="flex justify-between gap-3 font-semibold">
            <span>{t.common.guests(guests)}</span>
            <span>{t.events.tables(tableCount)}</span>
          </p>
          <p>{t.events.allocated(summary.allocated, guests)}</p>

          <ul className="space-y-1 text-[0.9375rem]">
            {menus.map((menu, index) => {
              const count = allocations[index]?.guests ?? 0;
              if (count === 0) return null;
              return (
                <li key={menu.id} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="inline-block size-3 rounded-full ring-1 ring-white/60" style={{ background: seatColour(index) }} />
                    {count} × {menu.name}
                  </span>
                  <span>{formatNok(count * menu.priceNok, locale)}</span>
                </li>
              );
            })}
            {summary.undecided > 0 && summary.allocated > 0 ? <li className="text-mist/85">{t.events.undecided(summary.undecided)}</li> : null}
          </ul>

          <div className="border-t border-white/25 pt-3">
            {summary.totalNok > 0 ? (
              <>
                <p className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{t.events.estimate}</span>
                  <span data-testid="estimate" className="text-2xl font-bold">{formatNok(summary.totalNok, locale)}</span>
                </p>
                <p className="flex justify-between gap-3 text-[0.9375rem]">
                  <span>{t.events.average}</span>
                  <span>{formatNok(summary.averageNok ?? 0, locale)}</span>
                </p>
              </>
            ) : (
              <p>{t.events.noEstimate}</p>
            )}
            <p className="mt-2 text-[0.9375rem] text-mist/85">{t.events.estimateNote}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {alert ? <FormAlert>{alert}</FormAlert> : null}
          <SubmitButton pending={pending} pendingLabel={t.common.sending} className="btn btn-primary w-full">
            {t.events.submit}
          </SubmitButton>
          <p className="text-center text-[0.9375rem] text-mist/85">{t.events.noCommit}</p>
        </div>
      </aside>
    </form>
  );
}
