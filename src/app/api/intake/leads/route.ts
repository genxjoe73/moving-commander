import { createHash } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { auditLog, lead, leadIntakeToken } from "@/db/app-schema";

export const runtime = "nodejs";

const inputSchema = z.object({
  sourceMessageId: z.string().trim().max(500).optional(),
  sourceAddress: z.string().trim().max(320).optional(),
  rawText: z.string().max(100000).optional(),
  fields: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).optional(),
}).passthrough();

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseRawText(rawText: string) {
  return Object.fromEntries(rawText.split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf(":");
    return separator > 0 ? [[line.slice(0, separator).trim(), line.slice(separator + 1).trim()]] : [];
  }));
}

function valueFor(fields: Record<string, unknown>, names: string[]) {
  const entries = Object.entries(fields);
  const wanted = names.map(normalizeKey);
  return entries.find(([key, value]) => value !== null && value !== undefined && wanted.includes(normalizeKey(key)))?.[1]?.toString().trim() || null;
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "Bearer intake token required." }, { status: 401 });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [intakeToken] = await db.select().from(leadIntakeToken).where(and(eq(leadIntakeToken.tokenHash, tokenHash), eq(leadIntakeToken.active, true))).limit(1);
  if (!intakeToken) return NextResponse.json({ error: "Invalid intake token." }, { status: 401 });

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Expected a JSON lead payload." }, { status: 400 });
  const body = parsed.data;
  const fields = { ...(body.rawText ? parseRawText(body.rawText) : {}), ...(body.fields ?? {}), ...body };
  const sourceMessageId = body.sourceMessageId ?? valueFor(fields, ["messageId", "message_id", "id"]);
  if (sourceMessageId) {
    const [existing] = await db.select({ id: lead.id }).from(lead).where(and(eq(lead.organizationId, intakeToken.organizationId), eq(lead.sourceMessageId, sourceMessageId))).limit(1);
    if (existing) return NextResponse.json({ accepted: false, duplicate: true, leadId: existing.id });
  }

  const moveDateValue = valueFor(fields, ["moveDate", "movingDate", "jobDate"]);
  const moveDate = moveDateValue && /^\d{4}-\d{2}-\d{2}$/.test(moveDateValue) ? new Date(`${moveDateValue}T12:00:00`) : null;
  const [created] = await db.transaction(async (tx) => {
    const inserted = await tx.insert(lead).values({ organizationId: intakeToken.organizationId, status: "new", firstName: valueFor(fields, ["firstName", "givenName"]), lastName: valueFor(fields, ["lastName", "surname", "familyName"]), companyName: valueFor(fields, ["companyName", "company", "organization"]), email: valueFor(fields, ["email", "emailAddress"]), phone: valueFor(fields, ["phone", "telephone", "mobile"]), moveDate, originPostalCode: valueFor(fields, ["originPostalCode", "fromPostalCode", "zipFrom"]), destinationPostalCode: valueFor(fields, ["destinationPostalCode", "toPostalCode", "zipTo"]), notes: valueFor(fields, ["notes", "message", "comments"]) ?? body.rawText ?? null, sourceMessageId }).returning({ id: lead.id });
    await tx.update(leadIntakeToken).set({ lastUsedAt: new Date(), updatedAt: new Date() }).where(eq(leadIntakeToken.id, intakeToken.id));
    await tx.insert(auditLog).values({ organizationId: intakeToken.organizationId, action: "lead.received", entityType: "lead", entityId: inserted[0].id, metadata: { intakeTokenId: intakeToken.id, sourceAddress: body.sourceAddress ?? null, sourceMessageId } });
    return inserted;
  });
  return NextResponse.json({ accepted: true, leadId: created.id }, { status: 201 });
}
