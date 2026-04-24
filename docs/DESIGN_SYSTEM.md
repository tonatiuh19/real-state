# Design System Reference

> Extracted from the web app — use this as the source of truth when bootstrapping the React Native app.

---

## General Info

### What is Encore Mortgage?

**Encore Mortgage** is a **multi-tenant SaaS CRM and loan origination platform** built for mortgage companies. It digitizes and streamlines the entire residential mortgage process — from public application submission to loan funding — connecting three types of users on a single platform.

### Who Uses It

| User Type             | Role in DB    | Description                                                                                                    |
| --------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| **Mortgage Banker**   | `admin`       | The primary operator. Full access to all features, pipeline, team management, reports, settings.               |
| **Partner (Realtor)** | `broker`      | A real estate agent linked to the mortgage company. Limited access, can view their own referred loans.         |
| **Client (Borrower)** | `client_user` | The home buyer. Uses the self-service client portal to upload documents, complete tasks, and track their loan. |

### Core Workflow

```
1. Client submits loan application via public wizard (or broker creates it manually)
        ↓
2. Mortgage Banker reviews, assigns loan to a broker and optionally a Realtor partner
        ↓
3. Loan moves through the pipeline stages:
   draft → app_sent → application_received → prequalified → preapproved
   → under_contract_loan_setup → submitted_to_underwriting
   → approved_with_conditions → clear_to_close → docs_out → loan_funded
        ↓
4. Broker assigns tasks to client (document uploads, form fills, e-signatures)
        ↓
5. Client completes tasks via the client portal
        ↓
6. Broker reviews and approves tasks
        ↓
7. Automated reminders, email/SMS/WhatsApp communications sent at each stage
        ↓
8. Broker generates pre-approval letter and MISMO 3.4 XML export for underwriting
        ↓
9. Loan funded — metrics logged to broker dashboard and reports
```

### Key Feature Modules

| Module                      | Description                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**               | KPIs, broker performance metrics (lead-to-credit, credit-to-close ratios), monthly goal tracking                    |
| **Pipeline**                | Kanban/list view of all loan applications by status. Assign brokers and Realtor partners.                           |
| **Client Portal**           | Borrower-facing portal at `/portal`. Task list, document uploads, form submissions, e-signatures.                   |
| **Task System**             | Configurable task templates (document collection, form fields, PDF signature zones). Broker approves each task.     |
| **Documents**               | Centralized document library. All uploads tied to tasks, stored via CDN (disruptinglabs.com).                       |
| **Conversations**           | Unified inbox for inbound/outbound email, SMS, and WhatsApp per client/loan thread.                                 |
| **Communication Templates** | Reusable templates per channel (email, SMS, WhatsApp). Assignable per pipeline step.                                |
| **Reminder Flows**          | Visual flow builder (nodes + edges) for automated multi-step reminder sequences. Triggered by pipeline events.      |
| **Scheduler**               | Public booking page for clients. Admins manage availability windows, meeting types (phone/video), Zoom integration. |
| **Pre-Approval Letters**    | HTML-template letters tied to a loan. Editable approved amount (capped at max set by admin), emailable to client.   |
| **MISMO Export**            | One-click MISMO 3.4 XML export per loan for underwriting submission.                                                |
| **Reports**                 | Revenue, performance, and overview analytics with CSV/PDF export.                                                   |
| **Audit Logs**              | Full activity log of all broker/client actions with entity context.                                                 |
| **Settings**                | Tenant-level settings (company info, NMLS, notification preferences).                                               |
| **Team Management**         | Admins invite/manage Partner brokers and other Mortgage Bankers.                                                    |
| **Section Controls**        | Per-tenant sidebar section enable/disable toggles (DB-driven).                                                      |

### Multi-Tenancy

The platform is **multi-tenant** — a single codebase and database serves multiple mortgage companies. Each tenant is identified by:

- `tenant_id` on every table row
- A `tenants` table record with `slug`, custom domain, branding overrides (colors, logo, font), and company info
- Session tokens are tenant-scoped; brokers cannot cross tenant boundaries

**Current tenants in production:**

- `tenant_id: 1` → **Encore Mortgage** (`encoremortgage.us`) — primary tenant
- `tenant_id: 2` → **The Mortgage Professionals** (`themortgageprofessionals.net`) — secondary tenant

### Tech Stack Summary

| Layer          | Technology                                                                               |
| -------------- | ---------------------------------------------------------------------------------------- |
| Frontend       | React 18, TypeScript, Vite, TailwindCSS 3, Redux Toolkit, React Router v6, Framer Motion |
| Backend        | Node.js, Express (single `api/index.ts` file, ~15k lines), JWT auth                      |
| Database       | MySQL 5.7 / 8.0 (hosted on HostGator cPanel), 38+ tables                                 |
| Communications | Resend + Office365 (email), Twilio (SMS + WhatsApp), IMAP/Graph inbound sync             |
| Storage/CDN    | disruptinglabs.com CDN for profile images and documents                                  |
| Video Meetings | Zoom API (for video meeting type in Scheduler)                                           |
| Deployment     | Vercel (serverless functions) + HostGator MySQL                                          |
| OTP Auth       | Passwordless — 6-digit code delivered via email or SMS                                   |

### Vercel Deployment & API Routing

The entire app is deployed as a **single Vercel project**. The `vercel.json` routing config maps all traffic:

