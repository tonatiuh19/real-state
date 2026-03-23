# GitHub Copilot Custom Instructions

## ⚠️ CRITICAL RULES - MUST FOLLOW

- **ALWAYS reference `database/schema.sql` for exact table structure and column names**
- **NEVER assume column names - verify in schema.sql before writing SQL queries**
- **NEVER fetch data directly in components with axios or fetch**
- **ALL data fetching MUST be done in Redux store (slices) using createAsyncThunk**
- **Components ONLY dispatch actions and select state from store**
- **NO EXCEPTIONS to these rules**
- **NEVER touch schema.sql, any database changes must be made through migration files in `database/migrations/`**
- **When using any console logging for debugging use logger functions from `client/utils/logger.ts` for consistent formatting and log levels only in UI components**
- **NEVER Patch issues, always fix the root cause of type errors or bugs immediately**
- **if any update is made to api/index.ts, update swagger.yaml accordingly**
- **if any update is needed in DESIGN_SYSTEM.md, update it immediately and ensure changes are reflected in client/global.css and tailwind.config.ts**

### Package Manager

- **Always use npm** (never pnpm or yarn)
- **Always use logger** for debugging (e.g., `console.log`, `console.error`) inside lib folder

### Backend

- Apis are in api/index.ts
- TypeScript throughout
- Single port (8080) for both frontend/backend in development
- **CRITICAL: Always reference `database/schema.sql` for database structure and table definitions**
- **NEVER assume column names - check schema.sql first**
- **If any database update is made based on schema.sql, generate a migration file** in `database/migrations/` with timestamp prefix (e.g., `YYYYMMDD_HHMMSS_description.sql`) for hostgator mysql database version 8.0
- **If a type issue is generated, fix it immediately** - ensure all TypeScript types are correct and consistent across client, api/index.ts, and shared

## Project Structure

### Client (Frontend)

- `client/pages/` - Route components (Index.tsx = home page)
- `client/components/ui/` - Pre-built UI component library
- `client/App.tsx` - App entry point with SPA routing setup
- `client/global.css` - TailwindCSS theming and global styles
- Add cool, engage, modern UI components
- Need to use cool animations and transitions for smooth UX
- When console logging for debugging, always use logger functions from `client/utils/logger.ts` for consistent formatting and log levels

### Shared

- `shared/` - Types and interfaces used by both client and server
- `shared/api.ts` - Shared API interfaces

## Path Aliases

- `@/*` - Maps to `client/` folder
- `@shared/*` - Maps to `shared/` folder

Always use these aliases instead of relative imports.

## Styling Guidelines

### Primary Styling Method

- Use TailwindCSS 3 utility classes as the primary styling method
- Configure theme and design tokens in `client/global.css` and `tailwind.config.ts`
- **Always follow the color palette defined in `client/global.css`** - use existing theme colors
- **Keep designs simple, cool, and engaging** - prioritize clean UX

## API Development

### When to Create API Endpoints

**Only create API endpoints when strictly necessary**, such as:

- Handling private keys or secrets
- Database operations
- Server-side logic that cannot be exposed to the client

4. Use in React components with Redux store and axios

```typescript
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { MyRouteResponse } from "@shared/api";

// In your slice file
export const fetchMyData = createAsyncThunk("mySlice/fetchMyData", async () => {
  const { data } = await axios.get<MyRouteResponse>("/api/my-endpoint");
  return data;
});
```

## State Management

### ⚠️ DATA FETCHING RULES (MANDATORY)

**CRITICAL: ALL data fetching MUST happen in Redux store, NEVER in components**

✅ **CORRECT Pattern:**

```typescript
// In client/store/slices/mySlice.ts
export const fetchData = createAsyncThunk(
  "slice/fetchData",
  async (_, { getState }) => {
    const { sessionToken } = (getState() as RootState).brokerAuth;
    const { data } = await axios.get("/api/endpoint", {
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    return data;
  },
);

// In component
const dispatch = useAppDispatch();
const { data, loading } = useAppSelector((state) => state.mySlice);

useEffect(() => {
  dispatch(fetchData());
}, [dispatch]);
```

