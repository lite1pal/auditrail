# Framework Contracts

`@auditrail/framework` is the pure contract layer for future framework tooling.

It currently provides:

- generic module, route, check, agent-task, and generator-plan schemas
- a canonical resource-spec schema for future resource planning, generation, and AI-agent context commands
- the normalized contract consumed by the current dry-run planner command:
  `pnpm saas plan resource tools/saas/examples/customer.resource.json`

The resource-spec entrypoint is `frameworkResourceSpecSchema` from
`packages/framework/src/index.ts`.

Example:

```ts
frameworkResourceSpecSchema.parse({
  resource: "customer",
  label: "Customer",
  ownership: "organization",
  fields: [
    { name: "name", type: "string", required: true },
    { name: "email", type: "email", required: true, unique: true },
    {
      name: "status",
      type: "enum",
      required: true,
      values: ["active", "inactive"],
      default: "active"
    }
  ]
});
```

The schema is strict and generic:

- no AuditTrail-specific imports or product assumptions
- no filesystem, shell, env, database, HTTP, queue, or code-generation behavior
- validation for reserved resource names, duplicate fields, enum declarations,
  CRUD safety, and API-prefix shape

`normalizeFrameworkResourceSpec()` is available for pure defaulting:

- `pluralLabel` from `label`
- CRUD defaults with `delete: false`
- UI page defaults from CRUD flags
- API prefix from the resource name
- default timestamps

Current planner scope:

- reads JSON resource specs
- validates and normalizes them through `frameworkResourceSpecSchema`
- prints a grouped dry-run file plan
- does not generate files or mutate app source yet
