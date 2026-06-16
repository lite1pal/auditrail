import { hashApiKey, parseApiKey } from "../apps/api/src/modules/api-keys/keys.js";
import { loadConfig } from "../apps/api/src/config.js";
import { loadEnvFiles } from "../apps/api/src/env-files.js";
import { seedDemoProject } from "../packages/db/src/seed.js";

const config = loadConfig(loadEnvFiles());
const databaseUrl = config.DATABASE_URL;
const apiKey = process.env.SEED_API_KEY ?? "atl_local_dev_key";
const pepper = config.API_KEY_PEPPER;
const parsed = parseApiKey(apiKey, pepper);

async function main() {
  await seedDemoProject({
    databaseUrl,
    keyPrefix: parsed.prefix,
    keyHash: hashApiKey(apiKey, pepper)
  });

  console.log(`Seeded AcmeCRM demo project with API key: ${apiKey}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