❌ **INCORRECT Pattern (NEVER DO THIS):**

```typescript
// WRONG: Direct axios call in component
const [data, setData] = useState([]);
useEffect(() => {
  axios.get("/api/endpoint").then((res) => setData(res.data)); // ❌ NEVER DO THIS
}, []);
```

### General Redux Rules

- **Always use Redux store** (`client/store/`) for state management
- Use Redux hooks: `useAppDispatch` and `useAppSelector` from `client/store/hooks.ts`
- Create slices in `client/store/slices/` following existing patterns
- Never use local state for data that should be shared across components
- **Always use axios for API calls from Redux store** - never use fetch directly
- Use `createAsyncThunk` for async operations in slices
- Components should only dispatch actions and select state from the store

## Form Validation

- **Always use Formik with Yup** for form validation
- Create Yup schemas for all forms
- Use Formik hooks: `useFormik` or `<Formik>` component
- Define validation schemas separately for reusability
- Example:

```typescript
import { useFormik } from "formik";
import * as Yup from "yup";

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("Required"),
  name: Yup.string().required("Required"),
});

const formik = useFormik({
  initialValues: { email: "", name: "" },
  validationSchema,
  onSubmit: (values) => dispatch(submitForm(values)),
});
```

## Component Guidelines

### UI Components

- Pre-built UI component library available in `client/components/ui/`
- Components use Radix UI primitives with TailwindCSS styling
- Always check existing UI components before creating new ones
- **Keep UI simple, cool, and engaging** - focus on clean user experience

### Icons

- Use Lucide React icons library as primary choice
- Import from `lucide-react`
- If Lucide doesn't have a cool/engaging icon, use react-icons as alternative
- Import from `react-icons` (e.g., `react-icons/fa`, `react-icons/bs`, etc.)

## Grid & Table Standards

### ⚠️ MANDATORY — ALL data tables must follow these rules

#### Column Sorting (Required on every table)

- **Always use `useSortableData` hook** from `client/hooks/use-sortable-data.ts`
- Apply it to the filtered/source data array; spread the result to get `sorted`, `sortKey`, `sortDir`, `requestSort`
- **Every sortable column header must be a `<button>` element** that calls `requestSort("field")`
- Use `ChevronUp` / `ChevronDown` / `ChevronsUpDown` (opacity-40 when unsorted) from `lucide-react` inside the header button

```typescript
import { useSortableData } from "@/hooks/use-sortable-data";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

const { sorted, sortKey, sortDir, requestSort } = useSortableData(filteredItems, "name");

// In table header:
<TableHead>
  <button type="button" onClick={() => requestSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
    Name {sortKey === "name" ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
  </button>
</TableHead>
```

#### Mobile Responsiveness (Required on every table)

**For tables with 5+ columns — use card/table split pattern:**

```tsx
{
  /* Mobile: card list (hidden on lg+) */
}
<div className="block lg:hidden space-y-3">
  {sorted.map((item) => (
    <div
      key={item.id}
      className="rounded-lg border bg-card p-3 flex flex-col gap-2"
    >
      {/* Key fields only */}
    </div>
  ))}
</div>;

{
  /* Desktop: full table (hidden below lg) */
}
<div className="hidden lg:block overflow-x-auto">
  <table>...</table>
</div>;
```

**For tables with 4 or fewer columns — use column hiding:**

```tsx
<TableHead className="hidden sm:table-cell">Optional Column</TableHead>
<TableCell className="hidden sm:table-cell">{value}</TableCell>
```

#### Summary

- `useSortableData` hook: **required** on every table
- Sortable button headers with directional chevrons: **required** for all data columns
- Mobile card view (`block lg:hidden`): **required** for tables with 5+ columns
- `overflow-x-auto` wrapper on desktop table container: **always**
