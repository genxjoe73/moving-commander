import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/tenant";

export default async function LoginPage() {
  if (await getSession()) redirect("/app");
  return <main className="auth-page"><section className="auth-card"><Link href="/"><Image src="/site-assets/logo-on-dark.svg" alt="Moving Commander" width={506} height={80} priority /></Link><p className="eyebrow">CUSTOMER ACCESS</p><h1>Sign in to your company</h1><AuthForm mode="login" /><p className="auth-switch">Setting up a new company? <Link href="/signup">Create an account</Link></p></section></main>;
}

