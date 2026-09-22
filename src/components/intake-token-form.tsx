"use client";

import { useActionState } from "react";

import { createLeadIntakeToken, type IntakeTokenState } from "@/app/actions/intake";

export function IntakeTokenForm() {
  const [state, action, pending] = useActionState(createLeadIntakeToken, null as IntakeTokenState);
  return <form action={action} className="token-form"><div className="form-row"><input name="name" placeholder="Example: website lead form" required minLength={2} /><button className="secondary-button" disabled={pending}>{pending ? "Creating…" : "Create intake token"}</button></div>{state?.error ? <p className="form-error">{state.error}</p> : null}{state?.token ? <div className="token-result"><strong>Copy this token now. It will not be shown again.</strong><code>{state.token}</code><small>Send it as an Authorization header: Bearer {state.token}</small></div> : null}</form>;
}
