import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadsWorkspace } from "@/components/leads-workspace";
import { CustomersWorkspace } from "@/components/customers-workspace";
import { QuotesWorkspace } from "@/components/quotes-workspace";
import { JobsWorkspace } from "@/components/jobs-workspace";
import { requireTenant } from "@/lib/tenant";

const modules: Record<string, { title: string; description: string }> = {
  leads: { title: "Leads", description: "Capture, qualify, assign, and convert incoming opportunities." },
  customers: { title: "Customers", description: "Tenant-owned customer records and communication history." },
  quotes: { title: "Quotes", description: "Compliant estimates driven by company rate sheets and tariff rules." },
  jobs: { title: "Jobs", description: "Scheduling, dispatch, crews, documents, payments, and completion." },
};

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (module === "leads") return <LeadsWorkspace />;
  if (module === "customers") return <CustomersWorkspace />;
  if (module === "quotes") return <QuotesWorkspace />;
  if (module === "jobs") return <JobsWorkspace />;
  await requireTenant();
  const item = modules[module];
  if (!item) notFound();
  return <><header className="app-header"><div><p className="eyebrow">OPERATIONAL MODULE</p><h1>{item.title}</h1><p>{item.description}</p></div></header><section className="empty-state"><h2>{item.title} foundation is connected</h2><p>The tenant-scoped database table, authorization boundary, navigation, and legacy import keys are ready. The workflow UI is the next implementation slice.</p><Link className="secondary-button" href="/app">Back to command center</Link></section></>;
}
