# SupportDesk

A recruiter-facing customer-support messaging experience rebuilt from the original CS Messaging prototype. SupportDesk focuses on triaging customer conversations, priority handling, assignment, status management, search, customer self-service, and fast agent replies while preserving a zero-setup portfolio demo.

**Live demo:** https://cs-messaging-web-app-tan.vercel.app/

## Current product experience

SupportDesk v2.1 includes two one-click roles and a shared browser-backed conversation model:

- Support Agent workspace with searchable conversations, open/pending/resolved filters, priority-first ordering, unread counts, status updates, priority editing, customer context, and replies
- Customer portal with a choice of multiple demo customer identities instead of a single hard-coded customer
- Customer directory with direct navigation into each support conversation
- Reports view with live queue metrics derived from the current conversation state
- Shared customer/agent messages inside the same browser
- Local persistence so demo changes survive refreshes, plus a reset-to-seed-data action
- Responsive desktop and mobile layouts
- Accessible labels, keyboard focus states, and semantic controls
- Unit tests, Playwright browser E2E tests, linting, type checking, production build validation, and CI

## What changed from the original project

The original application proved out realtime customer/representative messaging with Vue and Firestore, but mixed UI, Firebase queries, prioritization, DOM manipulation, and styling inside large components. Version 2 rebuilt the product around a typed domain model, modern Vue tooling, a focused state/composable layer, and a demo-first interface that remains usable without external credentials.

The original Firebase implementation remains available in git history. Firebase is not required to run the current portfolio demo.

## Stack

- Vue 3
- TypeScript
- Vite
- Vitest
- Playwright
- ESLint
- GitHub Actions
- Vercel

## Architecture

`src/types/support.ts` defines the conversation and message domain model. `src/composables/useSupportInbox.ts` owns filtering, selection, status/priority changes, unread state, persistence, resets, and customer/agent message updates. `src/data/demoConversations.ts` provides deterministic seed data for the live demo.

The presentation layer does not talk directly to a database. A future realtime provider should sit behind a dedicated repository/data adapter so the UI and domain behavior do not need to be rewritten when moving from the browser-backed demo to Firebase or another backend.

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

CI also runs a production-dependency security audit.

## Production strategy

The deployed portfolio version is intentionally demo-first. Recruiters can inspect both customer and support-agent workflows without registration, seeded accounts, or external setup.

Changes made in the demo are stored only in the local browser. This keeps the deployment reliable while clearly separating the UI/domain layer from the future realtime backend.

## Future enhancements

### Realtime multi-session support

- Firebase Auth or equivalent authentication for real customer and support-agent identities
- Realtime Firestore/data adapter so a customer in one browser can create or update a conversation and an agent in another browser receives it immediately
- Secure role-based access rules and server-authoritative assignment permissions
- New-conversation intake flow with subject/category selection
- Automatic or manual assignment to available support representatives
- Presence, typing indicators, connection/reconnect state, and offline handling

### Support operations

- Multiple agents, assignment/reassignment, ownership history, and team queues
- SLA timers, escalation policies, priority rules, and breach indicators
- Internal agent notes that are never visible to customers
- Canned replies/macros and saved response templates
- Attachments with validated file upload and storage
- Customer notifications for replies and status changes
- Conversation tags, categories, and richer filtering
- Audit trail for assignment, status, and priority changes

### Reporting and scale

- Persistent historical metrics for first-response time, resolution time, queue volume, reopen rate, and SLA performance
- Agent/team performance dashboards based on real persisted events rather than simulated metrics
- Pagination or list virtualization for large inboxes
- Error monitoring, structured logs, analytics, tracing, and operational alerts
- Backend integration tests plus multi-browser realtime E2E coverage

The next major milestone is genuine **end-to-end realtime messaging**: a customer opens a separate browser/session, starts or updates a conversation, the case is assigned to an agent, and both sides see new messages and state changes without refreshing.
