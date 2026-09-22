"use client";

import { useActionState } from "react";

import { createTenant, type OnboardingState } from "@/app/actions/onboarding";

export function OnboardingForm() {
  const [state, action, pending] = useActionState(createTenant, null as OnboardingState);
  return (
    <form className="auth-form" action={action}>
      <label>Company name<input name="companyName" required minLength={2} /></label>
      <label>Company URL<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="brent-davis-moving" /></label>
      <p className="field-help">Lowercase letters, numbers, and hyphens.</p>
      <label>Phone<input name="phone" type="tel" autoComplete="tel" /></label>
      <div className="form-row"><label>City<input name="city" autoComplete="address-level2" /></label><label>State<input name="state" autoComplete="address-level1" /></label></div>
      {state?.fieldErrors && <p className="form-error">Please check the company name and URL.</p>}
      {state?.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="primary-button" disabled={pending}>{pending ? "Creating workspace…" : "Create company workspace"}</button>
    </form>
  );
}

