# SupportDesk

A recruiter-facing customer-support messaging experience rebuilt from the original CS Messaging prototype. SupportDesk focuses on triaging customer conversations, priority handling, assignment, status management, search, and fast agent replies while preserving a simple customer-facing support flow.

## What changed in v2

The original project proved out realtime customer/representative messaging with Vue and Firestore, but mixed UI, Firebase queries, prioritization, DOM manipulation, and styling inside large components. Version 2 rebuilds the product around a typed domain model, focused composables, modern tooling, and a demo-first interface that is immediately usable when deployed.

## Current features

- Separate one-click demos for Support Agent and Customer roles
- Agent inbox with open, pending, resolved, and priority filters
- Search across customer names, subjects, and email addresses
- Priority-first conversation ordering
- Unread indicators that clear when a conversation is opened
- Customer details and assignment context
- Conversation status updates
- Agent reply composer with realistic thread updates
- Customer support thread with customer-side message sending
- Shared typed conversation model across both demo roles
- Responsive desktop and mobile layouts
- Accessible keyboard focus and labelled controls
- Seeded demo workspace for zero-setup portfolio use
- Unit tests, browser E2E tests, linting, type checking, production build validation, and CI

## Stack

- Vue 3
- TypeScript
- Vite
- Vitest
- Playwright
- ESLint
- GitHub Actions
- Vercel-ready static frontend

The original Firebase implementation remains available in git history. Firebase is not currently required to run the v2 demo.

## Architecture

`src/types/support.ts` defines the core conversation and message model. `src/composables/useSupportInbox.ts` owns inbox behavior such as filtering, selection, status changes, unread state, and customer/agent message updates. `src/data/demoConversations.ts` provides deterministic demo data so the live portfolio deployment works without external credentials.

The old direct Firestore/DOM/jQuery coupling is intentionally removed from the presentation layer. Realtime persistence will be reintroduced behind a dedicated data adapter rather than embedding database calls inside Vue components.

## Local development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

CI also runs a production dependency security audit.

## Production strategy

The portfolio deployment is intentionally demo-first. A recruiter can open either role without registering or configuring external services, and every important workflow remains interactive inside the browser.

A future Firebase-backed mode will support genuine multi-device customer/agent sessions while keeping these one-click demos available.

## Realtime roadmap

- Firebase Auth for authenticated customer and support-agent identities
- Firestore adapter for realtime conversations and messages
- Firestore security rules based on authenticated role and assignment
- Presence and typing indicators
- Reconnect/offline handling
- Conversation assignment and reassignment workflows
- SLA/priority rules and escalation history
- Analytics for queue volume, response time, and resolution rate

The target architecture is a production-style support platform without sacrificing a reliable portfolio demo experience.
