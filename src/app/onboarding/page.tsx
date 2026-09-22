import Image from "next/image";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding-form";
import { SignOutButton } from "@/components/sign-out-button";
import { hasPlatformAdminAccess } from "@/lib/platform-access";
import { getUserOrganizations, requireUser } from "@/lib/tenant";

export default async function OnboardingPage() {
  const session = await requireUser();
  const memberships = await getUserOrganizations(session.user.id);
  if (memberships.length > 0) redirect("/app");
  if (hasPlatformAdminAccess(session.user)) redirect("/platform");
  return <main className="auth-page"><section className="auth-card auth-card-wide"><Image src="/site-assets/logo-on-dark.svg" alt="Moving Commander" width={506} height={80} priority /><div className="auth-card-topline"><p className="eyebrow">COMPANY SETUP</p><SignOutButton /></div><h1>Build your tenant workspace</h1><p className="auth-intro">This creates an isolated company account, its first office, and your owner membership.</p><OnboardingForm /></section></main>;
}
