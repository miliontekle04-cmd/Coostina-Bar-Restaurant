"use client";

import { useActionState, useEffect, useRef } from "react";
import { addEvent, type EventState } from "@/app/admin/actions";
import { SaveButton } from "@/components/admin/SaveButton";
import { getDictionary } from "@/i18n/dictionaries";

const kindLabels = getDictionary("en").home.eventKinds;
const eventKinds = Object.keys(kindLabels) as (keyof typeof kindLabels)[];

export function EventForm({ today }: { today: string }) {
  const [state, action] = useActionState<EventState, FormData>(addEvent, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.saved) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="mt-4 grid max-w-3xl gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="ev-kind" className="field-label">Type</label>
        <select id="ev-kind" name="kind" className="input" defaultValue="karaoke">
          {eventKinds.map((kind) => (
            <option key={kind} value={kind}>{kindLabels[kind]}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ev-date" className="field-label">Date</label>
          <input id="ev-date" name="date" type="date" min={today} required className="input" />
        </div>
        <div>
          <label htmlFor="ev-time" className="field-label">Starts</label>
          <input id="ev-time" name="startTime" type="time" required className="input" defaultValue="20:00" />
        </div>
      </div>
      <div>
        <label htmlFor="ev-title-nb" className="field-label">Title (Norwegian)</label>
        <input id="ev-title-nb" name="titleNb" required maxLength={80} className="input" placeholder="Karaokekveld" />
      </div>
      <div>
        <label htmlFor="ev-title-en" className="field-label">Title (English, optional)</label>
        <input id="ev-title-en" name="titleEn" maxLength={80} className="input" placeholder="Karaoke night" />
      </div>
      <div>
        <label htmlFor="ev-desc-nb" className="field-label">Short description (Norwegian, optional)</label>
        <textarea id="ev-desc-nb" name="descriptionNb" maxLength={300} rows={2} className="input" />
      </div>
      <div>
        <label htmlFor="ev-desc-en" className="field-label">Short description (English, optional)</label>
        <textarea id="ev-desc-en" name="descriptionEn" maxLength={300} rows={2} className="input" />
      </div>
      <div>
        <label htmlFor="ev-repeat" className="field-label">Repeat weekly</label>
        <select id="ev-repeat" name="repeatWeeks" className="input" defaultValue="0">
          <option value="0">Just this date</option>
          {[3, 7, 11, 25].map((n) => (
            <option key={n} value={n}>The same day for {n + 1} weeks</option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-4">
        <SaveButton className="btn btn-primary">Add to What&apos;s on</SaveButton>
        <p role="status" className="pb-2">
          {state.error ? <span className="text-tomato">{state.error}</span> : state.saved ? `Added ${state.saved} ${state.saved === 1 ? "date" : "dates"}.` : null}
        </p>
      </div>
    </form>
  );
}
