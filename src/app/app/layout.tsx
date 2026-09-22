import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { requireTenant } from "@/lib/tenant";
import { hasPlatformAdminAccess } from "@/lib/platform-access";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const tenant = await requireTenant();
  const isPlatformAdmin = hasPlatformAdminAccess(tenant.session.user);
  return <div className="app-shell"><aside className="app-sidebar"><Link href="/app"><Image src="/site-assets/logo-on-dark.svg" alt="Moving Commander" width={360} height={57} priority /></Link><div className="tenant-chip"><span>COMPANY</span><strong>{tenant.organization.name}</strong><small>{tenant.organization.role}</small></div><nav><Link href="/app">Command Center</Link><Link href="/app/leads">Leads</Link><Link href="/app/customers">Customers</Link><Link href="/app/quotes">Quotes</Link><Link href="/app/jobs">Jobs</Link><Link href="/app/employees">Employees &amp; time</Link><Link href="/app/settings">Company Setup</Link>{isPlatformAdmin && <Link href="/platform/exit">Exit tenant view</Link>}</nav><div className="sidebar-user"><span>{tenant.session.user.name}</span><small>{tenant.session.user.email}</small><SignOutButton /></div></aside><main className="app-main">{children}</main></div>;
}
