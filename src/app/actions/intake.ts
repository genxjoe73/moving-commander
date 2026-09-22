"use server";

import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

import { db } from "@/db";
import { auditLog, leadIntakeToken } from "@/db/app-schema";
import { requireTenantRole } from "@/lib/tenant";

export type IntakeTokenState = { error?: string; token?: string } | null;

export async function createLeadIntakeToken(_state: IntakeTokenState, formData: FormData): Promise<IntakeTokenState> {
  const tenant = await requireTenantRole(["owner", "admin"]);
  const name = z.string().trim().min(2).max(80).safeParse(formData.get("name"));
  if (!name.success) return { error: "Give this intake connection a name." };

  const token = `mc_live_${randomBytes(24).toString("base64url")}`;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [created] = await db.insert(leadIntakeToken).values({ organizationId: tenant.organization.id, createdByUserId: tenant.session.user.id, name: name.data, tokenHash }).returning({ id: leadIntakeToken.id });
  await db.insert(auditLog).values({ organizationId: tenant.organization.id, userId: tenant.session.user.id, action: "lead_intake_token.created", entityType: "lead_intake_token", entityId: created.id, metadata: { name: name.data } });
  return { token };
}
