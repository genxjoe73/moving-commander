import Image from "next/image";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding-form";
import { getUserOrganizations, requireUser } from "@/lib/tenant";

export default async function OnboardingPage() {
  const session = await requireUser();
  if ((await getUserOrganizations(session.user.id)).length > 0) redirect("/app");
  return <main className="auth-page"><section className="auth-card auth-card-wide"><Image src="/site-assets/logo-on-dark.svg" alt="Moving Commander" width={506} height={80} priority /><p className="eyebrow">COMPANY SETUP</p><h1>Build your tenant workspace</h1><p className="auth-intro">This creates an isolated company account, its first office, and your owner membership.</p><OnboardingForm /></section></main>;
}

