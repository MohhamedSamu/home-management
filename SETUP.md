# Setup Instructions

## 1. Install Dependencies

```bash
npm install
```

## 2. Set up Supabase

1. Create a new project on [Supabase](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the migration scripts in order:
   - First run `supabase/migrations/001_initial_schema.sql`
   - Then run `supabase/migrations/002_todos_airbnb.sql`
4. Copy your project URL and anon key from Settings > API
5. Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Create PWA Icons

You need to create two icon files in the `public` folder:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

These icons will be used when users install the app on their devices.

You can use any image editor or online tool to create these icons.

## 4. Update Database Policies (Important!)

The current migration includes placeholder RLS (Row Level Security) policies that allow all operations. For a production app, you should update these policies to use proper authentication.

If you're using Supabase Auth, update the policies in the migration file to use `auth.uid() = user_id` instead of `true`.

For a single-user setup without authentication, you can keep the current policies, but be aware that anyone with your database credentials could access your data.

## 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 6. Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. Deploy!

## Notes

- The app currently uses a dummy user_id. In production, you should implement proper authentication or modify the code to use a fixed user ID for your single-user setup.
- The PWA will be installable on mobile devices once deployed to Vercel (HTTPS is required for PWA installation).

