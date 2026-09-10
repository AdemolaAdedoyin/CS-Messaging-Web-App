# SupportDesk

A recruiter-facing customer-support messaging experience rebuilt from the original CS Messaging prototype. SupportDesk now has two complementary modes: a zero-setup portfolio demo and an optional Firebase-backed realtime workspace for genuine multi-browser customer/agent messaging.

**Live demo:** https://cs-messaging-web-app-tan.vercel.app/

## Product experience

### Portfolio demo

The browser-backed demo remains the fastest way to explore the product without creating an account or configuring external services.

- Support Agent workspace with searchable conversations, open/pending/resolved filters, priority-first ordering, unread counts, status updates, priority editing, customer context, and replies
- Customer portal with multiple demo customer identities
- Customer directory with direct navigation into each support conversation
- Reports view with queue metrics derived from the current demo state
- Shared customer/agent messages inside the same browser
- Local persistence across refreshes plus reset-to-seed-data controls
- Responsive desktop and mobile layouts

### Realtime workspace

SupportDesk v3 adds a Firebase-backed path designed for two separate browsers or devices:

- Customers authenticate with Firebase Anonymous Auth
- Customers can create their own support case and send messages
- Support agents sign in with a pre-provisioned Firebase email/password account
- Agents subscribe to the shared queue in real time
- New customer cases appear in the agent inbox without refreshing
- Agents can claim unassigned cases, update priority/status, and reply
- Customer and agent message threads update from Firestore snapshots
- Existing authenticated sessions can be restored by Firebase Auth
- Firestore security rules prevent customers from reading other customers' cases or promoting themselves to agents

The realtime launcher remains usable when Firebase is not configured: it shows setup instructions and the normal portfolio demo continues working.

## What changed from the original project

The original application proved out realtime customer/representative messaging with Vue and Firestore, but mixed UI, Firebase queries, prioritization, DOM manipulation, authentication assumptions, and styling inside large components. The rebuild separates the presentation layer, domain types, demo state, Firebase client, and Firestore repository.

This keeps the zero-setup demo reliable while allowing the realtime implementation to use the same product without embedding database calls directly inside the main Vue UI.

## Stack

- Vue 3
- TypeScript
- Vite
- Firebase Authentication
- Cloud Firestore
- Vitest
- Playwright
- ESLint
- GitHub Actions
- Vercel

## Architecture

The browser-backed demo uses:

- `src/types/support.ts` — demo conversation/message domain types
- `src/composables/useSupportInbox.ts` — filtering, selection, status/priority changes, unread state, persistence, and demo messaging
- `src/data/demoConversations.ts` — deterministic seed data

The realtime path uses:

- `src/firebase/client.ts` — environment-driven Firebase initialization
- `src/types/realtime.ts` — realtime profile, conversation, and message types
- `src/repositories/firebaseSupportRepository.ts` — authentication, Firestore subscriptions, case creation, assignment, updates, and messaging
- `src/components/realtime/RealtimeWorkspace.vue` — customer and agent realtime presentation/workflows
- `firestore.rules` — role-aware authorization rules

The UI does not directly query Firestore. Realtime persistence is isolated behind the repository layer so the backend can be changed later without rebuilding the presentation layer.

## Local development

```bash
npm install
npm run dev
```

The portfolio demo requires no environment variables.

For realtime development, copy `.env.example` to `.env.local` and add the Firebase Web App configuration values.

## Realtime Firebase setup

1. Create or select a Firebase project and register a Web App.
2. Enable **Cloud Firestore**.
3. In Firebase Authentication, enable **Anonymous** and **Email/Password** providers.
4. Copy `.env.example` to `.env.local` and populate all `VITE_FIREBASE_*` values from the Firebase Web App configuration.
5. Deploy `firestore.rules` to the project. With the Firebase CLI this can be done with `firebase deploy --only firestore:rules` after selecting the correct project.
6. In Firebase Authentication, create the support-agent email/password user manually. There is intentionally no public agent signup route.
7. Copy that agent user's Firebase Auth UID and create a Firestore document at `profiles/{uid}` with:

```json
{
  "uid": "THE_AGENT_FIREBASE_UID",
  "displayName": "Ademola",
  "email": "the-agent-email@example.com",
  "role": "agent"
}
```

8. Add the same `VITE_FIREBASE_*` variables to the Vercel project and redeploy.
9. Open **Realtime workspace → Customer** in one browser and **Realtime workspace → Support agent** in another browser to verify cross-session behavior.

Firebase Web App configuration values identify the Firebase project; authorization is enforced by Firebase Auth and `firestore.rules`. Do not put service-account private keys or Firebase Admin credentials in the frontend or Vercel `VITE_*` variables.

## Firestore security model

Customer profiles can only be created as `customer`; client code cannot self-provision an `agent` profile. Customers can read their own conversations and messages, create their own cases, and append messages to those cases. Agents can read the support queue and update assignment, status, priority, and messages.

The agent profile must therefore be provisioned through an administrative path such as the Firebase console. A future backend could replace this manual provisioning with custom claims or an admin service.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

CI also runs a production-dependency security audit. The default CI environment intentionally has no Firebase credentials, so browser tests verify that the realtime path fails gracefully while the portfolio demo remains fully functional. Multi-browser Firebase integration tests should be run against a dedicated test Firebase project once one is configured.

## Production strategy

The portfolio deployment is intentionally resilient: the seeded demo never depends on Firebase availability. The realtime path activates only when all required Firebase Web App environment variables are present.

This provides a one-click recruiter experience while still demonstrating the architecture required for genuine cross-browser support messaging.

## Future enhancements

### Realtime operations

- Presence and typing indicators
- Reconnect/offline status and optimistic message states
- Multiple support agents, reassignment, ownership history, and team queues
- Server-authoritative automatic assignment based on availability/workload
- Push/email notifications for replies and status changes

### Support tooling

- SLA timers, escalation policies, and breach indicators
- Internal agent notes that are never visible to customers
- Canned replies/macros and saved response templates
- Attachments with validated uploads and cloud storage
- Conversation tags, categories, and richer filtering
- Audit trail for assignment, status, and priority changes

### Reporting and scale

- Persisted first-response time, resolution time, queue volume, reopen rate, and SLA metrics
- Agent/team performance dashboards based on event history
- Pagination or virtualization for large inboxes
- Error monitoring, structured logs, analytics, tracing, and operational alerts
- Firebase Emulator Suite tests for Firestore rules
- Dedicated test project with true multi-browser realtime E2E coverage

The next production-hardening milestone after the initial realtime deployment is automated security-rule testing plus richer connection/presence handling. After that, the project is intentionally ready to pause so portfolio work can move on to the fintech system.
