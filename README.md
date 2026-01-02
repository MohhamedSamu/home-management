# House Manager

A Progressive Web App for managing household inventory, economy, and tasks. Installable on mobile devices and tablets as a native-like app.

## Features

### Economy Module
- **Income Tracking**: Recurring monthly income (salary) and one-time income entries
- **Expense Tracking**: Recurrent bills and one-time purchases
- **Supermarket Budget**: 
  - Search products from your inventory
  - Compare prices (current vs last purchase)
  - Track product details (name, weight, brand, supermarket)
  - Shopping cart management
  - Automatic inventory updates when cart is saved
  - Monthly grocery expense tracking

### To-Do Module
- **Task Management**: Create and manage todos with priority levels (low, mid, high)
- **Recurring Tasks**: 
  - Daily, weekly, monthly patterns
  - Custom intervals (every N days, e.g., every 5 days, every 15 days)
  - Monthly on specific day (e.g., 5th of every month)
- **Task Organization**: Filter by all/active/completed
- **Auto-Regeneration**: Recurring todos automatically create the next occurrence when completed

### Airbnb Module
- **Expense Tracking**: Separate expense tracking for Airbnb operations
- **Product Management**: Track supplies and products specific to Airbnb
- **Shopping Cart**: Similar to supermarket module but for Airbnb supplies
- **Categories**: Cleaning, maintenance, supplies, utilities, amenities, etc.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **PWA**: next-pwa (installable on mobile devices)
- **Deployment**: Vercel-ready

## Quick Start

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Basic Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Supabase:**
   - Create a project on [Supabase](https://supabase.com)
   - Run migrations in order in the SQL Editor:
     1. `supabase/migrations/001_initial_schema.sql`
     2. `supabase/migrations/002_todos_airbnb.sql`
   - Copy your project URL and anon key

3. **Create `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Create PWA icons:**
   - Create `icon-192x192.png` and `icon-512x512.png` in the `public` folder
   - See `public/ICON_INSTRUCTIONS.txt` for details

5. **Configure User ID:**
   - Update `lib/user.ts` with your user ID (or implement authentication)

6. **Run development server:**
```bash
npm run dev
```

7. **Deploy to Vercel:**
   - Push to GitHub
   - Import in Vercel
   - Add environment variables
   - Deploy!

## Project Structure

```
app/
  economy/          # Economy module
    income/         # Income tracking
    expenses/       # Expense tracking
    supermarket/    # Shopping cart & product management
  page.tsx          # Home page
lib/
  supabase/         # Supabase client & types
  user.ts           # User ID utility
supabase/
  migrations/       # Database migration scripts
public/             # Static assets & PWA files
```

## Important Notes

- The app uses a single user ID (configured in `lib/user.ts`). For production, consider implementing proper authentication.
- Database RLS policies need to be updated based on your authentication setup (see migration file comments).
- PWA installation requires HTTPS (automatic on Vercel).

