import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/platform";

export async function GET() {
  await requirePlatformAdmin();
  (await cookies()).delete("mc_platform_tenant");
  redirect("/platform");
}
