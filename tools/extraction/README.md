# Extraction Manifest

`tools/extraction/manifest.ts` is a machine-readable advisory manifest for a
future SaaS boilerplate extraction.

`tools/extraction/dry-run.ts` is the read-only planner that validates the
current repo tree against that manifest and prints what a future extraction
would copy, exclude, template, or stop for manual review.

What it does:

- records which paths are intended to copy into a future boilerplate
- records which paths must stay in the AuditTrail product repo
- records which paths need templating or explicit manual review
- prints a deterministic dry-run plan without copying files

What it does not do:

- it does not copy files
- it does not modify the repo
- it does not mean extraction is currently supported
- it does not generate a boilerplate repo directory

Commands:

```bash
pnpm check:extraction-manifest
pnpm check:extraction
pnpm test:extraction
```

Rules for a future extraction script:

- fail closed on unknown or unclassified paths
- copy product-specific code only when the manifest explicitly marks it as a template replacement
- require manual review for mixed ownership, aggregated exports, migrations, docs, and deployment config
- preserve the platform boundary rule that `platform-core` and
  `platform-extension` code must remain free of AuditTrail product imports

`pnpm check:extraction-manifest` validates manifest structure only.

`pnpm check:extraction` runs the dry-run planner. It fails when:

- a required manifest entry matches nothing
- one file resolves to conflicting primary actions without the explicit template-over-exclude rule
- a tracked file under the monitored app, package, tool, or docs roots is unclassified
- a product-specific path leaks into the boilerplate copy set
