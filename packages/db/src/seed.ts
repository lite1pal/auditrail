import { apiKeys, organizations, projects } from "./schema/index.js";
import { createDatabase } from "./client.js";

export interface SeedInput {
  databaseUrl: string;
  keyHash: string;
  keyPrefix: string;
}

export async function seedDemoProject(input: SeedInput): Promise<void> {
  const db = createDatabase(input.databaseUrl);

  const [organization] = await db
    .insert(organizations)
    .values({
      name: "AcmeCRM"
    })
    .returning({
      id: organizations.id
    });

  const [project] = await db
    .insert(projects)
    .values({
      organizationId: organization.id,
      name: "AcmeCRM Production",
      environment: "production"
    })
    .returning({
      id: projects.id
    });

  await db.insert(apiKeys).values({
    projectId: project.id,
    keyHash: input.keyHash,
    keyPrefix: input.keyPrefix,
    name: "Local development key"
  });
}
