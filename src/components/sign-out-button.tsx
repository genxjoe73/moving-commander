"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return <button className="text-button" onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { router.push("/"); router.refresh(); } } })}>Sign out</button>;
}
