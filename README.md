# SupportDesk

A recruiter-facing customer-support messaging dashboard rebuilt from the original CS Messaging prototype. SupportDesk focuses on triaging customer conversations, priority handling, assignment, status management, search, and fast agent replies.

## What changed in v2

The original project proved out realtime customer/representative messaging with Vue and Firestore, but mixed UI, Firebase queries, prioritization, DOM manipulation, and styling inside large components. Version 2 rebuilds the product around a typed domain model, focused composables, modern tooling, and a demo-first interface that is immediately usable when deployed.

## Features

- Agent inbox with open, pending, resolved, and priority filters
- Search across customer names, subjects, and email addresses
- Priority-first conversation ordering
- Unread indicators that clear when a conversation is opened
- Customer details and assignment context
- Conversation status updates
- Agent reply composer with realistic thread updates
- Responsive desktop and mobile layouts
- Accessible keyboard focus and labelled controls
- Seeded demo workspace for zero-setup portfolio use
- Unit tests, browser E2E tests, linting, type checking, production build validation, and CI

## Stack

- Vue 3
- TypeScript
- Vite
- Firebase SDK (for the realtime data integration layer)
- Vitest
- Playwright
- ESLint
- GitHub Actions
- Vercel-ready static frontend

## Architecture

`src/types/support.ts` defines the core conversation and message model. `src/composables/useSupportInbox.ts` owns inbox behavior such as filtering, selection, status changes, unread state, and replies. `src/data/demoConversations.ts` provides deterministic demo data so the live portfolio deployment works without external credentials.

The old direct Firestore/DOM/jQuery coupling is intentionally removed from the presentation layer. The next backend integration step is to connect this domain model to Firebase Auth and Firestore through a dedicated adapter rather than embedding database calls inside Vue components.

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

## Production strategy

The deployed portfolio demo should always remain usable without registration or external setup. A Firebase-backed mode can be enabled separately for real customer/agent sessions while keeping the seeded demo path available for recruiters.

## Roadmap

- Firebase Auth for authenticated customer and support-agent identities
- Firestore adapter for realtime conversations and messages
- Firestore security rules based on authenticated role and assignment
- Presence and typing indicators
- Reconnect/offline handling
- Conversation assignment and reassignment workflows
- SLA/priority rules and escalation history
- Analytics for queue volume, response time, and resolution rate

The goal is to evolve the original realtime prototype into a production-style support platform without sacrificing the one-click demo experience.
