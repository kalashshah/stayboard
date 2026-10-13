# Stayboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline). Steps use checkbox syntax.

**Goal:** Ship Stayboard end to end: Worker API + D1, host dashboard with live preview, guest phone page, Vega (Fire TV) app, Nova-powered "Ask the house", running on the Vega Virtual Device and deployed to Cloudflare.

**Architecture:** One Cloudflare Worker (Hono) serves `/api/*` and the Vite SPA (dashboard + guest page). D1 holds hosts, sessions, properties (config as one JSON column), devices, questions, usage. The TV app is React Native 0.83 for Vega; it registers for a pairing code, polls config, and posts questions. Bedrock Nova 2 Lite answers from a system prompt built from the property config.

**Tech Stack:** TypeScript, Hono, zod, aws4fetch, React 19, Vite 8, vitest, wrangler 4, Vega SDK 0.24 (`@amazon-devices/react-native-kepler` 4), `@amazon-devices/react-native-qrcode-svg`, `@amazon-devices/react-native-async-storage__async-storage`.

**Spec:** docs/superpowers/specs/2026-10-14-stayboard-design.md

## Global Constraints

- Model `us.amazon.nova-2-lite-v1:0`, region us-east-1, temperature 0, maxTokens 300, 300 calls/day global cap, 60/day per guest slug.
- Secrets only in `.dev.vars` (gitignored) and Worker secrets. Never commit keys.
- Passwords PBKDF2-SHA256 100k iterations via Web Crypto. Session cookie HttpOnly, SameSite=Lax, 30 days.
- Pairing code alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, length 6. Device secret 32 random bytes base64url.
- Config limits: headline 80, message 400, guide body 4000, lists ≤ 40 items, strings ≤ 200 unless noted. Unknown keys stripped.
- Theme: General Sans, bg #faf8f7, ink #1c1c1c, accent terracotta #c2562e, soft #f6e3d9; pill buttons; hairline cards; light only.
- TV UI: 1920×1080 design, focus ring 3px white, minimum text 24px, all screens reachable with D-pad + Back.

## Review Focus

1. Guest ask route with an empty or 2k-char question → 400, never a Bedrock call.
2. PUT config with extra keys and over-long strings → stripped/400 with a field path, never saved raw.
3. TV polling with a revoked secret (device unpaired or property deleted) → `{paired:false, code}` again, not 500.
4. Bedrock error/timeout → ask returns `{answered:false, answer: fallback}` and still logs the question.
5. Signup with an existing email → 409, no session leak.

---

### Task 1: Scaffold, schema, config module

**Files:** `package.json`, `wrangler.jsonc`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `.gitignore`, `.dev.vars.example`, `migrations/0001_init.sql`, `worker/config.ts`, `worker/config.test.ts`, `worker/index.ts`, `index.html`, `src/main.tsx`
**Produces:** `PropertyConfig` type, `configSchema` (zod), `defaultConfig(name: string): PropertyConfig`, `parseConfig(input: unknown): { ok: true, config } | { ok: false, error: string }`.

- [ ] Write `worker/config.test.ts`: default config validates; extra keys stripped; headline > 80 fails with path `welcome.headline`; lists > 40 fail.
- [ ] Run `npx vitest run worker/config.test.ts` → FAIL (module missing).
- [ ] Implement `worker/config.ts`.
- [ ] Run → PASS. Commit `feat: scaffold + property config schema`.

### Task 2: Auth and properties API

**Files:** `worker/auth.ts`, `worker/auth.test.ts`, `worker/db.ts`, `worker/api.ts`, `worker/types.ts`
**Produces:** `hashPassword(pw) → {hash, salt}`, `verifyPassword(pw, hash, salt)`, `randomCode(n)`, `newId()`, `newSecret()`; Hono router `api` with auth + properties routes; `requireHost` middleware reading cookie `sb_session`.

- [ ] Tests: hash round-trip, wrong password false, randomCode uses only the alphabet and length 6, newSecret 43 chars.
- [ ] RED → implement → GREEN. Commit `feat: host auth + properties API`.

### Task 3: Devices, TV and guest routes

**Files:** `worker/api.ts` (extend), `worker/db.ts` (extend)
**Produces:** `POST /api/tv/register`, `GET /api/tv/config`, `POST /api/properties/:id/pair`, `DELETE .../devices/:code`, `GET /api/g/:slug`.

- [ ] Test: `slugFor()` 8 chars lowercase alnum. Implement routes. Commit `feat: pairing, TV config, guest config`.

### Task 4: Ask the house

**Files:** `worker/ask.ts`, `worker/ask.test.ts`
**Produces:** `buildSystemPrompt(config)`, `parseAnswer(text) → {answered, answer}`, `ask(env, property, question, source) → {answered, answer}`, `takeBudget(env, day)`.

- [ ] Tests: prompt includes wifi/rules/guide/faqs/fallback; parseAnswer handles fenced JSON, prose with JSON inside, garbage → answered:false; question length guard.
- [ ] RED → implement with `converse()` (aws4fetch) → GREEN. Wire `POST /api/tv/ask` and `POST /api/g/:slug/ask` (60/day per slug), log to `questions`. Commit `feat: ask the house via Nova 2 Lite`.

### Task 5: Dashboard

**Files:** `src/styles.css`, `src/App.tsx`, `src/api.ts`, `src/pages/Landing.tsx`, `src/pages/Properties.tsx`, `src/pages/Editor.tsx`, `src/components/Preview.tsx`, `src/components/Fields.tsx`
**Produces:** signed-out Landing with sign-up/sign-in; Properties list; Editor with tabs (Welcome, Stay & Wi-Fi, Rules, Guide, FAQs, Local picks, Contacts, Appearance, Ask, Devices, Inbox) + live 16:9 Preview; autosave 600 ms with "Saved".

- [ ] Build, deploy, Playwright screenshots of landing, editor, inbox at desktop and mobile. Commit `feat(ui): dashboard with live TV preview`.

### Task 6: Guest page

**Files:** `src/guest/Guest.tsx`, route `/g/:slug` in `App.tsx`
- [ ] Mobile layout mirroring TV sections + ask box; screenshot. Commit `feat(ui): guest phone page`.

### Task 7: TV app (Vega)

**Files:** `tv/` (generated from `helloWorld` template), `tv/src/App.tsx`, `tv/src/api.ts`, `tv/src/screens/*.tsx`, `tv/src/ui.tsx`, `tv/manifest.toml`
**Produces:** Pair, Home, Wifi, Checkout, Rules, Guide, Places, Contacts, Ask screens; D-pad focus; Back handling; config polling 60 s (5 s while unpaired); AsyncStorage for secret + last config.

- [ ] `npm run build:app` → `.vpkg`; `vega run-app … -d VirtualDevice`; screenshot each screen; pair against the deployed Worker; ask a question end to end. Commit `feat(tv): Vega app`.

### Task 8: Ship

- [ ] README (what, why, architecture, run locally, judge instructions, path to production), `docs/friction-log.md`, LICENSE (MIT), deploy, memory file update. Commit `docs: README, friction log, license`.
