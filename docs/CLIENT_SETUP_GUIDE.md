# Client Repo Setup Guide

This guide explains how to set up a new client repository from the base repo at https://github.com/tonatiuh19/real-state

## Prerequisites

- Git installed
- Node.js and npm installed
- Access to the shared PostgreSQL database
- Unique tenant ID for your client

## Initial Setup

### Step 1: Clone the Base Repo

```bash
git clone https://github.com/tonatiuh19/real-state.git
cd real-state
```

### Step 2: Initialize Your Client Repo

Run the initialization script with your client details:

```bash
./scripts/init-client-repo.sh <path-to-new-repo> <TENANT_ID> "Client Name"
```

**Example:**

```bash
./scripts/init-client-repo.sh ../acme-loans ACME001 "ACME Loans"
```

This will:

- Create a new directory with all base files
- Configure your unique `ENCORE_TENANT_ID`
- Set up sync configuration
- Create client-specific scripts

### Step 3: Navigate to Your Client Repo

```bash
cd ../acme-loans  # or your chosen path
```

### Step 4: Customize Client-Specific Files

Edit these files to match your client's branding:

1. **`client/pages/Index.tsx`** - Home page content and structure
2. **`client/components/layout/Navbar.tsx`** - Header and navigation
3. **`client/components/layout/Footer.tsx`** - Footer content
4. **`client/global.css`** - Custom colors, fonts, and theme

### Step 5: Configure Environment Variables

Create `.env` file in the root:

```env
# Database (shared, isolated by TENANT_ID)
DATABASE_URL=postgresql://user:password@host:5432/database

# API Keys (client-specific)
VITE_API_KEY=your_api_key_here

# Other client-specific configuration
VITE_CLIENT_NAME=ACME Loans
```

### Step 6: Install Dependencies

```bash
npm install
```

### Step 7: Initialize Git

```bash
git init
git add .
git commit -m "Initial commit for ACME Loans"
```

### Step 8: Create Remote Repository

```bash
# Create a new repo on GitHub/GitLab, then:
git remote add origin https://github.com/your-org/acme-loans.git
git push -u origin main
```

### Step 9: Start Development

```bash
npm run dev
```

## Deploying to Vercel

### Initial Deployment

1. **Install Vercel CLI (optional):**

   ```bash
   npm i -g vercel
   ```

2. **Connect to Vercel:**
   - Push your repo to GitHub/GitLab
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Vercel will auto-detect Vite configuration

3. **Set Environment Variables:**
   In Vercel dashboard → Settings → Environment Variables:

   ```
   DATABASE_URL=postgresql://...
   VITE_API_KEY=your_key
   VITE_CLIENT_NAME=Your Client
   ```

4. **Deploy:**
   - Vercel will automatically deploy on every push to main
   - Or manually: `vercel --prod`

### Vercel Configuration

The `vercel.json` file is synced from base repo and includes:

- Build settings
- Serverless function configuration
- Routing rules

**DO NOT modify `vercel.json` in client repo** - changes must go in base repo.

## Syncing Updates from Base Repo

When the base repo (https://github.com/tonatiuh19/real-state) is updated with new features, bug fixes, or improvements:

### Pull Latest Changes

```bash
./scripts/sync-from-base.sh
```

This will:

1. Clone the latest base repo
2. Sync all shared files (API, store, components, etc.)
3. **Preserve your client-specific customizations**
4. Maintain your `ENCORE_TENANT_ID`
5. Create a backup in `.sync-backups/`

### After Syncing

1. **Review Changes:**

   ```bash
   git status
   git diff
   ```

2. **Install Updated Dependencies (if package.json changed):**

   ```bash
   npm install
   ```

3. **Test Your Application:**

   ```bash
   npm run dev
   ```

4. **Commit and Deploy:**
   ```bash
   git add .
   git commit -m "Sync from base repo: [describe changes]"
   git push
   ```

## What Gets Synced vs What Stays Custom

### ✅ Synced from Base (DO NOT modify in client repo)

- `api/` - Backend API routes
- `client/store/` - Redux state management
- `client/components/ui/` - UI component library
- `client/components/visuals/` - Visual components
- `client/pages/admin/` - Admin dashboard
- `client/pages/client/` - Client portal
- All wizards and business logic
- Configuration files (package.json, tsconfig, etc.)

**Note:** The `ENCORE_TENANT_ID` value in `api/index.ts` is preserved during sync.

### 🎨 Client-Specific (Safe to customize)

- `client/pages/Index.tsx` - Your home page
- `client/components/layout/Navbar.tsx` - Your navigation
- `client/components/layout/Footer.tsx` - Your footer
- `client/global.css` - Your styles and theme
- `.env` files - Your environment config
- `scripts/client-config.json` - Your client metadata

## Important Notes

### Database Isolation

- All clients share the same database
- Data is isolated by `ENCORE_TENANT_ID`
- Your tenant ID is: **Check `scripts/client-config.json`**
- Never modify queries to remove tenant isolation

### Tenant ID Configuration

Your tenant ID is set in two places:

1. `api/index.ts` - `const ENCORE_TENANT_ID = "YOUR_ID"`
2. `scripts/client-config.json` - Used by sync scripts

These are automatically maintained by the sync system.

### Backups

Before each sync, a backup is created in `.sync-backups/[timestamp]/`

If something goes wrong, you can restore from there.

### Getting Help

- Base repo issues: https://github.com/tonatiuh19/real-state/issues
- Review base repo documentation: Check the base repo README
- Check sync logs: Review terminal output after running sync

## Troubleshooting

### Sync Conflicts

If files conflict after sync:

```bash
# Check what changed
git diff

# Restore from backup if needed
cp -R .sync-backups/[latest]/* .

# Or manually resolve conflicts
```

### Wrong Tenant ID After Sync

```bash
# Edit your client config
nano scripts/client-config.json

# Update tenantId, then re-run sync
./scripts/sync-from-base.sh
```

### Missing Dependencies

```bash
npm install
# or
rm -rf node_modules package-lock.json
npm install
```

## Best Practices

1. **Never modify synced files** - Changes will be overwritten on next sync
2. **Always test after syncing** - Ensure everything works before deploying
3. **Keep client files separate** - Only customize client-specific files
4. **Document your customizations** - Note what you've changed in client files
5. **Regular syncs** - Stay up to date with base repo improvements
6. **Version control** - Commit before and after syncing

## Development Workflow

```bash
# Daily development
npm run dev

# Before deploying
npm run build
npm run preview

# Deploy
# (Your specific deployment process)
```

## Support

For issues with:

- **Base functionality**: Open issue in base repo
- **Client customizations**: Handle in your client repo
- **Sync problems**: Check this guide or base repo scripts/README.md
