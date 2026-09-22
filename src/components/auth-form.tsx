"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const result = mode === "signup"
      ? await authClient.signUp.email({ name: String(form.get("name") ?? "").trim(), email, password })
      : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? "Authentication failed.");
      setPending(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "signup" && <label>Full name<input name="name" autoComplete="name" required minLength={2} /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={12} /></label>
      {mode === "signup" && <p className="field-help">Use at least 12 characters.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={pending}>{pending ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button>
    </form>
  );
}
