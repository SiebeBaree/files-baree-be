# files-baree-be

files.baree.be is a personal file host for sharing files in GitHub PRs. An agent PUTs a filename and byte size to `/` with a bearer token, gets back `upload_url` (a presigned R2 PUT) and `public_url`, uploads the bytes straight to Cloudflare R2 and links `public_url` in the PR. Names survive the trip slugified with a random hex suffix, so `login-flow.png` becomes `login-flow-b6f9ac.png`. The owner also gets a Notion-style drive at `/`, behind a login, to upload by hand and to browse, preview and delete files.

The app is a Next.js project on Vercel with two route handlers and the drive page. The file itself never passes through the app (Vercel caps request bodies at 4.5 MB): the upload route and the drive only validate and presign, and `GET /<key>` serves a file by redirecting to a short-lived presigned R2 GET so the bucket stays private. The 500 MB limit is enforced by signing Content-Length into the upload URL. Uploads are capped at 50 GB per calendar month. Error responses are written for the AI agents doing the uploads: every one states what was wrong and how to fix it.

## Principles

- Yagni. Fight for the smallest change that makes the behavior correct. Do not add abstractions for imagined futures and do not preserve complexity just because it exists.
- Typesafety over defensiveness. `any` is banned (lint enforced). Let inference flow; if you fight the types, the design is probably wrong.
- Routes compose, features implement. A page awaits queries and renders feature components. When a page grows logic, move that logic into the feature.
- A lib entry starts as a single file. The moment it needs a test or a second file, it becomes a folder with the test inside.
- Comments only for what the code cannot show: framework magic, security trade-offs, policy, traps. Never restate the code. No em-dashes and no oxford commas anywhere, including comments.
- Run `pnpm typecheck && pnpm lint && pnpm test && pnpm format` before finishing any change. Lint warnings fail the build on purpose.
- Do not create documentation files (README, docs/) unless explicitly asked.

## Glossary

- **Feature**: a vertical slice under `features/` owning its schema and logic. Client components import siblings directly; the feature barrel is server-only.
- **Page**: a route file under `app/`. Thin on purpose: it awaits queries and renders feature components. A new page should contain nothing else.
- **Route handler**: an API endpoint under `app/api`. It authenticates, validates with the feature's schema and answers JSON. Error bodies are the API's documentation for agents, keep them specific and actionable.
- **Schema**: the Zod schema in a feature. One schema validates the request; its error messages are part of the API contract.

## Observability

Vercel's request and function logs are the only observability. Do not add logging, analytics or error tracking SDKs without a demonstrated need.

## Testing: when and what

Test the things that can be wrong in interesting ways. Zod schema edges and real logic like object key generation get colocated Vitest tests. Route handlers and presigning have no honest unit-test story (mocking R2 proves nothing), so verify them against a deployed preview with curl. Do not write smoke tests that assert a page renders, regression tests for deleted features or tests that mock half the app; if a unit test needs heavy infrastructure mocking, the seam is wrong, move the logic. A fixed bug earns a regression test only when the bug was real logic, not glue.

## Things you need to know

- Every page renders dynamically because the CSP nonce requires a per-request render. `await connection()` is the explicit opt-in; awaiting a database call does not prevent static prerendering. Do not remove it, do not add static rendering back.
- The strict CSP means new external origins must be added deliberately.
- Uploads go straight to R2 via presigned PUT URLs because Vercel caps request bodies at 4.5 MB. The 500 MB limit exists because Content-Length is signed into the URL. Do not "simplify" this into an upload proxied through the app.
- The drive uploads the same way, from the browser. That needs a CORS rule on the bucket allowing PUT from the app's origin and the R2 origin in the CSP (`proxy.ts`). Text previews are read server side so the CORS rule never needs GET.
- The monthly quota has no database. Every presign lists the bucket and sums the objects uploaded since the first of the UTC month, so deleting a file gives its bytes back. Presigned uploads that have not landed do not count yet.
- Files expire through a 90 day lifecycle rule on the bucket. `RETENTION_DAYS` in `file-info.ts` only mirrors it for display; change both together.
- The public upload API is `PUT /`, rewritten in `proxy.ts` to the internal `/api/upload` handler, because a route handler cannot share the root path with the drive page.
- The bucket needs no public access. `GET /<key>` redirects to a presigned GET that also pins `response-content-type` from the extension, so the Content-Type the uploader sent (curl -T sends none) does not matter.
- The drive signs in with `UPLOAD_TOKEN`. A session is a 30 day HttpOnly `__Host-` cookie holding an expiry and its HMAC keyed by the token, so there is no session store and rotating the token signs every browser out. `isSignedIn()` is the only check: the page and every server action call it themselves, because the proxy is not a security boundary. `GET /<key>` stays public on purpose, the links live in PRs.
- The upload API authenticates with the `UPLOAD_TOKEN` bearer token. Tokens are compared as SHA-256 hashes with `timingSafeEqual`, so neither content nor length leaks through timing, and the env schema has a length floor.
- The server renders in UTC. Anything that reads the browser's clock or time zone renders behind `useHydrated()`, otherwise hydration fails.
- Importing server code into a client component is a build error via `server-only`. Type-only imports across that boundary are safe and lint-enforced (`import type`), and load-bearing: dropping the `type` keyword ships server code to the browser.
- Builds without an environment use `SKIP_ENV_VALIDATION=1`. Never weaken a required env var to optional to make a build pass; the fail-fast is the point.
- Formatting is oxfmt's job, including import order and Tailwind class order. Never hand-format or reorder imports.
- shadcn components are generated into `components/ui` with the shadcn CLI, do not hand-edit them beyond what a change genuinely requires. The only edit so far swaps the overlays' backdrop blur for a plain scrim. The CLI writes `import { cn } from "cn"` and adds the `cn` package; point new components at `@/lib/utils` and drop the package.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
