# SupportDesk

A recruiter-facing customer-support messaging experience rebuilt from the original CS Messaging prototype. SupportDesk has two complementary modes: a zero-setup portfolio demo and a Firebase-backed realtime workspace for genuine multi-browser customer/agent messaging.

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

SupportDesk v3 provides a Firebase-backed path designed for separate browsers or devices:

- Customers create a persistent email/password account or sign back into an existing account
- Customer case history is tied to the Firebase Auth UID and is restored after sign-out/sign-in
- Customers can create support cases and send messages
- Support agents sign in with a pre-provisioned Firebase email/password account
- Agents subscribe to the shared queue in real time
- New customer cases appear in the agent inbox without refreshing
- Realtime conversations maintain separate agent/customer unread counts
- Agents must claim a case before they can reply to it
- Agents can update priority/status after opening a case
- Customer and agent message threads update from Firestore snapshots
- Existing authenticated sessions are restored by Firebase Auth
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
- `src/types/realtime.ts` — realtime profile, conversation, unread-state, and message types
- `src/repositories/firebaseSupportRepository.ts` — authentication, Firestore subscriptions, atomic case/message writes, assignment, unread state, updates, and messaging
- `src/components/realtime/RealtimeWorkspace.vue` — customer and agent realtime presentation/workflows
- `firestore.rules` — role-aware authorization rules, including assigned-agent reply enforcement

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
3. In Firebase Authentication, enable **Email/Password**.
4. Copy `.env.example` to `.env.local` and populate all `VITE_FIREBASE_*` values from the Firebase Web App configuration.
5. Deploy `firestore.rules` to the project. With the Firebase CLI this can be done with `firebase deploy --only firestore:rules` after selecting the correct project.
6. Provision at least one support-agent account using the process below.
7. Add the same `VITE_FIREBASE_*` variables to the Vercel project and redeploy.
8. Open **Realtime workspace → Customer** in one browser and **Realtime workspace → Support agent** in another browser to verify cross-session behavior.

Firebase Web App configuration values identify the Firebase project; authorization is enforced by Firebase Auth and `firestore.rules`. Do not put service-account private keys or Firebase Admin credentials in the frontend or Vercel `VITE_*` variables.

**Important:** Firestore rules are not deployed automatically by a normal Vercel/GitHub frontend deployment. Whenever `firestore.rules` changes, publish the updated rules in Firebase Console or deploy them with the Firebase CLI before testing the new realtime behavior.

### Adding a support agent

Yes — with the current secure architecture, **every support agent must be provisioned in Firebase before they can sign in**. There is intentionally no public "create agent" flow because letting browser clients grant themselves the `agent` role would be a privilege-escalation risk.

Repeat these steps for each new agent:

1. Go to **Firebase Console → Authentication → Users → Add user**.
2. Create the agent's email/password account.
3. Copy the generated Firebase Auth **User UID**.
4. Go to **Firestore → Data → `profiles`**.
5. Create a document whose **Document ID is exactly that User UID**.
6. Add these string fields:

```json
{
  "uid": "THE_AGENT_FIREBASE_UID",
  "displayName": "Agent Name",
  "email": "agent@example.com",
  "role": "agent"
}
```

The document ID and `uid` field must match the Firebase Authentication UID exactly. The email should also match the Auth account email.

For example:

```text
Authentication user UID: abc123

profiles/abc123
  uid: abc123
  displayName: Ademola
  email: agent@example.com
  role: agent
```

For a small portfolio deployment, manual provisioning is deliberate and keeps agent creation outside the untrusted browser client. A larger production system should replace this with an administrative backend using Firebase Admin/custom claims or an invitation workflow.

### Customer accounts

Realtime customers create their own email/password account from the app. Their `profiles/{uid}` document is created automatically with `role: "customer"`.

Cases are stored against that immutable Firebase Auth UID. Because of that, signing out and later signing back in with the same customer email/password restores the same case history. A name/email combination by itself is not treated as authentication.

Earlier v3 builds used Anonymous Auth for customer sessions. Anonymous identities cannot be recovered after an explicit sign-out because Firebase creates a different UID the next time. The current version uses persistent customer accounts instead. If Anonymous Auth was enabled while setting up an older build, it can now be disabled unless you intentionally add a guest-customer mode later.

## Realtime conversation behavior

New cases are created with the opening customer message in the same Firestore batch, so the conversation and its first message become visible together. Customer messages increment the agent unread count; agent replies increment the customer unread count. Opening a conversation clears the appropriate unread count for that viewer.

An unassigned case can be inspected and triaged, but an agent cannot send a customer-visible reply until the case is assigned to that agent. This restriction is enforced in both the UI and Firestore security rules, not only by disabling the button in the browser.

## Firestore security model

Customer profiles can only be created as `customer`; client code cannot self-provision an `agent` profile. Customers can read their own conversations and messages, create their own cases, and append messages to those cases. Agents can read the support queue and update assignment, status, priority, and unread state. Message creation by an agent is only allowed when that agent owns the case.

Agent profiles therefore have to be provisioned through a trusted administrative path such as the Firebase console. A future backend can replace this manual process with custom claims or an admin service.

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

- Admin-only agent invitation/provisioning workflow backed by Firebase Admin or another trusted server
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
