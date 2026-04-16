# Grass Nerds Truck Inspection — Setup Guide

## What you need
- GitHub account (to store the code)
- Supabase account (free tier works: supabase.com)
- Vercel account (free tier works: vercel.com)
- Gmail or any SMTP email for notifications

---

## Step 1: Set up Supabase (database)

1. Go to **supabase.com** → Create a new project
2. Once created, go to **SQL Editor** (left sidebar)
3. Click **New Query**, paste the entire contents of `supabase/schema.sql`, and click **Run**
4. This creates all tables and loads your trucks + drivers automatically
5. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon public** key (the long string)

---

## Step 2: Push to GitHub

1. Create a new repo on GitHub (e.g., `grass-nerds-inspection`)
2. In your terminal:
```bash
cd grass-nerds-inspection
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/grass-nerds-inspection.git
git push -u origin main
```

---

## Step 3: Deploy to Vercel

1. Go to **vercel.com** → **Add New Project**
2. Import your GitHub repo
3. Vercel will auto-detect it as a Next.js project
4. Before deploying, add these **Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SMTP_HOST` | `smtp.gmail.com` (or your email provider) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your email address |
| `SMTP_PASS` | Your email app password (not your regular password) |
| `MANAGER_EMAIL` | `ndalpiaz@grassnerds.com` |

5. Click **Deploy** — your app will be live in ~60 seconds!

---

## Step 4: Gmail App Password (for email notifications)

If using Gmail:
1. Go to myaccount.google.com → Security → 2-Step Verification (must be enabled)
2. At the bottom, click **App passwords**
3. Create a new app password for "Mail"
4. Copy the 16-character password and use it as `SMTP_PASS` in Vercel

---

## How to use the app

**Your team:** Share the main URL with your drivers. They open it on their phone, fill out the form, and submit.

**You (manager):** Go to `/dashboard` to see all inspections, track issues by truck, and resolve flagged items.

**Admin panel:** Go to `/admin` to add/remove trucks, drivers, or checklist items. Changes take effect immediately — no code updates needed.

---

## Making changes WITHOUT touching code

| Want to... | Do this |
|---|---|
| Add a new truck | Admin panel → Trucks → type name → click "+ Add" |
| Remove a truck | Admin panel → Trucks → click "Active" to deactivate (keeps history) |
| Add a new driver | Admin panel → Drivers → type name + initials → click "+ Add" |
| Add a checklist item | Admin panel → Checklist → find the section → type item → click "+ Add" |
| Remove a checklist item | Admin panel → Checklist → click ✕ next to the item |
| Change item type (yes/no → text) | Admin panel → Checklist → use the dropdown next to the item |
| Change manager email | Supabase Dashboard → Table Editor → settings table → edit the row |

---

## Project structure (for developers)

```
grass-nerds-inspection/
├── app/
│   ├── page.js              ← Inspection form (main page)
│   ├── dashboard/page.js    ← Manager dashboard + truck history
│   ├── admin/page.js        ← Admin panel (trucks/drivers/items)
│   └── api/notify/route.js  ← Email notification endpoint
├── components/
│   ├── InspectionForm.jsx   ← The form (reads sections from DB)
│   ├── YesNoToggle.jsx      ← Single yes/no toggle
│   ├── Section.jsx          ← Section wrapper with title + icon
│   ├── SignaturePad.jsx     ← Draw-to-sign canvas
│   ├── Header.jsx           ← Top nav bar with progress
│   ├── SubmittedView.jsx    ← Confirmation after submit
│   └── ResolveModal.jsx     ← Modal for resolving flagged issues
├── lib/
│   ├── supabase.js          ← Database connection
│   └── data.js              ← All data queries (fetch, submit, resolve)
├── supabase/
│   └── schema.sql           ← Database setup script
└── SETUP.md                 ← This file
```
