# DaLin — Our Couple's Diary

A private diary website for two people (the owner and their fiancée) to record the daily events, activities and photos of their life together. A small public side shows a curated face of the relationship. A login-only private side holds the full diary.

**Status:** Planning complete, no code written yet. Work through the build phases below in order.

---

## Non-negotiables

- **Exactly two accounts.** There is no public sign-up, ever. Public sign-ups are disabled in Supabase Auth settings, both users are created by hand in the Supabase dashboard, and there is no sign-up route or UI. Every write policy also checks membership in `profiles`.
- **Private by default.** New entries and photos are `private`. Nothing reaches the public side unless it is explicitly marked public.
- **Privacy is enforced in the database, not only in the UI.** Row Level Security (RLS) is on every table and on storage. Public pages query as the anonymous role, so RLS alone decides what they can see.
- **Mobile first.** Most posting happens on phones. Design and test at 375px width first. The new-entry flow must be quick with one thumb.
- **Strip EXIF/GPS from every uploaded photo** (client-side re-encode before upload) so public photos never leak locations.

---

## Tech stack

| Concern             | Choice                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Framework           | Next.js (latest, App Router), TypeScript in strict mode                                                                                 |
| Styling             | Tailwind CSS (v4, CSS-first `@theme` tokens)                                                                                            |
| Auth / DB / Storage | Supabase (`@supabase/supabase-js` + `@supabase/ssr`)                                                                                    |
| Mutations           | Server Actions, validated with Zod                                                                                                      |
| Rich text           | Tiptap editor; body stored as Tiptap JSON (`jsonb`), rendered to HTML on the server                                                     |
| Images              | `next/image` with Supabase signed URLs; client-side resize/compress before upload (`browser-image-compression`), which also strips EXIF |
| Dates               | `date-fns`                                                                                                                              |
| Fonts               | `next/font/google`: **Cormorant Garamond** (headings), **Inter** (body)                                                                 |
| Hosting             | Vercel                                                                                                                                  |
| Package manager     | pnpm                                                                                                                                    |

Route protection lives in `proxy.ts` (Next 16+; it was `middleware.ts` in older versions). It refreshes the Supabase session and redirects unauthenticated requests on `/admin/**` to `/login`. Every admin Server Action also re-checks the user server-side, so it never relies on the proxy alone.

---

## Design system

- **Mood:** warm, romantic, elegant, clean. Generous whitespace, soft rounded corners (`rounded-2xl` cards), subtle shadows, no clutter.
- **Palette** (Tailwind theme tokens):
  - `ivory` `#FAF7F2`: page background
  - `linen` `#F1EBE3`: cards and sections
  - `sand` `#E3D9CC`: borders and dividers
  - `taupe` `#8A7F74`: muted text
  - `ink` `#2E2A27`: main text
  - `rose` `#B9776B`: **the single accent** (links, buttons, highlights). Hover state: `rose-dark` `#9E5F54`.
- **Type:** Cormorant Garamond (500/600) for headings and names, Inter for body and UI. Body text 16px minimum on mobile.
- **Mobile:** bottom tab bar in admin (Timeline · Calendar · **+ New** · Photos · More). Tap targets at least 44px. Sticky save bar on the entry editor. Photo picker uses `accept="image/*"` with multiple selection.
- **Dark mode:** not in v1. Keep colours as tokens so it can be added later.

---

## Features

### Public (no login)

- `/`: hero photo (chosen in admin), the couple's names, a welcome line, and teasers linking to About, Gallery and Moments.
- `/about`: our story, how we met, engagement details, and a photo grid of us. All editable in admin.
- `/gallery`: photos marked public, in a masonry grid with a lightbox.
- `/moments`: feed of entries marked public (can be switched off in settings). `/moments/[slug]` shows a single public entry.

### Private (login required)

