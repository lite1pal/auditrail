import { loadConfig } from "../apps/api/src/config.js";
import { loadEnvFiles } from "../apps/api/src/env-files.js";
import { seedDemoProject } from "../packages/db/src/seed.js";

const config = loadConfig(loadEnvFiles());
const databaseUrl = config.DATABASE_URL;

async function main() {
  const result = await seedDemoProject({ databaseUrl });

  console.log(
    `Seeded AcmeCRM demo project (${result.organizationId}/${result.projectId}). Create an API key from the dashboard before calling protected API routes.`
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