```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.ts" },
    { "src": "/(.*\\.(js|css|...static))", "dest": "/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

| Path pattern                     | Handled by                                  | Description                                                   |
| -------------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `/api/*`                         | `api/index.ts` (Vercel Serverless Function) | Every API call — Express app wrapped as a serverless function |
| `/*.js`, `/*.css`, static assets | `dist/` (Vite build output)                 | Compiled frontend assets                                      |
| Everything else `/*`             | `index.html`                                | React SPA — client-side routing handles the rest              |

**How it works:**

- `api/index.ts` is the single Express app. Vercel treats it as a serverless function automatically because the file lives inside the `/api` directory.
- There is **no separate server process** — every request to `/api/*` cold-starts (or reuses) a Node.js Lambda on Vercel's edge infrastructure.
- The frontend is **statically served** from the `dist/` folder produced by `npm run build` (Vite).
- Both frontend and API share the **same domain and port** — no CORS issues in production.

**For React Native (and any external client):**

- All API calls go to `https://<your-vercel-domain>/api/<endpoint>`
- Example: `https://real-state-one-omega.vercel.app/api/admin/auth/send-code`
- Set `BASE_URL` in `.env` to override the domain (used by `getBaseUrl()` helper in the API)

### Loan Application Status Enum (Full Pipeline)

```
draft
app_sent
application_received
prequalified
preapproved
under_contract_loan_setup
submitted_to_underwriting
approved_with_conditions
clear_to_close
docs_out
loan_funded
```

> **Note:** `draft` is the initial state when a Mortgage Banker creates a loan manually (before the app is formally sent). The **Pipeline Kanban** board displays 9 of these 11 statuses as columns — it skips `app_sent` and `prequalified` as standalone columns (those statuses still exist in the DB and trigger reminder flows, but loans at those stages appear in the `draft`/`application_received` columns on the board).

### Loan Types

- `purchase` — New home purchase
- `refinance` — Refinance of existing mortgage

### Citizenship Status (collected at application)

- `us_citizen` · `permanent_resident` · `non_resident` · `other`

### Database Tables (38 tables)

| Table                          | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `tenants`                      | Multi-tenant company records with branding config           |
| `brokers`                      | All broker accounts (admin + partner roles)                 |
| `broker_profiles`              | Extended profile info (bio, office, social links, avatar)   |
| `broker_monthly_metrics`       | Monthly performance goals and actuals per broker            |
| `broker_sessions`              | OTP session tokens for broker auth                          |
| `clients`                      | Client/borrower accounts                                    |
| `user_profiles`                | Extended client profile (income, employment, credit score)  |
| `user_sessions`                | OTP session tokens for client auth                          |
| `loan_applications`            | Core loan record with full pipeline status                  |
| `application_status_history`   | Immutable log of every loan status change                   |
| `tasks`                        | Task instances linked to a loan + client                    |
| `task_templates`               | Reusable task definitions (form, document, sign)            |
| `task_form_fields`             | Field definitions for form-type tasks                       |
| `task_form_responses`          | Client-submitted form responses                             |
| `task_documents`               | Documents uploaded against a task                           |
| `task_sign_documents`          | PDF + signature zone config for sign tasks                  |
| `task_signatures`              | Collected client signatures                                 |
| `documents`                    | Global document records                                     |
| `templates`                    | Email/SMS/WhatsApp message templates with variable support  |
| `pipeline_step_templates`      | Maps templates to pipeline stages and channels              |
| `pre_approval_letters`         | HTML pre-approval letters per loan                          |
| `conversation_threads`         | Per-client message threads                                  |
| `communications`               | Individual messages within threads                          |
| `conversation_email_mailboxes` | Configured shared/personal inbox providers (Office365/IMAP) |
| `reminder_flows`               | Visual reminder flow definitions                            |
| `reminder_flow_steps`          | Step nodes within a flow                                    |
| `reminder_flow_connections`    | Edge connections between flow steps                         |
| `reminder_flow_executions`     | Active flow runs per client/loan                            |
| `leads`                        | Pre-application lead captures                               |
| `lead_activities`              | Activity history per lead                                   |
| `notifications`                | In-app notifications for clients                            |
| `campaigns`                    | Bulk communication campaigns                                |
| `campaign_recipients`          | Per-recipient status for campaigns                          |
| `audit_logs`                   | Full broker+client action history                           |
| `admin_section_controls`       | Per-tenant sidebar section disable toggles                  |
| `system_settings`              | Tenant-level configuration key-value store                  |
| `compliance_checklists`        | Compliance requirement checklists                           |
| `compliance_checklist_items`   | Individual checklist items                                  |
| `contact_submissions`          | Public contact form submissions                             |
| `environment_keys`             | Stored per-tenant service credentials                       |

---

## Logo

| Usage              | URL                                                             |
| ------------------ | --------------------------------------------------------------- |
| Primary logo (PNG) | `https://disruptinglabs.com/data/encore/assets/images/logo.png` |
| Favicon            | `public/favicon.ico`                                            |

---

## Typography

### Font Family

**Inter** — imported from Google Fonts

```
https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap
```

### Font Weights

| Weight    | Value | Usage                 |
| --------- | ----- | --------------------- |
| Regular   | 400   | Body text, labels     |
| SemiBold  | 600   | Subheadings, emphasis |
| Bold      | 700   | Headings              |
| ExtraBold | 800   | Hero/display text     |

> In React Native, use Expo Google Fonts (`@expo-google-fonts/inter`) or bundle the Inter .ttf files directly.

---

## Color Palette

All colors are defined as HSL CSS variables. Computed HEX values are provided for React Native.

### Light Mode

| Token                    | HSL           | HEX (approx) | Description                           |
| ------------------------ | ------------- | ------------ | ------------------------------------- |
| `background`             | `0 0% 98%`    | `#FAFAFA`    | App/screen background                 |
| `foreground`             | `345 71% 4%`  | `#110309`    | Default text                          |
| `card`                   | `0 0% 100%`   | `#FFFFFF`    | Card/surface background               |
| `card-foreground`        | `345 71% 4%`  | `#110309`    | Text on cards                         |
| `primary`                | `352 91% 54%` | `#F41F3B`    | Brand red — buttons, CTAs, highlights |
| `primary-foreground`     | `0 0% 98%`    | `#FAFAFA`    | Text on primary                       |
| `secondary`              | `355 40% 96%` | `#F7EEEE`    | Subtle background tint                |
| `secondary-foreground`   | `345 47% 11%` | `#2C0B14`    | Text on secondary                     |
| `muted`                  | `0 0% 96%`    | `#F5F5F5`    | Disabled/inactive background          |
| `muted-foreground`       | `0 0% 47%`    | `#787878`    | Placeholder & hint text               |
| `accent`                 | `355 60% 96%` | `#F7EBEB`    | Accent surface                        |
| `accent-foreground`      | `345 47% 11%` | `#2C0B14`    | Text on accent                        |
| `destructive`            | `0 84% 60%`   | `#F03838`    | Errors, delete, danger                |
| `destructive-foreground` | `0 0% 98%`    | `#FAFAFA`    | Text on destructive                   |
| `border`                 | `355 20% 91%` | `#E8DDDD`    | Dividers and input borders            |
| `input`                  | `355 20% 91%` | `#E8DDDD`    | Input border                          |
| `ring`                   | `352 91% 54%` | `#F41F3B`    | Focus ring — same as primary          |

### Dark Mode

| Token              | HSL             | HEX (approx) | Description            |
| ------------------ | --------------- | ------------ | ---------------------- |
| `background`       | `345 30% 4.9%`  | `#100508`    | Dark screen background |
| `foreground`       | `0 0% 98%`      | `#FAFAFA`    | Text on dark           |
| `card`             | `345 30% 4.9%`  | `#100508`    | Dark card surface      |
| `primary`          | `352 91% 54%`   | `#F41F3B`    | Same brand red         |
| `secondary`        | `345 20% 17.5%` | `#30151A`    | Dark secondary surface |
| `muted`            | `345 15% 17.5%` | `#2E1619`    | Dark muted surface     |
| `muted-foreground` | `0 0% 65.1%`    | `#A6A6A6`    | Subdued text on dark   |
| `accent`           | `352 40% 25%`   | `#5C1B24`    | Dark accent            |
| `destructive`      | `0 62.8% 30.6%` | `#7A1313`    | Dark destructive       |
| `border`           | `345 20% 17.5%` | `#30151A`    | Dark borders           |
| `ring`             | `352 91% 65%`   | `#F5526A`    | Focus ring on dark     |

### Sidebar Colors (Admin Panel)

| Token                        | Light HEX | Dark HEX  |
| ---------------------------- | --------- | --------- |
| `sidebar-background`         | `#FAFAFA` | `#1A0A0E` |
| `sidebar-foreground`         | `#3D2528` | `#F2F2F2` |
| `sidebar-primary`            | `#2C0B14` | `#F41F3B` |
| `sidebar-primary-foreground` | `#FAFAFA` | `#FFFFFF` |
| `sidebar-accent`             | `#EFE2E2` | `#29131A` |
| `sidebar-border`             | `#E4D7D7` | `#29131A` |
| `sidebar-ring`               | `#F41F3B` | `#F41F3B` |

---

## Border Radius

| Token      | Value                       | Computed |
| ---------- | --------------------------- | -------- |
| `--radius` | `0.75rem`                   | `12px`   |
| `lg`       | `var(--radius)`             | `12px`   |
| `md`       | `calc(var(--radius) - 2px)` | `10px`   |
| `sm`       | `calc(var(--radius) - 4px)` | `8px`    |

---

## Spacing Scale (Tailwind defaults, rem-based)

React Native uses dp (density-independent pixels). Use this conversion: `1rem = 16px`.

| Tailwind | px   | RN (dp) |
| -------- | ---- | ------- |
| `1`      | 4px  | 4       |
| `2`      | 8px  | 8       |
| `3`      | 12px | 12      |
| `4`      | 16px | 16      |
| `6`      | 24px | 24      |
| `8`      | 32px | 32      |
| `10`     | 40px | 40      |
| `12`     | 48px | 48      |
| `16`     | 64px | 64      |

---

## Animations

| Name            | Duration | Easing            | Notes            |
| --------------- | -------- | ----------------- | ---------------- |
| Accordion open  | `200ms`  | `ease-out`        | Height expansion |
| Accordion close | `200ms`  | `ease-out`        | Height collapse  |
| Spin slow       | `3s`     | `linear infinite` | Loading spinners |

In React Native use `Animated` API or `react-native-reanimated` to replicate these.

---

## React Native Theme File Starter

Paste this into your RN project as `src/theme.ts`:

```typescript
export const Colors = {
  // Primary brand
  primary: "#F41F3B",
  primaryForeground: "#FAFAFA",

  // Backgrounds
  background: "#FAFAFA",
  card: "#FFFFFF",
  surface: "#FFFFFF",

  // Text
  foreground: "#110309",
  mutedForeground: "#787878",

  // Secondary
  secondary: "#F7EEEE",
  secondaryForeground: "#2C0B14",

  // Muted
  muted: "#F5F5F5",

  // Accent
  accent: "#F7EBEB",
  accentForeground: "#2C0B14",

  // Destructive
  destructive: "#F03838",
  destructiveForeground: "#FAFAFA",

  // Borders & inputs
  border: "#E8DDDD",
  input: "#E8DDDD",
  ring: "#F41F3B",
} as const;

export const DarkColors: typeof Colors = {
  primary: "#F41F3B",
  primaryForeground: "#FAFAFA",
  background: "#100508",
  card: "#100508",
  surface: "#1A0A0E",
  foreground: "#FAFAFA",
  mutedForeground: "#A6A6A6",
  secondary: "#30151A",
  secondaryForeground: "#FAFAFA",
  muted: "#2E1619",
  accent: "#5C1B24",
  accentForeground: "#FAFAFA",
  destructive: "#7A1313",
  destructiveForeground: "#FAFAFA",
  border: "#30151A",
  input: "#30151A",
  ring: "#F5526A",
};

export const Typography = {
  fontFamily: {
    regular: "Inter_400Regular",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
    extraBold: "Inter_800ExtraBold",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const BorderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  full: 9999,
};

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};
```

---

## Assets Checklist for React Native

- [ ] Download logo PNG: `https://disruptinglabs.com/data/encore/assets/images/logo.png`
- [ ] Export logo in `1x`, `2x`, `3x` sizes for RN's `Image` component
- [ ] Install Inter font via `@expo-google-fonts/inter` (Expo) or bundle `.ttf` files manually (bare RN)
- [ ] Set up light/dark theme context using `Colors` / `DarkColors` above
- [ ] Use `react-native-reanimated` for smooth animations matching the web app feel

---

## Authentication

The app has **two completely separate auth systems** — one for brokers/admins and one for clients. Both use a **passwordless OTP (one-time passcode)** flow.

---

### 1. Broker / Admin Login

**Route:** `/admin/login` → redirects to `/admin` on success

#### Flow

```
[Email Input Screen]
       │
       │  POST /api/admin/auth/send-code
       │  { email, delivery_method: "email" | "sms" }
       ▼
[OTP Code Screen]
       │
       │  POST /api/admin/auth/verify-code
       │  { email, code }
       ▼
[Session Created]
  • sessionToken saved to localStorage key: "broker_session"
  • user object saved to localStorage key: "broker_user"
  • Redux state: brokerAuth.isAuthenticated = true
       │
       ▼
[Redirect → /admin]
```

#### Delivery methods

The user can choose to receive the OTP via **email** or **SMS** before submitting.

#### Session persistence

| Storage key                      | Content                             |
| -------------------------------- | ----------------------------------- |
| `localStorage["broker_session"]` | Bearer token string                 |
| `localStorage["broker_user"]`    | JSON-serialized `BrokerUser` object |

On app load, both keys are read to rehydrate the Redux `brokerAuth` slice — no login required if a valid session exists.

#### Session validation endpoint

`GET /api/admin/auth/validate` — called on app boot to verify the stored token is still valid.

#### Broker user object shape

```typescript
interface BrokerUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string; // e.g. "admin", "broker"
  tenant_id: number;
  status: "active" | "inactive" | "suspended";
  license_number?: string;
  specializations?: string[];
  email_verified: boolean;
  last_login?: string;
  public_token?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  office_address?: string | null;
  office_city?: string | null;
  office_state?: string | null;
  office_zip?: string | null;
  years_experience?: number | null;
  total_loans_closed?: number;
}
```

#### Redux slice: `brokerAuth`

| Field             | Type                 | Description               |
| ----------------- | -------------------- | ------------------------- |
| `user`            | `BrokerUser \| null` | Authenticated broker      |
| `sessionToken`    | `string \| null`     | Bearer token              |
| `isAuthenticated` | `boolean`            | Gate for protected routes |
| `loading`         | `boolean`            | Any async in-flight       |
| `error`           | `string \| null`     | Last auth error message   |

All protected API calls attach the token as:

```
Authorization: Bearer <sessionToken>
```

---

### 2. Client Login

**Route:** `/client/login` → redirects to `/portal` on success (or `/wizard` for new clients)

#### Flow

```
[Email Input Screen]
       │
       │  POST /api/client/auth/send-code
       │  { email, delivery_method: "email" | "sms" }
       │
       ├─── Client NOT found in DB ──→ shouldRedirectToWizard = true
       │                                       │
       │                                       ▼
       │                              [Redirect → /wizard]
       │                              (new client onboarding)
       │
       └─── Client found ──────────→ [OTP Code Screen]
                                              │
                                              │  POST /api/client/auth/verify-code
                                              │  { email, code }
                                              ▼
                                     [Session Created]
                                       • sessionToken saved to localStorage
                                         key: "client_session_token"
                                       • Redux: clientAuth.isAuthenticated = true
                                              │
                                              ▼
                                     [Redirect → /portal]
```

#### Code validation rules

- Must be exactly **6 numeric digits** (`/^\d{6}$/`)
- Validated client-side with Yup before the API call is made

#### Session persistence

| Storage key                            | Content             |
| -------------------------------------- | ------------------- |
| `localStorage["client_session_token"]` | Bearer token string |

Unlike broker auth, the client object is **not** persisted to localStorage — it is fetched fresh from the API when the session is validated on app load.

#### Session validation endpoint

`GET /api/client/auth/validate` — called on app boot with the stored token.

#### Redux slice: `clientAuth`

| Field                    | Type                 | Description                                                        |
| ------------------------ | -------------------- | ------------------------------------------------------------------ |
| `client`                 | `ClientInfo \| null` | Authenticated client details                                       |
| `sessionToken`           | `string \| null`     | Bearer token                                                       |
| `isAuthenticated`        | `boolean`            | Gate for `/portal` routes                                          |
| `shouldRedirectToWizard` | `boolean`            | Set when client email is unknown — triggers redirect to onboarding |
| `sendCodeLoading`        | `boolean`            | OTP send in-flight                                                 |
| `verifyCodeLoading`      | `boolean`            | OTP verify in-flight                                               |
| `error`                  | `string \| null`     | Last auth error message                                            |

---

### Comparison Table

|                           | Broker Auth                        | Client Auth                         |
| ------------------------- | ---------------------------------- | ----------------------------------- |
| Login route               | `/admin/login`                     | `/client/login`                     |
| Send code endpoint        | `POST /api/admin/auth/send-code`   | `POST /api/client/auth/send-code`   |
| Verify code endpoint      | `POST /api/admin/auth/verify-code` | `POST /api/client/auth/verify-code` |
| Validate session endpoint | `GET /api/admin/auth/validate`     | `GET /api/client/auth/validate`     |
| Storage key               | `broker_session`                   | `client_session_token`              |
| User persisted to storage | Yes (`broker_user`)                | No                                  |
| Post-login destination    | `/admin`                           | `/portal`                           |
| New user handling         | N/A                                | Redirect to `/wizard`               |
| OTP delivery              | Email or SMS                       | Email or SMS                        |
| Redux slice               | `brokerAuth`                       | `clientAuth`                        |

---

### React Native Auth Notes

- Replace `localStorage` with **`AsyncStorage`** (or `expo-secure-store` for the token).
- The OTP delivery method toggle (email vs SMS) should be a simple toggle/radio before the "Send Code" button.
- The 6-digit code input works well as a row of 6 individual `TextInput` boxes (auto-advance on each digit) or a single `TextInput` with `keyboardType="number-pad"` and `maxLength={6}`.
- Validate the code format client-side before dispatching the verify action (same Yup rule: `/^\d{6}$/`).
- Use `SecureStore.setItemAsync` / `getItemAsync` from `expo-secure-store` instead of `localStorage` for the session token.
- On app boot, read the stored token and call the validate endpoint; if it fails (401), clear storage and show the login screen.

---

## Layouts

The app has three layout shells. Every route is wrapped in exactly one of them.

### 1. AppLayout — Public / Marketing Shell

**File:** `client/components/layout/AppLayout.tsx`

The simplest shell. Wraps public-facing pages (home, FAQ, loan options, contact, about).

```
┌──────────────────────────────┐
│          <Navbar />           │  ← optional (showHeader prop)
├──────────────────────────────┤
│                              │
│       <main>{children}       │  ← flex-1, full height
│                              │
├──────────────────────────────┤
│          <Footer />           │  ← optional (showFooter prop)
└──────────────────────────────┘
```

**Props:**
| Prop | Default | Description |
|------|---------|-------------|
| `showHeader` | `true` | Show/hide `<Navbar />` |
| `showFooter` | `true` | Show/hide `<Footer />` |

**Used by routes:** `/`, `/faq`, `/loan-options`, `/about`, `/contact`, `/calculator`

**Login routes** use `AppLayout` too but with both header and footer hidden:

```
/broker-login  → AppLayout showHeader=false showFooter=false
/wizard        → AppLayout showHeader=false showFooter=false
/apply         → AppLayout showHeader=false showFooter=false
/apply/:token  → AppLayout showHeader=false showFooter=false
```

---

### 2. AdminLayout — Broker / Admin Shell

**File:** `client/components/layout/AdminLayout.tsx`

Full dashboard shell with a collapsible sidebar, top header bar, and mobile drawer.

```
┌────────┬─────────────────────────────────────────┐
│        │           Top Header Bar                │
│        │  [Logo]  [Page title]  [User avatar]    │
│        ├─────────────────────────────────────────┤
│ Side-  │                                         │
│  bar   │           <children />                  │
│        │         (scrollable content)            │
│        │                                         │
│        │                                         │
└────────┴─────────────────────────────────────────┘
```

**Sidebar behaviour:**

- Desktop: collapsible (icon-only mode when collapsed). Toggle with `ChevronLeft/Right` button.
- Mobile: hidden by default; opens as a `Sheet` (drawer) via hamburger `Menu` icon.
- Active route is highlighted with `bg-primary/10 text-primary`.
- Disabled items (controlled from DB via `adminSectionControls`) show a `Lock` icon and a `Tooltip` with a custom message.

**Bootstrap sequence on mount:**

1. Check `sessionToken` from Redux — redirect to `/broker-login` if missing.
2. Dispatch `initAdminSession()` which validates the session, loads the broker profile, and loads `adminSectionControls` in a single call.

**Two roles exist in the system** (see [Roles & Permissions](#roles--permissions) for the full breakdown):

- `admin` → **Mortgage Banker** — full access to all sections
- `broker` → **Partner (Realtor)** — restricted view, only sees their own pipeline data

The layout detects this with: `const isPartner = user?.role === "broker";`

**Role-based menu visibility:**
| Section | `admin` (Mortgage Banker) | `broker` (Partner) |
|---------|:---:|:---:|
| Overview | ✓ | ✓ |
| Pipeline | ✓ | ✓ |
| Clients & Leads | ✓ | ✓ |
| Scheduler | ✓ | ✓ |
| Tasks | ✓ | hidden |
| Documents | ✓ | hidden |
| Communications | ✓ | hidden |
| Reminder Flows | ✓ | hidden |
| Conversations | ✓ | hidden |
| Reports & Analytics | ✓ | hidden |
| People Management | ✓ | hidden |
| Contact Messages | ✓ | hidden |
| Settings | ✓ | hidden |

> **Note:** This is Layer 1 of access control (client-side, role-based). There is also a Layer 2 (DB-driven section disabling via `admin_section_controls`) — see [Roles & Permissions](#roles--permissions).

Full menu items (shown to `admin`):
| Label | Route | Icon |
|-------|-------|------|
| Overview | `/admin` | LayoutDashboard |
| Pipeline | `/admin/pipeline` | Kanban |
| Clients & Leads | `/admin/clients` | Users |
| Tasks | `/admin/tasks` | CheckCircle2 |
| Documents | `/admin/documents` | Briefcase |
| Communications | `/admin/communication-templates` | Mail |
| Reminder Flows | `/admin/reminder-flows` | AlarmClock |
| Conversations | `/admin/conversations` | MessageCircle |
| Reports & Analytics | `/admin/reports` | TrendingUp |
| People Management | `/admin/brokers` | UserCog |
| Contact Messages | `/admin/contact-submissions` | MessageSquare |
| Scheduler | `/admin/scheduler` | CalendarDays |
| Settings | `/admin/settings` | Settings |

**Guard:** Unauthenticated access → redirect to `/broker-login`.

---

### 3. ClientLayout — Client Portal Shell

**File:** `client/components/layout/ClientLayout.tsx`

Minimal shell for authenticated clients. Top navbar with avatar + logout, no sidebar.

```
┌──────────────────────────────────────────────────┐
│  [Logo]  [Nav links]  ...  [Avatar] [Logout]     │  ← sticky top navbar
├──────────────────────────────────────────────────┤
│                                                  │
│              <children />                        │
│          (scrollable content)                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Mobile:** Hamburger menu opens a full-screen overlay with the nav links.

**nav items:**
| Label | Route | Icon |
|-------|-------|------|
| Dashboard | `/portal` | Home |
| My Loans | `/portal/loans` | FileText |
| Tasks | `/portal/tasks` | CheckSquare |
| Documents | `/portal/documents` | FolderOpen |
| Calculator | `/portal/calculator` | Calculator |
| Profile | `/portal/profile` | User |

**Guard:** Unauthenticated access → redirect to `/client-login`.

**Client identity:** Avatar shows initials derived from `client.first_name` + `client.last_name` read from `clientAuth` Redux slice.

---

### Layout Selection Rules (summary)

| Route pattern                      | Layout                      | Auth required  |
| ---------------------------------- | --------------------------- | -------------- |
| `/` `/faq` `/about` etc.           | `AppLayout`                 | No             |
| `/broker-login` `/wizard` `/apply` | `AppLayout` (no nav/footer) | No             |
| `/client-login`                    | No layout wrapper           | No             |
| `/portal/*`                        | `ClientLayout`              | Client session |
| `/admin/*`                         | `AdminLayout`               | Broker session |

---

## Roles & Permissions

The admin panel has **two internal user roles** stored in the `brokers` table (`role` enum). There is no separate roles table — the role is a field on the broker record.

### Role Definitions

| Role value | Display name        | Who it is                                                                                                         |
| ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `admin`    | **Mortgage Banker** | The primary licensed loan officer / account owner. Full access. Created by the tenant setup.                      |
| `broker`   | **Partner**         | A Realtor/external partner invited by a Mortgage Banker. Restricted view — only sees their own assigned pipeline. |

> **DB column:** `brokers.role` → `enum('broker', 'admin')` with default `'broker'`  
> **DB column:** `brokers.created_by_broker_id` → the `id` of the Mortgage Banker who invited this partner

---

### Layer 1 — Role-Based Visibility (client-side)

Controlled in `AdminLayout.tsx` via:

```typescript
const isPartner = user?.role === "broker";
// Each menu item has: hidden: isPartner
```

When `isPartner` is `true`, these sections are **completely removed** from the sidebar DOM — the Partner cannot navigate to them at all:

| Section             | `section_id`              | Admin sees | Partner sees |
| ------------------- | ------------------------- | :--------: | :----------: |
| Overview            | `dashboard`               |     ✓      |      ✓       |
| Pipeline            | `pipeline`                |     ✓      |      ✓       |
| Clients & Leads     | `clients`                 |     ✓      |      ✓       |
| Scheduler           | `scheduler`               |     ✓      |      ✓       |
| Tasks               | `tasks`                   |     ✓      |      —       |
| Documents           | `documents`               |     ✓      |      —       |
| Communications      | `communication-templates` |     ✓      |      —       |
| Reminder Flows      | `reminder-flows`          |     ✓      |      —       |
| Conversations       | `conversations`           |     ✓      |      —       |
| Reports & Analytics | `reports`                 |     ✓      |      —       |
| People Management   | `brokers`                 |     ✓      |      —       |
| Contact Messages    | `contact-submissions`     |     ✓      |      —       |
| Settings            | `settings`                |     ✓      |      —       |

---

### Layer 2 — DB-Controlled Section Disabling (tenant-wide)

This is a second, independent layer on top of role visibility. Even sections visible to an `admin` can be **disabled per-tenant** from the database.

**Table:** `admin_section_controls`

| Column            | Type         | Description                                              |
| ----------------- | ------------ | -------------------------------------------------------- |
| `section_id`      | varchar(100) | Matches the menu item `id` string (e.g. `"pipeline"`)    |
| `is_disabled`     | tinyint(1)   | `1` = locked, shows tooltip instead of navigating        |
| `tooltip_message` | varchar(255) | Custom message shown on hover (default: `"Coming Soon"`) |
| `tenant_id`       | int          | Scoped per-tenant                                        |

**How it applies in the UI:**

1. On admin login, `initAdminSession()` fetches controls from `GET /api/admin/section-controls` and stores them in `adminSectionControls` Redux slice.
2. `AdminLayout` reads this map via `selectSectionControlsMap` selector.
3. If `ctrl.is_disabled === true` for a visible item, the button renders with:
   - `opacity-60 cursor-not-allowed` styling
   - A `Lock` icon on the right
   - A `Tooltip` showing `tooltip_message` on hover
   - Click is swallowed — navigation does not happen

**Current DB seed state (all sections enabled):**

| section_id                | is_disabled |
| ------------------------- | :---------: |
| `dashboard`               |    false    |
| `pipeline`                |    false    |
| `clients`                 |    false    |
| `tasks`                   |    false    |
| `documents`               |    false    |
| `communication-templates` |    false    |
| `reminder-flows`          |    false    |
| `conversations`           |    false    |
| `reports`                 |    false    |
| `brokers`                 |    false    |
| `settings`                |    false    |
| `scheduler`               |    false    |

**API endpoints:**

- `GET /api/admin/section-controls` → returns all controls for the session's tenant
- `PUT /api/admin/section-controls` → bulk-update `is_disabled` + `tooltip_message`

---

### Combined Access Decision Logic

```
Can user access a section?
         │
         ▼
  role === "broker"? ──yes──→ Is it in the 4 partner-visible sections?
         │                            │
         │                     no ──→ HIDDEN (not rendered)
         │                     yes ──→ ↓
         │
         no (admin)
         │
         ▼
  is_disabled === true in DB? ──yes──→ SHOWN but LOCKED (tooltip)
         │
         no
         ▼
      FULLY ACCESSIBLE
```

### React Native Permissions Notes

- Read `user.role` from the `brokerAuth` Redux slice to gate navigation items, same as web.
- Fetch section controls on app boot (part of `initAdminSession` flow) and store in Redux.
- Use the combined logic above to decide whether to render a tab/drawer item, render it disabled, or hide it entirely.
- Partners should only ever be shown 4 navigator items: Overview, Pipeline, Clients & Leads, Scheduler.

---

## Redux Store

**File:** `client/store/index.ts`  
**Hooks:** `useAppDispatch` / `useAppSelector` from `client/store/hooks.ts`

### Store Shape

The root state is composed of 23 slices:

| Slice key                | File                             | Owned by     | Purpose                            |
| ------------------------ | -------------------------------- | ------------ | ---------------------------------- |
| `brokerAuth`             | `brokerAuthSlice.ts`             | Admin        | Session, user profile, token       |
| `clientAuth`             | `clientAuthSlice.ts`             | Client       | Session, client info, token        |
| `applications`           | `applicationsSlice.ts`           | Admin        | Loan applications list & detail    |
| `leads`                  | `leadsSlice.ts`                  | Admin        | Lead records                       |
| `documents`              | `documentsSlice.ts`              | Admin/Client | Document uploads & metadata        |
| `tasks`                  | `tasksSlice.ts`                  | Admin/Client | Task management                    |
| `notifications`          | `notificationsSlice.ts`          | Admin        | In-app notifications               |
| `pipeline`               | `pipelineSlice.ts`               | Admin        | Kanban pipeline state              |
| `clients`                | `clientsSlice.ts`                | Admin        | Client directory                   |
| `brokers`                | `brokersSlice.ts`                | Admin        | Broker/team members                |
| `communicationTemplates` | `communicationTemplatesSlice.ts` | Admin        | Email/SMS templates                |
| `conversations`          | `conversationsSlice.ts`          | Admin        | Message threads                    |
| `dashboard`              | `dashboardSlice.ts`              | Admin        | Overview metrics                   |
| `clientPortal`           | `clientPortalSlice.ts`           | Client       | Portal-specific data               |
| `auditLogs`              | `auditLogsSlice.ts`              | Admin        | Activity history                   |
| `reports`                | `reportsSlice.ts`                | Admin        | Analytics data                     |
| `applicationWizard`      | `applicationWizardSlice.ts`      | Public       | Multi-step application form state  |
| `preApproval`            | `preApprovalSlice.ts`            | Admin/Client | Pre-approval letter data           |
| `settings`               | `settingsSlice.ts`               | Admin        | Tenant configuration               |
| `reminderFlows`          | `reminderFlowsSlice.ts`          | Admin        | Automated reminder sequences       |
| `adminSectionControls`   | `adminSectionControlsSlice.ts`   | Admin        | Per-section enable/disable from DB |
| `contactSubmissions`     | `contactSubmissionsSlice.ts`     | Admin        | Public contact form submissions    |
| `scheduler`              | `schedulerSlice.ts`              | Admin        | Appointment scheduling             |

### Middleware

- **`serializableCheck`** ignores these action types to allow non-serializable payloads (e.g. Date objects):
  - `clientAuth/login/fulfilled`
  - `clientAuth/verify/fulfilled`
  - `brokerAuth/verifyCode/fulfilled`

### Usage Pattern

```typescript
// Always use typed hooks — never plain useDispatch/useSelector
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// Reading state
const { user, isAuthenticated } = useAppSelector((state) => state.brokerAuth);

// Dispatching async thunks
const dispatch = useAppDispatch();
dispatch(fetchSomeData());
```

### Data Fetching Convention

All API calls live in slice files via `createAsyncThunk`. Components **never** call axios directly.

```typescript
// ✅ In slice
export const fetchClients = createAsyncThunk(
  "clients/fetch",
  async (_, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.get("/api/admin/clients", {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    return data;
  },
);

// ✅ In component
useEffect(() => {
  dispatch(fetchClients());
}, [dispatch]);
const { clients, loading } = useAppSelector((state) => state.clients);
```

### React Native Store Notes

- The same slice structure can be used in RN — Redux Toolkit works identically.
- Replace `localStorage` reads in `initialState` with `AsyncStorage` (or `expo-secure-store`) using an async rehydration pattern (e.g. `redux-persist` or a manual `loadState()` on app boot).
- The `serializableCheck` ignored actions list should be carried over as-is.

---

## Routing Overview

The app is a **SPA** using React Router v6 with three layout zones:

### Public Routes

| Path                  | Page                     | Notes                     |
| --------------------- | ------------------------ | ------------------------- |
| `/`                   | `Index` (marketing home) |                           |
| `/faq`                | `FAQ`                    |                           |
| `/loan-options`       | `LoanOptions`            |                           |
| `/about`              | `About`                  |                           |
| `/contact`            | `Contact`                |                           |
| `/calculator`         | `ClientCalculator`       | Embedded in AppLayout     |
| `/broker-login`       | `BrokerLogin`            | No nav/footer             |
| `/client-login`       | `ClientLogin`            | No layout wrapper         |
| `/wizard`             | `ApplicationWizard`      | New client onboarding     |
| `/apply`              | `ApplicationWizard`      | Alias for `/wizard`       |
| `/apply/:brokerToken` | `ApplicationWizard`      | Pre-loads specific broker |

### Client Portal Routes (`/portal/*`)

All wrapped in `ClientLayout`. Require client session.

| Path                 | Page               |
| -------------------- | ------------------ |
| `/portal`            | `ClientDashboard`  |
| `/portal/loans`      | `ClientLoans`      |
| `/portal/tasks`      | `ClientTasks`      |
| `/portal/documents`  | `ClientDocuments`  |
| `/portal/calculator` | `ClientCalculator` |
| `/portal/profile`    | `ClientProfile`    |

### Admin Routes (`/admin/*`)

All wrapped in `AdminLayout`. Require broker session.

| Path                             | Page                     |
| -------------------------------- | ------------------------ |
| `/admin`                         | `AdminDashboard`         |
| `/admin/pipeline`                | `Pipeline`               |
| `/admin/clients`                 | `Clients`                |
| `/admin/tasks`                   | `Tasks`                  |
| `/admin/documents`               | `Documents`              |
| `/admin/communication-templates` | `CommunicationTemplates` |
| `/admin/conversations`           | `Conversations`          |
| `/admin/reports`                 | `Reports`                |
| `/admin/brokers`                 | `Brokers`                |
| `/admin/broker/:id`              | `BrokerProfile`          |
| `/admin/reminder-flows`          | `ReminderFlows`          |
| `/admin/contact-submissions`     | `ContactSubmissions`     |
| `/admin/scheduler`               | `AdminScheduler`         |
| `/admin/settings`                | `Settings`               |

### React Native Navigation Notes

- Map each layout zone to a **Navigator**:
  - `AppLayout` → `Stack.Navigator` (no persistent chrome)
  - `ClientLayout` → `Tab.Navigator` (bottom tabs matching the 6 nav items) inside a `Stack.Navigator`
  - `AdminLayout` → `Drawer.Navigator` (sidebar drawer matching the 13 menu items) inside a `Stack.Navigator`
- Auth guards: use `useAppSelector` to check `isAuthenticated` and redirect accordingly from a root navigator.
- The `/apply/:brokerToken` pattern maps to a deep-link or a screen param in RN.

---

## Pipeline Kanban Board

**Route:** `/admin/pipeline` | **File:** `client/pages/admin/Pipeline.tsx`

The Pipeline is a **horizontal Kanban board** — the core loan management view for Mortgage Bankers and Partners.

### Header Controls

| Control                | Behaviour                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Search input           | Real-time filter by applicant name or application number. Shows result count badge when active                        |
| Refresh button         | Re-fetches loans with current filters; shows spinner                                                                  |
| Filters dropdown       | Multi-filter: Status, Priority, Loan Type, Date Range. Badge shows active filter count. "Clear all" resets everything |
| **New Loan** button    | Opens `NewLoanWizard` modal (admin only)                                                                              |
| **Get My Link** button | Opens `BrokerShareLinkModal` for partner's referral link (partner role)                                               |

**Filter options:**

- **Priority:** Urgent 🔥 / High ⚡ / Medium 📋 / Low 📝
- **Loan Type:** Purchase / Refinance
- **Date Range:** Today / This Week / This Month / This Quarter / All Time

### Kanban Columns (9 displayed)

| Column ID                   | Display Name                | Color   |
| --------------------------- | --------------------------- | ------- |
| `draft`                     | Draft                       | Slate   |
| `application_received`      | Application Received        | Blue    |
| `preapproved`               | Pre-Approved                | Teal    |
| `under_contract_loan_setup` | Under Contract / Loan Setup | Yellow  |
| `submitted_to_underwriting` | Submitted to Underwriting   | Orange  |
| `approved_with_conditions`  | Approved with Conditions    | Purple  |
| `clear_to_close`            | Clear to Close              | Indigo  |
| `docs_out`                  | Docs Out                    | Green   |
| `loan_funded`               | Loan Funded                 | Emerald |

> `app_sent` and `prequalified` are DB statuses that trigger reminder flows but are **not shown as separate Kanban columns** — loans in those states appear in adjacent columns.

Each column header shows: name + count badge + short description.

### Loan Card Structure (per card)

```
┌──────────────────────────────┐
│ [Priority color bar top]      │  ← red/orange/blue/gray
│ Client Name                   │
│ #LA00000000   (monospace)     │
│ $440,000      (green)         │
│ [purchase badge]              │
│ 123 Oak Ave, San Francisco    │  ← truncated
│ John Broker   (or [Unassigned]│  ← amber badge if none
│ Mar 1 · Est: Jun 15           │
└──────────────────────────────┘
```

Clicking a card opens the **Loan Detail Sheet** (`LoanOverlay`).

### Drag & Drop

- **Admin only** — Partners cannot drag cards.
- Uses HTML5 drag-and-drop API. Dragged card gets reduced opacity + scale; drop target column highlights with a blue border.
- Dropping across columns triggers a **confirmation AlertDialog** showing the from → to column names with a warning that Reminder Flows will be triggered.
- State: `draggingLoanId` / `dragOverColumnId` tracked in local component state.

### Redux State

- Slice: `pipelineSlice`
- Key actions: `fetchPipelineLoans`, `updateLoanStatus`, `fetchLoanDetails`

---

## Loan Detail Sheet (LoanOverlay)

**File:** `client/components/LoanOverlay.tsx`

A full-height right-side **Sheet** (`sm:max-w-3xl`) that slides in when a loan card is clicked from the Pipeline, Dashboard, or any loan table. This is the central hub for all per-loan actions.

### Header

| Element                 | Description                                                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client full name        | Large heading                                                                                                                                        |
| Application number      | `#ENxxxxxx` monospace badge                                                                                                                          |
| Priority badge          | Color-coded: urgent (red) / high (orange) / medium (blue) / low (gray)                                                                               |
| Pipeline status badge   | Current status label                                                                                                                                 |
| **Export MISMO**        | Downloads MISMO 3.4 XML. Only enabled when all tasks are approved. Hidden for `broker` role                                                          |
| **Pre-Approval Letter** | Opens `PreApprovalLetterModal`. Locked until all tasks approved. Partners see "Waiting for Mortgage Banker" tooltip if tasks done but amount not set |
| **Pre-Approval Banner** | Shown when an active letter exists — displays approved amount, max approved amount cap, and expiry date                                              |

### Sections (rendered in order)

#### 1. Loan Overview

- Metric boxes: **Loan Amount**, **Property Value**, **Down Payment**
- Quick badges: LTV%, loan type, property type, term, interest rate, citizenship status
- Detail grid: Property Address, Contact (email + phone), Application Date, Submitted Date, Est. Close Date, Actual Close Date, Last Updated, Loan Purpose

#### 2. Assigned Mortgage Banker _(admin only)_

Dropdown to assign/reassign from active `admin`-role brokers. Includes an "unassign" option.

#### 3. Assigned Partner _(admin only)_

Same pattern as above but for `broker`-role users.

#### 4. Pipeline Status _(admin only)_

Dropdown to manually move the loan to any pipeline stage. Triggers a **Status Change Confirmation** dialog requiring a mandatory comment (max 500 chars, written to audit trail). Moving stages triggers reminder flows.

#### 5. Lead Source _(admin only)_

Dropdown to set how this loan was sourced. Updates the **Lead Source Analysis** chart on the Dashboard.

| Option                  | Short Code |
| ----------------------- | ---------- |
| Current Client Referral | CCR        |
| Past Client             | PC         |
| Past Client Referral    | PCR        |
| Personal Friend         | PF         |
| Realtor                 | RE         |
| Advertisement           | AD         |
| Business Partner        | BP         |
| Builder                 | BU         |
| Other                   | OT         |

#### 6. Task Progress

Progress bar showing `approved / total` tasks with % complete. "Ready for Export" badge shown when 100% complete. Warning callout when tasks are incomplete.

#### 7. Tasks List

Collapsible task cards. Each card shows:

| Element                          | Description                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Title                            | Strikethrough styling when completed                                                                             |
| Task type badge                  | `document` / `form` / `document_signing`                                                                         |
| Due date                         | With overdue highlight                                                                                           |
| Priority badge                   | urgent / high / medium / low                                                                                     |
| Status dropdown                  | `pending` / `in_progress` / `completed` / `pending_approval` / `approved` / `reopened` / `cancelled` / `overdue` |
| **Approve** + **Reopen** buttons | Shown when status is `pending_approval`                                                                          |
| **Delete** button                | Shown on editable statuses                                                                                       |

**Expanded task sub-sections (revealed on expand):**

- **Form Responses** — field label + client-submitted value pairs
- **PDF Documents** — filename with external "View" link
- **Images** — main image + extras with "View" links
- **Signatures** (for `document_signing` tasks) — signed zones with signature image previews + "View in PDF" button (opens `PDFSigningViewer` in read-only mode)

### Task Actions & Dialogs

| Dialog                         | Trigger                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| **Add Task**                   | "Add Task" button — multi-select list of templates not yet assigned to this loan      |
| **Status Change Confirmation** | Any manual status move — requires mandatory comment                                   |
| **Reopen Task Dialog**         | Reopening an approved/completed task — textarea for feedback sent to client via email |
| **Delete Task Confirmation**   | Shows task title, type, status, and due date before delete                            |
| **Bulk Delete**                | Toggle bulk mode → checkboxes on all tasks → "Delete Selected" button                 |

### Redux State Sources

`pipelineSlice`, `tasksSlice`, `brokersSlice`, `communicationTemplatesSlice`, `preApprovalSlice`, `clientPortalSlice`, `dashboardSlice`

---

## Pre-Approval Letter Modal

**File:** `client/components/PreApprovalLetterModal.tsx`

Opened from the LoanOverlay header via the **Pre-Approval Letter** button. Handles the full lifecycle: create, preview, edit HTML, download PDF, send to client, and delete.

### Props

```typescript
interface PreApprovalLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: number;
  loanAmount: number; // pre-fills the approved amount field
}
```

### Redux Slices Used

| Slice                    | State read                                           | Thunks dispatched                                                                                         |
| ------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `brokerAuth`             | `user` (role, name), `sessionToken`                  | —                                                                                                         |
| `preApproval`            | `letters[loanId]`, `loadingLoanIds`, `savingLoanIds` | `fetchPreApprovalLetter`, `createPreApprovalLetter`, `updatePreApprovalLetter`, `deletePreApprovalLetter` |
| `communicationTemplates` | `emailTemplates`                                     | `fetchEmailTemplates`                                                                                     |

### Three Visual States

The modal shows one of three states depending on data:

1. **Loading** — spinner + "Loading letter..." (while `loadingLoanIds` contains the `loanId`)
2. **No letter → Create Form** — when `letters[loanId]` is `null`
3. **Letter exists → Preview / Edit Tabs** — after a letter is loaded or created

On open, dispatches `fetchPreApprovalLetter(loanId)`.

---

### State 2: Create Form

Uses **Formik + Yup**. `validateOnMount/Change/Blur: true`.

#### Yup Validation

| Field                 | Rules                                                      |
| --------------------- | ---------------------------------------------------------- |
| `max_approved_amount` | positive number, required                                  |
| `approved_amount`     | positive number, required, must be `≤ max_approved_amount` |
| `loan_type`           | required                                                   |
| `fico_score`          | integer, 300–850, required                                 |
| `letter_date`         | date string, required                                      |
| `expires_at`          | date string, required                                      |

#### Create Form Fields

| Field                      | Type                       | Notes                                                                                                                         |
| -------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Maximum Allowed Amount** | `number` input, `$` prefix | **Admin only.** Ceiling — partners cannot exceed it when editing. Helper: "Ceiling — brokers cannot exceed this when editing" |
| **Pre-Approved Amount**    | `number` input, `$` prefix | Visible to all. Pre-filled with `Math.round(loanAmount)`. Auto-clamped if `max` is changed to a lower value                   |
| **Loan Type**              | `<Select>`                 | Options: `FHA`, `Conventional`, `USDA`, `VA`, `Non-QM`                                                                        |
| **FICO Score**             | `number` input             | 300–850                                                                                                                       |
| **Letter Date**            | `date` input               | Required                                                                                                                      |
| **Expiry Date**            | `date` input               | Required                                                                                                                      |

A blue info banner is shown to partners: "Only Mortgage Bankers can set the maximum allowed amount".

**Submit:** "Create Pre-Approval Letter" button → disabled if invalid or saving. On success: creates letter, shows "Letter Created" toast, switches to Preview tab.

---

### State 3: Letter View

#### Header Pills (when letter exists)

- Approved amount pill — formatted `$XXX,XXX`
- Active/Inactive badge — green `CheckCircle2` "Active" or gray "Inactive"
- Expiry badge — amber "Expires \<date\>" (only shown if `expires_at` is set)

#### Toolbar Buttons (Preview tab)

| Button                        | Action                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Print** (`Printer`)         | Opens a new window, injects rendered HTML with print CSS, calls `window.print()` after 250ms                                                                             |
| **Download PDF** (`Download`) | Dynamically imports `html2pdf.js`, proxies images via `/api/image-proxy` to avoid CORS, outputs `Pre-Approval-<application_number>.pdf` (letter-size portrait, 2× scale) |
| **Send to Client** (`Mail`)   | Opens the Send Email sub-dialog                                                                                                                                          |
| **Delete** (`Trash2`)         | Opens the Delete Confirmation `AlertDialog`. Hidden for partners                                                                                                         |

---

### Preview Tab

Renders the saved `html_content` with all `{{PLACEHOLDER}}` tokens replaced via `renderLetterHtml()`. Fixed container width `680px–48rem`, horizontally scrollable on narrow screens. White letter card with shadow + `rounded-2xl`.

---

### Edit Tab

Visible to both admin and partner (with different field access). Shows an amber dot when `hasUnsavedChanges`.

#### Section 1: Amounts & Dates

| Field                      | Admin                                                                 | Partner                                                        |
| -------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Maximum Allowed Amount** | Read-only, labeled "Locked after creation — delete to change" (amber) | Read-only, labeled "Set by the Mortgage Banker — hard ceiling" |
| **Pre-Approved Amount**    | Editable. Red error if exceeds max                                    | Editable. Red error if exceeds max                             |
| **Letter Date**            | Editable date input                                                   | Hidden                                                         |
| **Expiry Date**            | Editable date input (optional)                                        | Hidden                                                         |

#### Section 2: HTML Content Editor (admin only)

- **Placeholder chips** — 16 clickable tokens; clicking any appends it to the textarea:
  ```
  {{COMPANY_LOGO}}, {{COMPANY_NAME}}, {{COMPANY_ADDRESS}}, {{COMPANY_PHONE}},
  {{COMPANY_NMLS}}, {{LETTER_DATE}}, {{EXPIRES_SHORT}}, {{CLIENT_FULL_NAME}},
  {{PROPERTY_ADDRESS}}, {{APPROVED_AMOUNT}}, {{EXPIRY_NOTE}},
  {{BROKER_PHOTO}}, {{BROKER_FULL_NAME}}, {{BROKER_LICENSE}},
  {{BROKER_PHONE}}, {{BROKER_EMAIL}}
  ```
- **Textarea** — monospace, `min-h-[320px]`, resizable, `spellCheck=false`
- **Reset button** — reverts HTML to last saved state; clears `hasUnsavedChanges`

#### Section 3: Live Preview (inside Edit tab)

Inline preview that re-renders in real time as the HTML or amount changes.

#### Edit Footer

- Left: amber "You have unsaved changes" warning (`AlertCircle`) when dirty
- **Cancel** — resets edits, switches to Preview tab
- **Save Changes** — dispatches `updatePreApprovalLetter`. Admin payload includes `html_content`, `letter_date`, `expires_at`; partner payload only includes `approved_amount`. Disabled if saving or amount exceeds max.

---

### Sub-dialog: Delete Confirm (`AlertDialog`)

> "This will permanently delete the pre-approval letter for this loan application. This action cannot be undone."

Dispatches `deletePreApprovalLetter(loanId)` on confirm. Shows "Letter Deleted" toast.

---

### Sub-dialog: Send to Client (`Dialog`)

Opens with `fetchEmailTemplates()` dispatched and subject pre-filled as `"Your Pre-Approval Letter — <application_number>"`.

| Field              | Description                                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **To**             | Read-only display: `First Last <email>`. Amber alert if no email on file                                                                                                                   |
| **Subject**        | Pre-filled, editable `<Input>`                                                                                                                                                             |
| **Email Template** | Select: "Default template (recommended)", "No template — attach PDF only", or any active email template. Hint shown when a template with `{{pre_approval_letter}}` placeholder is selected |
| **Custom Message** | `<Textarea>` — only shown for "default" or "no template" options                                                                                                                           |

**Send flow:** Attempts to generate a PDF via `html2pdf.js` first (images proxied through `/api/image-proxy`), then POSTs to `POST /api/loans/:loanId/pre-approval-letter/send-email` with `{ subject, custom_message?, template_id?, pdf_base64? }`. Send still proceeds even if PDF generation fails (letter sent without attachment). Shows "Email Sent" toast on success.

---

### `renderLetterHtml()` — Placeholder Engine

Replaces 20 `{{TOKEN}}` patterns in the HTML template. Notable behaviours:

- **`{{EXPIRY_NOTE}}`** — renders a specific expiry date sentence or a "no expiration" disclaimer depending on whether `expires_at` is set.
- **`{{BROKER_SIGNATURE_SECTION}}`** — if the loan has both a Mortgage Banker and a Partner, renders a two-column side-by-side signature block (photo, name, license, phone, email). Otherwise single-column.
- **`{{BROKER_PHOTO}}`** — circular `<img>` if URL present; styled initials `<div>` fallback.
- **`{{COMPANY_LOGO}}`** — uses `letter.company_logo_url` or falls back to the Disruptinglabs CDN URL.
- Dates processed with `safeDate()` to strip the ISO `T` portion before constructing `Date` objects (prevents timezone off-by-one errors).

---

### Toast Summary

| Event                        | Variant     |
| ---------------------------- | ----------- |
| Letter created               | default     |
| Letter saved                 | default     |
| Letter deleted               | default     |
| Email sent                   | default     |
| Amount exceeds max on save   | destructive |
| Save / create / delete error | destructive |
| Email send failed            | destructive |
| PDF download failed          | destructive |
