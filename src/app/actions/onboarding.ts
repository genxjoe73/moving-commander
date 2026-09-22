"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { office, organizationProfile } from "@/db/app-schema";
import { auditLog } from "@/db/app-schema";
import { auth } from "@/lib/auth";
import { getUserOrganizations, requireUser } from "@/lib/tenant";

const tenantSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().transform((value) => value.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").replace(/\.$/, "")).pipe(z.string().min(2).max(80).regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/, { message: "Enter a supported domain address, such as www.joesmoving.com." })),
  phone: z.string().trim().max(30).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(40).optional(),
});

export type OnboardingState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

export async function createTenant(_state: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const session = await requireUser();
  const existing = await getUserOrganizations(session.user.id);
  if (existing.length > 0) redirect("/app");

  const parsed = tenantSchema.safeParse({
    companyName: formData.get("companyName"),
    slug: formData.get("slug"),
    phone: formData.get("phone") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  try {
    const requestHeaders = await headers();
    const created = await auth.api.createOrganization({
      body: {
        name: parsed.data.companyName,
        slug: parsed.data.slug,
        metadata: { product: "moving-commander" },
      },
      headers: requestHeaders,
    });

    await db.transaction(async (tx) => {
      await tx.insert(organizationProfile).values({
        organizationId: created.id,
        legalName: parsed.data.companyName,
        phone: parsed.data.phone,
        city: parsed.data.city,
        state: parsed.data.state,
        enabledModules: ["leads", "customers", "quotes", "jobs"],
      });
      await tx.insert(office).values({
        organizationId: created.id,
        name: "Main Office",
        phone: parsed.data.phone,
        city: parsed.data.city,
        state: parsed.data.state,
        isPrimary: true,
      });
      await tx.insert(auditLog).values({
        organizationId: created.id,
        userId: session.user.id,
        action: "organization.created",
        entityType: "organization",
        entityId: created.id,
        metadata: { slug: created.slug },
      });
    });
  } catch (error) {
    const message = error instanceof Error && error.message.toLowerCase().includes("slug")
      ? "That company URL is already in use. Choose another."
      : "We could not create the company workspace. Please try again.";
    return { error: message };
  }

  redirect("/app");
}

export async function completeOnboarding() {
  const { organization } = await import("@/lib/tenant").then(({ requireTenantRole }) => requireTenantRole(["owner", "admin"]));
  await db.update(organizationProfile).set({ onboardingStep: 5, onboardingCompletedAt: new Date() }).where(eq(organizationProfile.organizationId, organization.id));
  redirect("/app/settings");
}
