"use client";

import { startTransition, useActionState } from "react";
import { FormAlert, SubmitButton, TextField } from "@/components/forms/controls";
import { login, type LoginState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form
      action={action}
      // Submitting by hand stops React from clearing the fields when the login fails.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-5"
    >
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      <TextField label="Email" name="email" type="email" autoComplete="username" required />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton pending={pending} pendingLabel="Logging in" className="btn btn-primary w-full">
        Log in
      </SubmitButton>
    </form>
  );
}
