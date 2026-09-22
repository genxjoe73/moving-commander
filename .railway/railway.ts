import { defineRailway, github, preserve, project, service } from "railway/iac";

// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "moving-commander";

export default defineRailway(() => {
  const moving_commander = service("moving-commander", {
    source: github("genxjoe73/moving-commander"),
    build: "npm run build",
    start: "npm run start",
    healthcheck: "/api/health",
    healthcheckTimeout: 120,
    preDeploy: "npm run db:migrate",
    env: {
      BETTER_AUTH_SECRET: preserve(),
      BETTER_AUTH_URL: preserve(),
      DATABASE_URL: preserve(),
      NEXT_PUBLIC_APP_URL: preserve(),
      PLATFORM_ADMIN_EMAILS: preserve(),
    },
  });
  return project("moving-commander", {
    resources: [moving_commander],
  });
});
