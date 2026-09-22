import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/tenant";

export default async function SignupPage() {
  if (await getSession()) redirect("/onboarding");
  return <main className="auth-page"><section className="auth-card"><Link href="/"><Image src="/site-assets/logo-on-dark.svg" alt="Moving Commander" width={506} height={80} priority /></Link><p className="eyebrow">NEW SUBSCRIBER</p><h1>Create your secure account</h1><AuthForm mode="signup" /><p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p></section></main>;
}

