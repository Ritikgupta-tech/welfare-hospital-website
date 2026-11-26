## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Database & Cloud Backend (Neon / Lakebase Postgres)

- Provider: Neon PostgreSQL (`ep-proud-tree-bezkjk7d-pooler.c-9.us-east-2.aws.neon.tech`)
- Project Identifier: `calm-term-32636029`
- Schema & Config: `prisma/schema.prisma`, `prisma.config.ts`, `src/lib/db/prisma.ts`
- Migrations: `npm run db:migrate` (executes `prisma/migrations/0_init/migration.sql`)
- Data Seeding: `npm run db:seed` (executes `src/lib/db/migrate.ts`)
- Automated Setup: `npm run db:setup` or `node scripts/deploy-database.mjs`

