import "server-only";

type PlatformUser = {
  email: string;
  platformRole?: string | null;
};

export function hasPlatformAdminAccess(user: PlatformUser) {
  if (user.platformRole === "admin") return true;

  const configured = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return configured.includes(user.email.trim().toLowerCase());
}
