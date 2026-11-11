"use client";

import { startTransition, useActionState } from "react";
import { saveMenuItem, type MenuItemState } from "@/app/admin/actions";
import { plateArts } from "@/components/art/PlateArt";
import { FormAlert, SelectField, SubmitButton, TextArea, TextField } from "@/components/forms/controls";
import type { MenuItem } from "@/db/schema";
import { getDictionary } from "@/i18n/dictionaries";
import { menuCategories } from "@/lib/menu-filter";

export function MenuItemForm({ item }: { item?: MenuItem }) {
  const t = getDictionary("en");
  const [state, action, pending] = useActionState<MenuItemState, FormData>(saveMenuItem, {});

  return (
    <form
      action={action}
      // Submitting by hand stops React from clearing the form when saving fails.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      className="max-w-2xl space-y-5"
    >
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <TextField label="Name" name="name" defaultValue={item?.name} required maxLength={120} />
      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField label="Category" name="category" defaultValue={item?.category ?? "starters"}>
          {menuCategories.map((category) => (
            <option key={category} value={category}>{t.menu.categories[category]}</option>
          ))}
        </SelectField>
        <TextField label="Price (kr)" name="priceNok" type="number" min={0} defaultValue={item?.priceNok} required />
        <SelectField label="Illustration" name="art" defaultValue={item?.art ?? "antipasti"}>
          {plateArts.map((art) => (
            <option key={art} value={art}>{art}</option>
          ))}
        </SelectField>
      </div>
      <TextArea label="Description (Norwegian)" name="descriptionNb" defaultValue={item?.descriptionNb} maxLength={500} />
      <TextArea label="Description (English)" name="descriptionEn" defaultValue={item?.descriptionEn} maxLength={500} />
      <fieldset>
        <legend className="field-label">Allergens</legend>
        <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
          {Object.entries(t.menu.allergens).map(([key, label]) => (
            <label key={key} className="flex min-h-11 items-center gap-2">
              <input type="checkbox" name="allergens" value={key} defaultChecked={item?.allergens.includes(key)} className="size-5" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="field-label">Details</legend>
        <div className="grid grid-cols-2 gap-x-4">
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="vegetarian" defaultChecked={item?.vegetarian} className="size-5" />
            Vegetarian
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="glutenFree" defaultChecked={item?.glutenFree} className="size-5" />
            Gluten-free
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="featured" defaultChecked={item?.featured} className="size-5" />
            Show on the home page
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="available" defaultChecked={item?.available ?? true} className="size-5" />
            Show on the menu
          </label>
        </div>
      </fieldset>
      <SubmitButton pending={pending} pendingLabel="Saving">
        {item ? "Save changes" : "Add dish"}
      </SubmitButton>
    </form>
  );
}
