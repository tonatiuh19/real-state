# `ui-common-mortgagex` — Full Migration Plan

> **Goal:** Extract reusable UI and business components from `real-state` into a standalone private npm package (`@mortgagex/ui-common`) that can be consumed by any current or future tenant project.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Package Setup & Tooling](#2-package-setup--tooling)
3. [Component Inventory & Classification](#3-component-inventory--classification)
4. [Refactoring Guide — Store-Coupled Components](#4-refactoring-guide--store-coupled-components)
5. [Shared Types Strategy](#5-shared-types-strategy)
6. [Tailwind & Design Token Strategy](#6-tailwind--design-token-strategy)
7. [Publishing Strategy (Private Registry)](#7-publishing-strategy-private-registry)
8. [Consuming the Library in a Tenant Project](#8-consuming-the-library-in-a-tenant-project)
9. [Migration Phases & Checklist](#9-migration-phases--checklist)
10. [What Stays Per-Tenant](#10-what-stays-per-tenant)
11. [GitHub Hosting & Publishing Checklist](#11-github-hosting--publishing-checklist)

---

## 1. Architecture Overview

```
ui-common-mortgagex/              ← standalone npm package repo
  src/
    components/
      ui/                         ← shadcn primitives (zero refactor needed)
      primitives/                 ← pure props-driven mortgage components
      composed/                   ← refactored domain components (props-driven)
    lib/
      utils.ts                    ← cn(), shared formatters
      logger.ts                   ← Logger class
      template-utils.ts           ← buildVarMap(), VarStatus, BrokerInfo
      seo-helpers.ts              ← MetaPreset helpers
      cdn-upload.ts               ← uploadAvatarToCDN()
    hooks/
      use-mobile.tsx
      use-sortable-data.ts
      use-bulk-deletion.ts
      use-deletion-modal.ts
    types/
      index.ts                    ← re-exports from @shared/api equivalents
    index.ts                      ← barrel export (everything public)
  package.json
  tsup.config.ts
  tailwind.config.ts              ← shared theme
  global.css                      ← CSS custom properties / design tokens

real-state/                       ← tenant 1 (current project)
  → imports from @mortgagex/ui-common

other-tenant/                     ← tenant 2
  → imports from @mortgagex/ui-common
```

---

## 2. Package Setup & Tooling

### 2.1 Initialize the package

```bash
mkdir ui-common-mortgagex && cd ui-common-mortgagex
npm init -y
npm install -D tsup typescript react @types/react tailwindcss
npm install clsx tailwind-merge lucide-react framer-motion
```

### 2.2 `package.json` (key fields)

```json
{
  "name": "@mortgagex/ui-common",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/index.css"
  },
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit"
  }
}
```

### 2.3 `tsup.config.ts`

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  injectStyle: false, // consumer imports ./styles separately
});
```

### 2.4 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "declaration": true,
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

---

## 3. Component Inventory & Classification

Components are classified into four tiers based on effort needed to migrate them.

### Tier 1 — Zero Refactor (copy directly)

These components have **no Redux store dependency**. They are props-driven already.

| Component                | File                         | Notes                                  |
| ------------------------ | ---------------------------- | -------------------------------------- |
| All `ui/` primitives     | `client/components/ui/*.tsx` | shadcn/radix — pure props              |
| `EmailLink`              | `EmailLink.tsx`              | Pure props, no store                   |
| `ImageCropUploader`      | `ImageCropUploader.tsx`      | Pure props, uses ui/ only              |
| `MetaHelmet`             | `MetaHelmet.tsx`             | Pure props, react-helmet-async         |
| `ResendCodeButton`       | `ResendCodeButton.tsx`       | Pure props, timer logic only           |
| `PDFSignatureZoneEditor` | `PDFSignatureZoneEditor.tsx` | Props-driven, uses `@shared/api` types |
| `PDFSigningViewer`       | `PDFSigningViewer.tsx`       | Props-driven, uses `@shared/api` types |
| `BrokerDatePicker`       | `BrokerDatePicker.tsx`       | Pure props (availability passed in)    |
| `ClientDatePicker`       | `ClientDatePicker.tsx`       | Pure props (availableDates passed in)  |
| `HeroBackground`         | `visuals/HeroBackground.tsx` | Pure visual, no deps                   |
| `Footer`                 | `layout/Footer.tsx`          | Static layout                          |
| `PageHeader`             | `layout/PageHeader.tsx`      | Pure props                             |

**Migration:** Copy file → fix `@/` → `@mortgagex/ui-common/` import paths → export from `index.ts`.

---

### Tier 2 — Minimal Refactor (extract store reads to props)

These components use the store only to **read a small piece of state** that can easily become a prop.

| Component                  | File                           | Current Store Coupling                                               | Refactor                                                                 |
| -------------------------- | ------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `BrokerTimePicker`         | `BrokerTimePicker.tsx`         | `scheduler.availableSlots`, `scheduler.isLoadingSlots`               | Add `availableSlots: TimeSlot[]`, `isLoadingSlots: boolean` props        |
| `ClientTimePicker`         | `ClientTimePicker.tsx`         | Same as above                                                        | Same treatment                                                           |
| `BrokerSchedulerLinkModal` | `BrokerSchedulerLinkModal.tsx` | Likely scheduler link state                                          | Add link as prop                                                         |
| `BrokerShareLinkModal`     | `BrokerShareLinkModal.tsx`     | `applicationWizard.brokerShareLink`, `shareLinkLoading`              | Pass `shareLink` and `isLoading` as props                                |
| `ShareLinkModal`           | `ShareLinkModal.tsx`           | `applicationWizard` state                                            | Expose `shareUrl`, `isLoading`, `onGenerate` as props                    |
| `LeadSourceClientsDrawer`  | `LeadSourceClientsDrawer.tsx`  | `clients`, `isLoading`, `pagination`                                 | Pass data as props; accept `onLoadMore` callback                         |
| `PhoneLink`                | `PhoneLink.tsx`                | dispatches `startOutboundCall`                                       | Accept `onCall: (phone: string) => void` callback prop                   |
| `GlobalVoiceManager`       | `GlobalVoiceManager.tsx`       | `brokerAuth.sessionToken`, `voice.isAvailable`, `voice.outboundCall` | Accept `sessionToken`, `isAvailable`, `outboundCall`, callbacks as props |

**Refactoring pattern:**

```tsx
// BEFORE (store-coupled)
const { availableSlots, isLoadingSlots } = useAppSelector((s) => s.scheduler);

// AFTER (props-driven)
interface BrokerTimePickerProps {
  availableSlots: TimeSlot[];
  isLoadingSlots: boolean;
  // ...rest
}
```

The tenant project passes these props by reading from its own store.

---

### Tier 3 — Significant Refactor (multiple store slices, dispatch actions)

These components are tightly woven into the Redux store. They require proper decoupling via **callback props** and **data injection**.

| Component                 | File                          | Store Dependencies                                    | Refactor Strategy                                            |
| ------------------------- | ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| `BrokerWizard`            | `BrokerWizard.tsx`            | `brokers` slice                                       | Props: `brokers[]`, `isLoading`, `onCreate(data)` callback   |
| `NewConversationWizard`   | `NewConversationWizard.tsx`   | `clients`, `conversations` slices                     | Props: `clients[]`, `templates[]`, `isLoading`, `onSubmit`   |
| `ClientFormDialog`        | `ClientFormDialog.tsx`        | dispatches `createClient`, `updateClient`             | Props: `onSubmit(data)`, `isLoading`, `initialValues?`       |
| `TaskWizard`              | `TaskWizard.tsx`              | `tasks.taskTemplateDraft`, `brokerAuth.user.id`       | Props: `draft`, `brokerId`, `onSave`, `onCancel`             |
| `SaveAsTemplateDialog`    | `SaveAsTemplateDialog.tsx`    | dispatches `fetchConversationTemplates`               | Props: `onSave(template)`, `onSuccess` callback              |
| `PhoneNumbersPanel`       | `PhoneNumbersPanel.tsx`       | dispatches phone actions                              | Props: `numbers[]`, `onAdd`, `onRemove` callbacks            |
| `RealtorProspectingBoard` | `RealtorProspectingBoard.tsx` | `realtorProspecting`, `brokers`, `brokerAuth`         | Props: `prospects[]`, `mortgageBankers[]`, `user`, callbacks |
| `RealtorProspectOverlay`  | `RealtorProspectOverlay.tsx`  | `realtorProspecting.isUpdating`                       | Props: `isUpdating`, `onUpdate(data)`                        |
| `TaskCompletionModal`     | `TaskCompletionModal.tsx`     | `tasks.taskDetails`, `tasks.taskDetailsLoading`       | Props: `taskDetails`, `isLoading`, `onComplete`              |
| `VoiceCallPanel`          | `VoiceCallPanel.tsx`          | `voiceSlice`, `brokerAuth.sessionToken`               | Props: `sessionToken`, `onCallEnd`, Twilio device passed in  |
| `PreApprovalLetterModal`  | `PreApprovalLetterModal.tsx`  | `preApproval`, `communicationTemplates`, `brokerAuth` | Props: `letters[]`, `emailTemplates[]`, `user`, callbacks    |

**Refactoring pattern:**

```tsx
// BEFORE
export function NewConversationWizard({ open, onClose }) {
  const dispatch = useAppDispatch();
  const { clients, isLoading } = useAppSelector((s) => s.clients);
  useEffect(() => {
    dispatch(fetchClients());
  }, []);
  // ...
}

// AFTER
export interface NewConversationWizardProps {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  templates: ConversationTemplate[];
  isLoading: boolean;
  onFetchClients: () => void;
  onSubmit: (data: NewConversationPayload) => Promise<void>;
}

export function NewConversationWizard({
  clients,
  templates,
  isLoading,
  onFetchClients,
  onSubmit,
  ...rest
}: NewConversationWizardProps) {
  useEffect(() => {
    onFetchClients();
  }, []);
  // ...
}
```

In the tenant project, the wrapper component connects it to Redux:

```tsx
// real-state: ConnectedNewConversationWizard.tsx
export function ConnectedNewConversationWizard(props) {
  const dispatch = useAppDispatch();
  const { clients, isLoading } = useAppSelector((s) => s.clients);
  return (
    <NewConversationWizard
      clients={clients}
      isLoading={isLoading}
      onFetchClients={() => dispatch(fetchClients())}
      onSubmit={(data) => dispatch(createConversation(data))}
      {...props}
    />
  );
}
```

---

### Tier 4 — Do Not Migrate (stay per-tenant)

These components are fundamentally tied to tenant-specific auth, routing, or API logic.

| Component            | File                          | Reason                                                                         |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------ |
| `AdminLayout`        | `layout/AdminLayout.tsx`      | Tenant-specific auth, routes, section controls                                 |
| `AppLayout`          | `layout/AppLayout.tsx`        | Tenant-specific shell                                                          |
| `ClientLayout`       | `layout/ClientLayout.tsx`     | Tenant-specific client auth flow                                               |
| `Navbar`             | `layout/Navbar.tsx`           | Tenant-specific nav structure & branding                                       |
| `NotificationBell`   | `layout/NotificationBell.tsx` | Deeply coupled to Ably + notification slice                                    |
| `ClientLoginModal`   | `ClientLoginModal.tsx`        | Tenant auth flow (OTP, redirect logic)                                         |
| `NewLoanWizard`      | `NewLoanWizard.tsx`           | Multi-slice (`pipeline`, `clients`, `tasks`, `brokers`), tenant business logic |
| `LoanOverlay`        | `LoanOverlay.tsx`             | Heaviest component — 6+ slices, tenant-specific tabs                           |
| `ClientDetailPanel`  | `ClientDetailPanel.tsx`       | 5+ slices, tenant CRM core                                                     |
| `BrokerDetailPanel`  | `BrokerDetailPanel.tsx`       | 3+ slices, mailbox management                                                  |
| `BrokerMetricsPanel` | `BrokerMetricsPanel.tsx`      | Dashboard + brokers slices, charts                                             |

> **Note:** `NewLoanWizard`, `LoanOverlay`, `ClientDetailPanel`, and `BrokerDetailPanel` could eventually be migrated as Tier 3 if a substantial refactor effort is planned. For the first version of the library, exclude them.

---

## 4. Refactoring Guide — Store-Coupled Components

### 4.1 General Rules

1. **Remove all `useAppDispatch` / `useAppSelector` calls** from any component going into the library.
2. **Replace store reads with props.** If the component reads `state.clients`, it should accept `clients` as a prop.
3. **Replace dispatched actions with callback props.** If the component calls `dispatch(fetchClients())`, it should instead call `props.onFetchClients?.()`.
4. **Never import from `@/store/` inside the library.** The library should have zero knowledge of Redux.
5. **Data loading is the consumer's responsibility.** The library component declares what data it needs. The tenant's connected wrapper fetches it.

### 4.2 Naming Convention for Props

| Pattern                | Example                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------- |
| Data arrays            | `clients: Client[]`                                                                   |
| Loading states         | `isLoading: boolean`                                                                  |
| Saving/mutating states | `isSaving: boolean`                                                                   |
| Fetch triggers         | `onFetch: () => void`                                                                 |
| Submit/create          | `onSubmit: (data: T) => Promise<void>`                                                |
| Update                 | `onUpdate: (id: number, data: Partial<T>) => Promise<void>`                           |
| Delete                 | `onDelete: (id: number) => Promise<void>`                                             |
| Auth token             | `sessionToken?: string` (only when component must call an API directly, e.g., Twilio) |

### 4.3 Handling `sessionToken` in VoiceCallPanel

`VoiceCallPanel` uses the Twilio Voice SDK directly. It legitimately needs a `sessionToken` to initialize the Twilio device. The right approach is to pass it as a prop — not to couple to `brokerAuth`.

```tsx
// In library
export interface VoiceCallPanelProps {
  sessionToken: string; // provided by tenant
  contact: { name: string; phone: string };
  onCallEnd?: (duration: number) => void;
  onCallLogged?: () => void;
}
```

### 4.4 Handling External APIs (CDN Upload)

`cdn-upload.ts` references `import.meta.env.VITE_CDN_UPLOAD_SECRET`. When moved to the library, this must be **injected as a parameter** rather than read from env:

```ts
// BEFORE (env-coupled)
const secret = import.meta.env.VITE_CDN_UPLOAD_SECRET;

// AFTER (injectable)
export async function uploadAvatarToCDN(
  file: File,
  brokerId: number,
  apiKey?: string, // injected by consumer
): Promise<string>;
```

---

## 5. Shared Types Strategy

Currently, types live in `shared/api.ts` and are used by both frontend and backend in the `real-state` project.

### Recommended approach

**Option A — Duplicate into library (simpler, recommended for v1)**

Copy only the frontend-relevant type interfaces into `ui-common-mortgagex/src/types/index.ts`. Types don't carry runtime cost. Tenant projects import from the library, not from their own `shared/`.

```ts
// ui-common-mortgagex/src/types/index.ts
export type {
  Client,
  Broker,
  Task,
  ConversationTemplate,
  SignatureZone,
} from "./mortgage";
```

**Option B — Third shared types package (cleaner long-term)**

```
@mortgagex/types       ← types only, no UI
@mortgagex/ui-common   ← imports from @mortgagex/types
real-state             ← backend also imports from @mortgagex/types
```

Recommended if you plan to have 3+ tenant projects with backend-sharing needs.

---

## 6. Tailwind & Design Token Strategy

### 6.1 Export the shared Tailwind config

```ts
// ui-common-mortgagex/tailwind.config.ts
export default {
  content: [], // consumer adds their own content paths
  theme: {
    extend: {
      colors: {
        // copy from real-state tailwind.config.ts
      },
      // animations, fonts, etc.
    },
  },
};
```

### 6.2 Consumer extends the shared config

```ts
// other-tenant/tailwind.config.ts
import baseConfig from "@mortgagex/ui-common/tailwind.config";

export default {
  ...baseConfig,
  content: [
    "./client/**/*.{ts,tsx}",
    "./node_modules/@mortgagex/ui-common/dist/**/*.{js,mjs}",
  ],
};
```

### 6.3 CSS Variables / Design Tokens

Export `global.css` as a separate entrypoint:

```ts
// In consumer's global.css
@import "@mortgagex/ui-common/styles";
```

Or import in the entry file:

```ts
import "@mortgagex/ui-common/dist/index.css";
```

---

## 7. Publishing Strategy (Private Registry)

### Option A — GitHub Packages (recommended)

1. Add `.npmrc` in each tenant project:

```
@mortgagex:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

2. Publish from the library repo:

```bash
npm publish --access restricted
```

3. Install in tenant:

```bash
npm install @mortgagex/ui-common
```

### Option B — Local workspace (for monorepo)

If all tenants live in one monorepo (Turborepo):

```json
// other-tenant/package.json
{
  "dependencies": {
    "@mortgagex/ui-common": "workspace:*"
  }
}
```

### Option C — Verdaccio (self-hosted npm registry)

Best if you want zero GitHub dependency and full control:

```bash
npm install -g verdaccio
verdaccio
npm publish --registry http://localhost:4873
```

---

## 8. Consuming the Library in a Tenant Project

### 8.1 Installation

```bash
npm install @mortgagex/ui-common
```

### 8.2 Setup in `global.css`

```css
@import "@mortgagex/ui-common/dist/index.css";
```

### 8.3 Extending Tailwind config

```ts
import baseConfig from "@mortgagex/ui-common/tailwind.config";
export default { ...baseConfig, content: [...] };
```

### 8.4 Usage

```tsx
// Pure UI
import { Button, Card, Input } from "@mortgagex/ui-common";

// Refactored business components (Tier 2/3)
import { BrokerTimePicker, ClientFormDialog } from "@mortgagex/ui-common";

// Utilities
import {
  cn,
  logger,
  buildVarMap,
  uploadAvatarToCDN,
} from "@mortgagex/ui-common";

// Hooks
import { useIsMobile, useSortableData } from "@mortgagex/ui-common";
```

### 8.5 Connected wrappers pattern (for Tier 3 components)

```tsx
// other-tenant/src/components/connected/ConnectedClientFormDialog.tsx
import { ClientFormDialog } from "@mortgagex/ui-common";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createClient, updateClient } from "@/store/slices/clientsSlice";

export function ConnectedClientFormDialog(props) {
  const dispatch = useAppDispatch();
  return (
    <ClientFormDialog
      {...props}
      onSubmit={(data) =>
        props.isEdit
          ? dispatch(updateClient({ id: props.clientId, ...data }))
          : dispatch(createClient(data))
      }
    />
  );
}
```

---

## 9. Migration Phases & Checklist

### Phase 1 — Setup & Tier 1 Migration (1–2 days)

- [ ] Create `ui-common-mortgagex` repo
- [ ] Configure `tsup`, `tsconfig.json`, `package.json`
- [ ] Copy all `client/components/ui/*.tsx` → library
- [ ] Copy `client/lib/utils.ts` (the `cn()` function)
- [ ] Copy `client/lib/logger.ts`
- [ ] Copy `client/lib/seo-helpers.ts`
- [ ] Copy `client/lib/template-utils.ts`
- [ ] Copy `client/hooks/use-mobile.tsx`
- [ ] Copy `client/hooks/use-sortable-data.ts`
- [ ] Copy `client/hooks/use-bulk-deletion.ts`
- [ ] Copy `client/hooks/use-deletion-modal.ts`
- [ ] Copy `visuals/HeroBackground.tsx`
- [ ] Copy `layout/Footer.tsx` + `layout/PageHeader.tsx`
- [ ] Copy `EmailLink.tsx`, `MetaHelmet.tsx`, `ResendCodeButton.tsx`, `ImageCropUploader.tsx`
- [ ] Copy `PDFSignatureZoneEditor.tsx`, `PDFSigningViewer.tsx`
- [ ] Copy `BrokerDatePicker.tsx`, `ClientDatePicker.tsx`
- [ ] Refactor `cdn-upload.ts` → accept `apiKey` as param
- [ ] Set up shared Tailwind config + CSS tokens export
- [ ] Write `src/index.ts` barrel exports
- [ ] Build and test locally (`npm link`)
- [ ] Update `real-state` to import Tier 1 components from the library

---

### Phase 2 — Tier 2 Refactoring (2–3 days)

- [ ] Refactor `BrokerTimePicker` → `availableSlots` + `isLoadingSlots` props
- [ ] Refactor `ClientTimePicker` → same pattern
- [ ] Refactor `BrokerShareLinkModal` → `shareLink`, `isLoading`, `onGenerate` props
- [ ] Refactor `ShareLinkModal` → `shareUrl`, `isLoading`, `onGenerate` props
- [ ] Refactor `BrokerSchedulerLinkModal` → pure props
- [ ] Refactor `LeadSourceClientsDrawer` → `clients`, `pagination`, `onLoadMore` props
- [ ] Refactor `PhoneLink` → `onCall: (phone: string) => void` prop
- [ ] Refactor `GlobalVoiceManager` → `sessionToken`, `isAvailable`, `outboundCall`, callbacks
- [ ] Add connected wrappers in `real-state` for each refactored Tier 2 component
- [ ] Publish v0.2.0 to registry

---

### Phase 3 — Tier 3 Refactoring (4–7 days)

- [ ] Refactor `BrokerWizard` → data + callback props
- [ ] Refactor `NewConversationWizard` → data + callback props
- [ ] Refactor `ClientFormDialog` → `onSubmit` callback
- [ ] Refactor `TaskWizard` → `draft`, `brokerId`, `onSave` props
- [ ] Refactor `SaveAsTemplateDialog` → callback-only
- [ ] Refactor `PhoneNumbersPanel` → data + callbacks
- [ ] Refactor `RealtorProspectingBoard` → full props interface
- [ ] Refactor `RealtorProspectOverlay` → `isUpdating`, `onUpdate` props
- [ ] Refactor `TaskCompletionModal` → `taskDetails`, `isLoading`, `onComplete` props
- [ ] Refactor `VoiceCallPanel` → `sessionToken`, `onCallEnd`, `onCallLogged` props
- [ ] Refactor `PreApprovalLetterModal` → all data as props, callbacks for mutations
- [ ] Write connected wrappers in `real-state` for each
- [ ] Publish v0.3.0 to registry

---

### Phase 4 — Second Tenant Onboarding

- [ ] Install `@mortgagex/ui-common` in new tenant project
- [ ] Import and extend shared Tailwind config
- [ ] Import CSS tokens
- [ ] Write tenant-specific connected wrappers for any Tier 3 components used
- [ ] Verify all components render correctly in new project context
- [ ] Adjust types or props as needed based on new tenant's data model differences

---

## 10. What Stays Per-Tenant

Never move these into the shared library — they are inherently tenant-specific:

| Item                                                 | Reason                                                 |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `client/store/` (all slices)                         | State shape is tenant-specific                         |
| `api/index.ts`                                       | API endpoints, DB logic, tenant-specific auth          |
| `shared/api.ts` (backend types)                      | Server types with DB schema coupling                   |
| `AdminLayout`, `AppLayout`, `ClientLayout`, `Navbar` | Tenant branding, routes, auth flow                     |
| `NotificationBell`                                   | Ably channel IDs are tenant-specific                   |
| `ClientLoginModal`                                   | Auth OTP flow, tenant-specific redirects               |
| `NewLoanWizard`                                      | 4-slice dependency, loan pipeline logic                |
| `LoanOverlay`                                        | 6-slice dependency, tenant CRM core view               |
| `ClientDetailPanel`                                  | 5-slice dependency                                     |
| `BrokerDetailPanel`                                  | Mailbox management, tenant-specific email config       |
| `BrokerMetricsPanel`                                 | Dashboard reporting, tenant-specific metrics           |
| `client/pages/` (all pages)                          | Routing and page composition is always tenant-specific |
| `.env` / secrets                                     | Never shared                                           |
| `database/`                                          | Per-tenant schema                                      |

---

## Appendix — `src/index.ts` Barrel Template

```ts
// ── UI Primitives ──────────────────────────────────────────────────────────
export * from "./components/ui/button";
export * from "./components/ui/card";
export * from "./components/ui/input";
export * from "./components/ui/dialog";
export * from "./components/ui/select";
export * from "./components/ui/badge";
export * from "./components/ui/tabs";
export * from "./components/ui/table";
// ... (all ui/ files)

// ── Tier 1 Components ─────────────────────────────────────────────────────
export { EmailLink } from "./components/primitives/EmailLink";
export { ImageCropUploader } from "./components/primitives/ImageCropUploader";
export { MetaHelmet } from "./components/primitives/MetaHelmet";
export { ResendCodeButton } from "./components/primitives/ResendCodeButton";
export { PDFSignatureZoneEditor } from "./components/primitives/PDFSignatureZoneEditor";
export { PDFSigningViewer } from "./components/primitives/PDFSigningViewer";
export { BrokerDatePicker } from "./components/primitives/BrokerDatePicker";
export { ClientDatePicker } from "./components/primitives/ClientDatePicker";
export { HeroBackground } from "./components/primitives/HeroBackground";
export { Footer } from "./components/primitives/Footer";
export { PageHeader } from "./components/primitives/PageHeader";

// ── Tier 2/3 Composed Components ──────────────────────────────────────────
export { BrokerTimePicker } from "./components/composed/BrokerTimePicker";
export { ClientTimePicker } from "./components/composed/ClientTimePicker";
export { PhoneLink } from "./components/composed/PhoneLink";
export { ClientFormDialog } from "./components/composed/ClientFormDialog";
// ... (add as each phase completes)

// ── Utilities ─────────────────────────────────────────────────────────────
export { cn } from "./lib/utils";
export { logger, Logger } from "./lib/logger";
export { buildVarMap } from "./lib/template-utils";
export type { VarStatus, BrokerInfo } from "./lib/template-utils";
export { uploadAvatarToCDN } from "./lib/cdn-upload";
export * from "./lib/seo-helpers";

// ── Hooks ─────────────────────────────────────────────────────────────────
export { useIsMobile } from "./hooks/use-mobile";
export { useSortableData } from "./hooks/use-sortable-data";
export { useBulkDeletion } from "./hooks/use-bulk-deletion";
export { useDeletionModal } from "./hooks/use-deletion-modal";
```

---

## 11. GitHub Hosting & Publishing Checklist

> Everything stays within GitHub — one private repo for source code, GitHub Packages as the private npm registry. No external services needed.

---

### 11.1 One-Time Setup — Library Repo

**GitHub Repository**

- [ ] Create a new **private** GitHub repository named `ui-common-mortgagex` under your org
- [ ] Clone it locally and run the setup commands from [Section 2.1](#21-initialize-the-package)
- [ ] Push initial commit with `package.json`, `tsup.config.ts`, `tsconfig.json`

**Fix `package.json` for GitHub Packages**

> ⚠️ `"private": true` blocks publishing. Replace it with `publishConfig` instead:

```json
{
  "name": "@mortgagex/ui-common",
  "version": "0.1.0",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "restricted"
  }
}
```

**Add `.npmrc` to the library repo root**

```
@mortgagex:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

- [ ] Add `.npmrc` to the library repo root (as above)
- [ ] Add `.npmrc` to `.gitignore` if it ever contains a hardcoded token (use env var only)

---

### 11.2 One-Time Setup — Personal Access Token (PAT)

- [ ] Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
- [ ] Create a new token with these permissions on your org:
  - `Contents` → Read & Write (to publish)
  - `Packages` → Read & Write
- [ ] Copy the token — you only see it once
- [ ] Save it as `GITHUB_TOKEN` in your local shell profile (`~/.zshrc` or `~/.bashrc`):
  ```bash
  export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
  ```
- [ ] Run `source ~/.zshrc` to apply

---

### 11.3 Publishing a New Version

Run these steps every time you want to release an update:

```bash
# 1. Build the library
npm run build

# 2. Bump version (patch / minor / major)
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm version major   # 0.1.0 → 1.0.0

# 3. Publish to GitHub Packages
npm publish

# 4. Push the version commit + tag to GitHub
git push && git push --tags
```

- [ ] After publishing, verify at: `https://github.com/orgs/YOUR_ORG/packages`

---

### 11.4 One-Time Setup — Each Tenant Project

Do this once per tenant repo (including `real-state` once you start consuming the library):

**Add `.npmrc` to the tenant repo root**

```
@mortgagex:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

- [ ] Add `.npmrc` to the tenant repo root
- [ ] Ensure `GITHUB_TOKEN` is set in the local environment (same PAT from 11.2)
- [ ] Run `npm install @mortgagex/ui-common` to verify local resolution works

**Vercel (per tenant project)**

- [ ] Go to **Vercel → Project → Settings → Environment Variables**
- [ ] Add `GITHUB_TOKEN` = _(your PAT value)_ → apply to Production, Preview, and Development environments
- [ ] Redeploy the project — Vercel will now authenticate to GitHub Packages during `npm install`

> The PAT used for Vercel only needs `Packages: Read` permission (not Write) since it only installs.
> Consider creating a separate read-only token for Vercel to follow least-privilege.

---

### 11.5 Updating the Library in a Tenant Project

```bash
# Install a specific version
npm install @mortgagex/ui-common@0.2.0

# Or update to latest
npm update @mortgagex/ui-common
```

- [ ] After updating, check for any prop changes in the release notes / git tags
- [ ] Update connected wrappers if any component interfaces changed
- [ ] Redeploy tenant project on Vercel

---

### 11.6 Optional — GitHub Actions CI/CD (Auto-publish on tag)

Create `.github/workflows/publish.yml` in the library repo to auto-publish when you push a version tag:

```yaml
name: Publish Package

on:
  push:
    tags:
      - "v*"

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: "https://npm.pkg.github.com"
          scope: "@mortgagex"
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] Add this file to the library repo
- [ ] To release: bump version locally → push tag → GitHub Actions publishes automatically

---

### 11.7 Quick Reference — Token Permissions

| Usage                       | Token Type              | Required Permissions                    |
| --------------------------- | ----------------------- | --------------------------------------- |
| Local development (publish) | PAT                     | `packages:write`, `contents:write`      |
| Local development (install) | PAT                     | `packages:read`                         |
| Vercel build (install only) | PAT (read-only)         | `packages:read`                         |
| GitHub Actions (publish)    | Built-in `GITHUB_TOKEN` | `packages:write` (granted via workflow) |

---

### 11.8 Full Setup Checklist Summary

**Library repo (do once)**

- [ ] Private GitHub repo created: `ui-common-mortgagex`
- [ ] `"private": true` removed, `publishConfig` added to `package.json`
- [ ] `.npmrc` added with GitHub Packages registry
- [ ] PAT created with `packages:write` scope
- [ ] `GITHUB_TOKEN` set in local shell
- [ ] First build passes: `npm run build`
- [ ] First publish succeeds: `npm publish`
- [ ] Package visible at `github.com/orgs/YOUR_ORG/packages`
- [ ] GitHub Actions workflow added (optional)

**Per tenant project (repeat for each)**

- [ ] `.npmrc` added with GitHub Packages registry
- [ ] `GITHUB_TOKEN` set locally
- [ ] `npm install @mortgagex/ui-common` resolves successfully
- [ ] `GITHUB_TOKEN` added to Vercel environment variables
- [ ] Vercel deployment succeeds with library installed
- [ ] Tailwind config extended from library
- [ ] CSS tokens imported in `global.css`
