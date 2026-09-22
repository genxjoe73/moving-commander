"use client";

import { useActionState } from "react";

import { createLead, type LeadActionState } from "@/app/actions/leads";

const initialState: LeadActionState = null;

export function LeadForm() {
  const [state, action, pending] = useActionState(createLead, initialState);

  return <form action={action} className="record-form">
    <div className="form-row">
      <label>First name<input name="firstName" autoComplete="given-name" />{state?.fieldErrors?.firstName?.map((error) => <small className="field-error" key={error}>{error}</small>)}</label>
      <label>Last name<input name="lastName" autoComplete="family-name" /></label>
    </div>
    <label>Company<input name="companyName" autoComplete="organization" /></label>
    <div className="form-row">
      <label>Email<input name="email" type="email" autoComplete="email" />{state?.fieldErrors?.email?.map((error) => <small className="field-error" key={error}>{error}</small>)}</label>
      <label>Phone<input name="phone" type="tel" autoComplete="tel" /></label>
    </div>
    <div className="form-row">
      <label>Move date<input name="moveDate" type="date" /></label>
      <label>Origin ZIP<input name="originPostalCode" inputMode="numeric" /></label>
    </div>
    <label>Destination ZIP<input name="destinationPostalCode" inputMode="numeric" /></label>
    <label>Notes<textarea name="notes" rows={4} /></label>
    {state?.error ? <p className="form-error">{state.error}</p> : null}
    <button className="primary-button" disabled={pending}>{pending ? "Saving…" : "Create lead"}</button>
  </form>;
}