- `/login`: email and password only. No "sign up" link and no password reset UI in v1 (reset through the Supabase dashboard).
- `/admin`: dashboard with recent entries, "on this day" memories, quick-add button, and counts.
- `/admin/entries/new` and `/admin/entries/[id]/edit`: entry editor. Fields: title, date, location (optional), mood (optional), category, rich-text body, multiple photos (reorderable, with captions, and a chosen cover photo), and visibility. The author is set automatically to the logged-in user.
- `/admin/entries/[id]`: read view of an entry.
- `/admin/timeline`: reverse-chronological feed of all entries, grouped by month, with filters for author, category, mood and visibility.
- `/admin/calendar`: month grid with a dot or thumbnail on days that have entries. Tapping a day lists its entries.
- `/admin/photos`: every photo, with toggles for "public in gallery", "show on About page" and "set as hero".
- `/admin/about`: edit names, welcome line, story, how we met, and engagement details, and pick the hero photo.
- `/admin/settings`: show or hide the Moments feed, site title, and each user's display name and avatar.

---

## Database schema (Supabase Postgres)

All tables have RLS enabled. `is_member()` is a `security definer` SQL function that returns true when `auth.uid()` exists in `profiles`. "Member" below means `is_member()` is true.

### Enums

- `entry_visibility`: `private` | `public`
- `entry_category`: `date_night` | `travel` | `milestone` | `everyday` | `food` | `family_friends` | `home` | `other` (extend with `ALTER TYPE … ADD VALUE`)
- `entry_mood`: `joyful` | `loved` | `excited` | `peaceful` | `grateful` | `silly` | `tired` | `sad` (each mapped to an emoji in the UI)

### `profiles`: the two of us (one row per auth user)

| column       | type                      | notes                                   |
| ------------ | ------------------------- | --------------------------------------- |
| id           | uuid PK                   | FK → `auth.users.id`, on delete cascade |
| display_name | text not null             | e.g. first name                         |
| avatar_path  | text null                 | storage path                            |
| created_at   | timestamptz default now() |                                         |

RLS: members can select. Each user can update only their own row. No insert or delete from the client: rows are seeded by hand or by migration.

### `entries`

| column                  | type                                        | notes                                            |
| ----------------------- | ------------------------------------------- | ------------------------------------------------ |
| id                      | uuid PK default gen_random_uuid()           |                                                  |
| slug                    | text unique not null                        | used for public URLs (`/moments/[slug]`)         |
| title                   | text not null                               |                                                  |
| entry_date              | date not null                               | the day it happened (may differ from created_at) |
| location                | text null                                   | free text, e.g. "Lake Como, Italy"               |
| mood                    | entry_mood null                             |                                                  |
| category                | entry_category not null default 'everyday'  |                                                  |
| body                    | jsonb not null default '{}'                 | Tiptap JSON document                             |
| body_text               | text generated/maintained                   | plain-text copy for search and excerpts          |
| author_id               | uuid not null                               | FK → profiles.id; defaults to `auth.uid()`       |
| visibility              | entry_visibility not null default 'private' |                                                  |
| cover_photo_id          | uuid null                                   | FK → photos.id, on delete set null               |
| created_at / updated_at | timestamptz                                 | `updated_at` maintained by trigger               |

