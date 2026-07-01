# Supabase setup (your steps)

Complete these in the Supabase dashboard before signing in from the app.

---

## Step 1 — Get API keys

1. Open [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** (gear) → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`  
     (Use the **anon** key, not `service_role`.)

Create `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Restart `npm run dev` after saving.

---

## Step 2 — Enable Email + Password auth (task 1.2)

1. In Supabase: **Authentication** → **Providers**
2. Click **Email**
3. Ensure **Enable Email provider** is **ON**
4. For personal dev use, you can turn **OFF** “Confirm email” under Email settings  
   (otherwise you must click a confirmation link before first login)
5. Save

Optional later: enable **Google** on the same Providers page.

---

## Step 3 — Run SQL migration (task 1.3)

1. Go to **SQL Editor** → **New query**
2. Paste the contents of `supabase/migrations/001_user_progress.sql`
3. Click **Run**
4. You should see “Success. No rows returned”

Verify in **Table Editor**: table `user_progress` exists with columns `user_id`, `data`, `updated_at`.

---

## Step 4 — Verify RLS (task 1.4)

1. Go to **Table Editor** → `user_progress`
2. Click the shield icon or **Authentication** → **Policies**
3. Confirm **RLS is enabled** and these policies exist:
   - Users read own progress
   - Users insert own progress
   - Users update own progress

**What RLS means:** Without being logged in, nobody can read or write any rows. After login, you only see your own `user_id` row. The app uses the anon key + your session token; Postgres enforces access.

Quick test after first sign-in in the app:

- **Table Editor** → `user_progress` → you should see one row with your `user_id` and JSON in `data`

---

## Step 5 — URL configuration (for local dev)

1. **Authentication** → **URL Configuration**
2. Set **Site URL** to: `http://localhost:8080`
3. Under **Redirect URLs**, add:
   - `http://localhost:8080/**`

(When you deploy to Netlify, add `https://your-site.netlify.app/**` here too.)

---

## Step 6 — Test in the app

1. `npm run dev`
2. Open `http://localhost:8080/login`
3. **Sign up** with your email + password (min 6 characters)
4. Complete a lecture
5. Refresh the page — progress should remain
6. Check Supabase **Table Editor** → `user_progress` — `data` should contain your progress JSON

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| “Supabase is not configured” | Add `.env.local` and restart dev server |
| Sign up works but can’t sign in | Disable “Confirm email” or confirm via email link |
| “Failed to save progress” | Run SQL migration (Step 3); check RLS policies |
| Empty table after login | Complete an action (mark a lecture); save is debounced ~800ms |
| Works on one PC, not another | Sign in with the **same account** on both |

---

## What you do NOT need to put in the app

- `service_role` key (server secret — never in frontend)
- Database password (only used in dashboard / server tools)
- Curriculum data in Supabase (stays in `curriculum.ts`)
