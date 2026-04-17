# 2026-04-17 Prisma Auth Baseline Research

## Sources

- Prisma config reference: `https://www.prisma.io/docs/orm/reference/prisma-config-reference`
- Prisma Auth.js and Next.js guide: `https://docs.prisma.io/docs/guides/authentication/authjs/nextjs`

## Key Takeaways

- Prisma now prefers `prisma.config.ts` over `package.json#prisma` for CLI configuration such as schema location and seed commands.
- Prisma config does not load `.env` automatically; the recommended pattern is to import `dotenv/config` explicitly.
- The Prisma and Auth.js integration guidance still relies on the canonical `User`, `Account`, `Session`, and `VerificationToken` model set for database-backed auth flows.

## Decision Impact

- OneSource now uses `prisma.config.ts` with `dotenv/config` and a configured seed command instead of deprecated package.json Prisma config.
- The initial Phase 1 schema includes `accounts`, `sessions`, and `verification_tokens` now, even though Auth.js runtime work is still scheduled for Phase 2, so later auth wiring does not require a table-shape rethink.
- Roles were kept as database rows and user-role joins instead of an enum so future admin tooling and seeded defaults can evolve without schema rewrites.

## Open Questions

- Whether the future Auth.js runtime should keep global unique emails or move to an organization-scoped identity model remains open.
- WebAuthn or authenticator support is intentionally deferred until an actual authentication feature requires it.