Indexes: `(entry_date desc)`, `(visibility, entry_date desc)`, and a GIN full-text index on `body_text` and `title`.
RLS: **anon** can select where `visibility = 'public'`. **Members** can select all rows, insert (with `author_id = auth.uid()`), and update or delete all rows (either partner may fix the other's typo). Change this to "own rows only" if preferred.

### `photos`

| column           | type                           | notes                                                                                      |
| ---------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| id               | uuid PK                        |                                                                                            |
| storage_path     | text unique not null           | `photos/{yyyy}/{mm}/{uuid}.webp` in the `photos` bucket                                    |
| entry_id         | uuid null                      | FK → entries.id, on delete cascade. Null for standalone photos (About, hero, gallery-only) |
| sort_order       | int not null default 0         | order within an entry                                                                      |
| caption          | text null                      |                                                                                            |
| alt_text         | text null                      | for accessibility                                                                          |
| width / height   | int not null                   | stored at upload time for layout without shift                                             |
| blur_data_url    | text null                      | tiny placeholder for `next/image`                                                          |
| taken_at         | timestamptz null               | read before EXIF is stripped                                                               |
| is_public        | boolean not null default false | shown in the public gallery                                                                |
| show_on_about    | boolean not null default false | shown in the About photo grid                                                              |
| about_sort_order | int null                       |                                                                                            |
| uploaded_by      | uuid not null                  | FK → profiles.id                                                                           |
| created_at       | timestamptz                    |                                                                                            |

**Public-visibility rule** (one SQL function `photo_is_public(photo)` used by both table and storage policies): a photo is public if `is_public` or `show_on_about` is true, if it is the hero photo, or if its entry is public.
RLS: anon can select where `photo_is_public`. Members have full CRUD.

### `site_settings`: single row (`id = 1`, enforced by a check constraint)

| column           | type                  | notes                                      |
| ---------------- | --------------------- | ------------------------------------------ |
| id               | int PK check (id = 1) |                                            |
| couple_names     | text                  | e.g. "Dan & Lin"                           |
| welcome_line     | text                  |                                            |
| hero_photo_id    | uuid null             | FK → photos.id, on delete set null         |
| our_story        | jsonb                 | Tiptap JSON                                |
| how_we_met       | jsonb                 | Tiptap JSON                                |
| engagement_date  | date null             |                                            |
| engagement_place | text null             |                                            |
| engagement_story | jsonb                 | Tiptap JSON                                |
| moments_enabled  | boolean default true  | turns the public `/moments` page on or off |
| updated_at       | timestamptz           |                                            |

RLS: anon and members can select. Members can update. No insert or delete from the client.

### Storage

- One **private** bucket, `photos`. Nothing is served from a public bucket, so URLs can't be guessed.
- `storage.objects` policies: members get full access. Anon gets `select` only on objects whose `name` matches a `photos.storage_path` that passes `photo_is_public`.
- Pages render images using **signed URLs** created server-side (about 1 hour expiry; public pages use ISR with a shorter revalidate than the expiry).
- Upload pipeline (client): resize to a 2560px longest edge, encode as WebP at about 0.82 quality (this strips EXIF), read width, height and `taken_at` first, then upload straight to Storage and insert the `photos` row through a Server Action.

### Migrations

SQL lives in `supabase/migrations/` and is managed with the Supabase CLI (`supabase db push`). Generate types with `supabase gen types typescript` into `src/lib/supabase/database.types.ts`. Never hand-edit that file.

---

## Folder structure

```
DaLin/
├─ CLAUDE.md
├─ .env.local.example        # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (server-only, scripts only)
├─ proxy.ts                  # session refresh + /admin guard
├─ next.config.ts            # images.remotePatterns for the Supabase host
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/            # 0001_init.sql, 0002_rls.sql, 0003_storage.sql …
│  └─ seed.sql               # site_settings row; profiles inserted after creating the two auth users
├─ public/                   # favicon, og-image, manifest icons
└─ src/
   ├─ app/
   │  ├─ layout.tsx          # fonts, base metadata
   │  ├─ globals.css         # Tailwind + @theme tokens
   │  ├─ (public)/
   │  │  ├─ layout.tsx       # public header/footer
   │  │  ├─ page.tsx         # home
   │  │  ├─ about/page.tsx
   │  │  ├─ gallery/page.tsx
   │  │  └─ moments/
   │  │     ├─ page.tsx
   │  │     └─ [slug]/page.tsx
   │  ├─ login/
   │  │  ├─ page.tsx
   │  │  └─ actions.ts
   │  └─ admin/
   │     ├─ layout.tsx       # auth check, admin nav (bottom tabs on mobile), noindex
   │     ├─ page.tsx         # dashboard
   │     ├─ entries/
   │     │  ├─ new/page.tsx
   │     │  ├─ [id]/page.tsx
   │     │  ├─ [id]/edit/page.tsx
   │     │  └─ actions.ts    # create/update/delete entry, reorder photos
   │     ├─ timeline/page.tsx
   │     ├─ calendar/page.tsx
   │     ├─ photos/
   │     │  ├─ page.tsx
   │     │  └─ actions.ts
   │     ├─ about/
   │     │  ├─ page.tsx
   │     │  └─ actions.ts
   │     └─ settings/page.tsx
   ├─ components/
   │  ├─ ui/                 # Button, Input, Select, Card, Dialog, Toggle, Badge …
   │  ├─ public/             # Hero, PhotoGrid, Lightbox, MomentCard
   │  ├─ admin/              # AdminNav, EntryForm, PhotoUploader, PhotoSorter, MoodPicker, CategoryPicker, Calendar, TimelineItem
   │  └─ rich-text/          # Editor (client), RichTextRenderer (server)
   ├─ lib/
   │  ├─ supabase/
   │  │  ├─ server.ts        # createServerClient (cookies)
   │  │  ├─ client.ts        # createBrowserClient
   │  │  └─ database.types.ts
   │  ├─ auth.ts             # requireMember() helper for server code
   │  ├─ queries/            # entries.ts, photos.ts, settings.ts (typed read helpers)
   │  ├─ images.ts           # signed URL helpers, client compression
   │  ├─ validation.ts       # Zod schemas
   │  └─ constants.ts        # mood/category labels + emoji
   └─ types/
```

---

## Build phases

1. **Scaffold:** create-next-app (TypeScript, Tailwind, App Router, `src/`), add ESLint and Prettier, theme tokens, fonts, and base UI components.
2. **Supabase:** create the project, write migrations (enums, tables, triggers, `is_member`, `photo_is_public`, RLS, storage bucket and policies), disable sign-ups, create the two users, seed `profiles` and `site_settings`, and generate types.
3. **Auth:** `/login`, `proxy.ts`, `requireMember()`, sign-out, and the admin layout shell with mobile bottom nav.
4. **Entries:** entry form with Tiptap, mood and category pickers, visibility toggle, and photo uploader (compress → upload → row, reorder, captions, cover). Includes create, edit and delete with confirmation.
5. **Private views:** dashboard, timeline with filters, calendar, and the entry read view.
6. **Public site:** home, about, gallery with lightbox, and the moments feed. Plus ISR, OG metadata, and `noindex` on `/admin` and `/login`.
7. **Admin content:** About editor, hero picker, photos manager (public/about toggles), and settings.
8. **Polish and deploy:** loading and empty states, error boundaries, accessibility pass, PWA manifest (add to home screen), and Vercel deploy with environment variables. Set the Supabase Auth Site URL and redirect URLs to the Vercel domain.

---

## Conventions

- Server Components by default. Use `"use client"` only for interactive pieces (editor, uploader, lightbox, calendar interactions).
- All writes go through Server Actions that call `requireMember()` first and validate with Zod. Revalidate the affected paths after writes.
- Never use the service-role key in the app runtime. Use it only in local scripts.
- Read data through the typed helpers in `src/lib/queries/`. Don't scatter raw Supabase queries across pages.
- Render rich text on the server from JSON with a fixed allowlist of node and mark types. Never inject user HTML.
- Before shipping a privacy-related change, check that a logged-out request cannot reach private entries or photos, including direct storage URLs.

## Open questions (fill in when known)

- Couple names, how they should appear, and the welcome line text
- Final accent colour (default dusty rose `#B9776B`)
- Custom domain (or `*.vercel.app` for now)
- Should either partner be able to edit or delete the other's entries? (Default: yes)
