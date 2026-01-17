# Agent Guide for MyFinance

## Purpose
This file guides agentic coding assistants working in this repository.
Follow existing patterns, keep changes minimal, and verify before claiming completion.

## Project Overview
- **Framework**: Next.js 16 App Router with TypeScript
- **Styling**: Tailwind CSS v4 + custom utilities in globals.css
- **Database/Auth**: Supabase (@supabase/ssr)
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: @ducanh2912/next-pwa
- **Language**: Indonesian UI text

## Repository Structure
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API routes (route.ts files)
│   ├── dashboard/         # Main dashboard
│   ├── transactions/      # Transaction pages
│   ├── wallets/           # Wallet management
│   ├── settings/          # User settings
│   ├── globals.css        # Tailwind + custom CSS
│   └── layout.tsx         # Root layout
├── components/            # Shared React components
│   ├── AuthProvider.tsx   # Auth context
│   ├── BottomNav.tsx      # Mobile bottom navigation
│   └── ...
└── lib/                   # Utilities and clients
    ├── supabase.ts        # Browser Supabase client + types
    ├── supabase-admin.ts  # Server-side admin client
    ├── config.ts          # APP_CONFIG constants
    ├── categoryIcons.ts   # Icon mapping
    └── telegram.ts        # Telegram bot helpers
```

## Commands
```bash
npm install          # Install dependencies
npm run dev          # Development server (webpack mode)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check without emit
```

## Testing
- No test framework currently configured
- When adding tests, update package.json scripts and document here:
```bash
# Future: npm test -- path/to/file.test.ts
```

## TypeScript Guidelines
- **Strict mode** enabled - do not bypass
- **Path alias**: `@/*` maps to `./src/*`
- **NEVER use**: `as any`, `@ts-ignore`, `@ts-expect-error`
- Define types in `src/lib/supabase.ts` for database entities
- Use explicit return types for exported functions

```typescript
// Good
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Bad - avoid any
const data: any = response; // Never do this
```

## Code Style
- **Indentation**: 4 spaces (some files use 2 - match local style)
- **Semicolons**: Yes, always use them
- **Quotes**: Single quotes preferred, but match file-local style
- **Variables**: `const` by default, `let` only when reassignment needed

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `BottomNav.tsx` |
| Pages | lowercase | `page.tsx` |
| Functions | camelCase | `formatCurrency()` |
| Types | PascalCase | `Transaction` |
| Constants | UPPER_SNAKE | `APP_CONFIG` |

### Imports
```typescript
// Order: React → Next → External → Internal (@/) → Relative
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase, Transaction } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
```

## Next.js Patterns
- **Client components**: Start with `'use client';`
- **API routes**: Export async functions (GET, POST, DELETE)
- **Responses**: Use `NextResponse.json()` with status codes
- **Navigation**: Use `useRouter` from `next/navigation`

```typescript
// API route example
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // ... process
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
```

## Supabase Usage
- **Browser client**: `import { supabase } from '@/lib/supabase'`
- **Admin client**: `import { supabaseAdmin } from '@/lib/supabase-admin'`
- Admin client = server-side only (API routes)
- Always handle errors from Supabase calls

## Error Handling
- Use try/catch for async operations
- Never leave empty catch blocks
- Log errors with `console.error()`
- Return user-friendly Indonesian messages

```typescript
try {
    const { data, error } = await supabase.from('wallets').select('*');
    if (error) throw error;
    return data;
} catch (err: any) {
    console.error('Fetch error:', err);
    setMessage({ type: 'error', text: 'Gagal memuat data' });
}
```

## UI Patterns
- **Custom classes**: Use `.card`, `.btn`, `.btn-primary`, `.input` from globals.css
- **Colors**: Use CSS variables (`text-fore`, `bg-primary`, `text-danger`, etc.)
- **Touch targets**: Minimum 44px for mobile buttons
- **Bottom padding**: `pb-24` on pages with BottomNav

## Data Formatting
```typescript
// Currency (Indonesian Rupiah)
new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
}).format(amount);

// Dates
new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});
```

## Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
```

## Security Rules
- NEVER commit `.env` files or secrets
- Use service role key ONLY in server routes
- Validate all user inputs before database operations
- Verify webhook secrets for external integrations

## Versioning
- Tambahkan ekor versi di setiap perubahan, versi ada di `src/lib/config.ts`

## Before Completing Work
1. Run `npx tsc --noEmit` - must pass with no errors
2. Run `npm run lint` - fix any warnings
3. Test the affected UI manually if possible
4. Keep changes focused - avoid unrelated refactors

## Cursor/Copilot Rules
No `.cursor/rules/`, `.cursorrules`, or `.github/copilot-instructions.md` found.
Update this section if rules are added.
