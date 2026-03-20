# Subdomain Setup Guide — GoDaddy + Vercel

## Overview

| Subdomain                   | Purpose              | Routes                                            |
| --------------------------- | -------------------- | ------------------------------------------------- |
| `admin.encoremortgage.org`  | Broker / Admin panel | `/admin/*`, `/broker-login`                       |
| `portal.encoremortgage.org` | Client portal        | `/portal/*`, `/client-login`, `/wizard`, `/apply` |
| `encoremortgage.org`        | Main marketing site  | Untouched — no changes needed                     |

---

## Step 1 — Vercel: Get your deployment domain

1. Go to [vercel.com](https://vercel.com) and open your project
2. Click **Settings** → **Domains**
3. Note your existing Vercel deployment URL (e.g. `your-project.vercel.app`)
   - You will use this as the CNAME target in GoDaddy

---

## Step 2 — Vercel: Add the two custom domains

Still in **Settings** → **Domains**:

1. Click **Add Domain** and enter: `admin.encoremortgage.org` → click **Add**
2. Click **Add Domain** again and enter: `portal.encoremortgage.org` → click **Add**

Vercel will show a **pending** status for each and give you the DNS values to configure. Keep this tab open.

> Vercel gave you the following CNAME target (already confirmed):
>
> - `21229ae07e822619.vercel-dns-017.com`
>
> Use this exact value in GoDaddy for both subdomains.

---

## Step 3 — GoDaddy: Add DNS records for both subdomains

1. Log in to [godaddy.com](https://godaddy.com)
2. Go to **My Products** → find your domain → click **DNS** (or **Manage DNS**)
3. Scroll to the **Records** section and click **Add New Record** for each subdomain below:

### Record 1 — Admin subdomain

| Field | Value                                 |
| ----- | ------------------------------------- |
| Type  | `CNAME`                               |
| Name  | `admin`                               |
| Value | `21229ae07e822619.vercel-dns-017.com` |
| TTL   | `1 Hour` (or default)                 |

### Record 2 — Portal subdomain

| Field | Value                                 |
| ----- | ------------------------------------- |
| Type  | `CNAME`                               |
| Name  | `portal`                              |
| Value | `21229ae07e822619.vercel-dns-017.com` |
| TTL   | `1 Hour` (or default)                 |

4. Click **Save** after adding each record

> ⚠️ Do NOT touch the existing `@` (root) A record — that's your main site.

---

## Step 4 — Vercel: Verify the domains

1. Go back to Vercel → **Settings** → **Domains**
2. Wait a few minutes and refresh — each domain should change from **Invalid Configuration** to **Valid**
3. Vercel automatically provisions SSL certificates (HTTPS) for both subdomains — no action needed

> DNS propagation usually takes **5–30 minutes** but can take up to 48 hours in rare cases.
> You can check propagation status at [dnschecker.org](https://dnschecker.org).

---

## Step 5 — Test the subdomains

Once Vercel shows both domains as **Valid**, open a browser and test:

| URL                                              | Expected result                                            |
| ------------------------------------------------ | ---------------------------------------------------------- |
| `https://admin.encoremortgage.org`               | Redirects to `/admin` (broker login if not authenticated)  |
| `https://admin.encoremortgage.org/broker-login`  | Broker login page                                          |
| `https://portal.encoremortgage.org`              | Redirects to `/portal` (client login if not authenticated) |
| `https://portal.encoremortgage.org/client-login` | Client login page                                          |
| `https://encoremortgage.org`                     | Main marketing site — unchanged ✅                         |

---

## How the app handles subdomains

The subdomain routing logic lives in `client/App.tsx` (`SubdomainRedirect` component).  
It reads `window.location.hostname` on every navigation and enforces:

- `admin.*` → only `/admin/*` and `/broker-login` are accessible; everything else redirects to `/admin`
- `portal.*` → only `/portal/*`, `/client-login`, `/wizard`, `/apply` are accessible; everything else redirects to `/portal`
- Any other hostname (including the root domain) → no restrictions, full site available

No backend changes are required. The same Vercel deployment serves all three domains.

---

## Troubleshooting

| Problem                                      | Fix                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| Vercel shows "Invalid Configuration"         | DNS hasn't propagated yet — wait and refresh                                     |
| Subdomain shows "This site can't be reached" | CNAME must be `21229ae07e822619.vercel-dns-017.com`                              |
| SSL certificate not issued                   | Wait 5–10 min after DNS validates; Vercel auto-provisions it                     |
| Wrong page loads on subdomain                | Clear browser cache / try incognito                                              |
| GoDaddy won't let you save CNAME             | Make sure there is no existing A record with the same name (`admin` or `portal`) |
