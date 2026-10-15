# DaLin — Our Couple's Diary

A private diary website for two people (the owner and their fiancée) to record the daily events, activities and photos of their life together. A small public side shows a curated face of the relationship. A login-only private side holds the full diary.

**Status:** Phases 1–4, 6 and 7 done, phase 5 partly (timeline, calendar and entry read view built; dashboard still a placeholder). Supabase project `qhvcmsajbnhqnlsxuhqx` is live with migrations 0001–0005 applied, sign-ups disabled and both accounts created. Photo files live in Cloudinary (cloud `p44yxlqe`). Work through the remaining build phases in order. `DESIGN.md` holds the visual spec from the prototype; where it and this file disagree, the **Decisions** below win.

---

## Non-negotiables

- **Exactly two accounts.** There is no public sign-up, ever. Public sign-ups are disabled in Supabase Auth settings, both users are created by hand in the Supabase dashboard, and there is no sign-up route or UI. Every write policy also checks membership in `profiles`.
- **Private by default.** New entries and photos are `private`. Nothing reaches the public side unless it is explicitly marked public.
- **Privacy is enforced in the database, not only in the UI.** Row Level Security (RLS) is on every table and on storage. Public pages query as the anonymous role, so RLS alone decides what they can see.
- **Mobile first.** Most posting happens on phones. Design and test at 360px width first. The new-entry flow must be quick with one thumb.
- **Strip EXIF/GPS from every uploaded photo** (client-side re-encode before upload) so public photos never leak locations.

---

## Tech stack

| Concern             | Choice                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework           | Next.js (latest, App Router), TypeScript in strict mode                                                                                                                                                                   |
| Styling             | Tailwind CSS (v4, CSS-first `@theme` tokens)                                                                                                                                                                              |
| Auth / DB / Storage | Supabase (`@supabase/supabase-js` + `@supabase/ssr`)                                                                                                                                                                      |
| Mutations           | Server Actions, validated with Zod                                                                                                                                                                                        |
| Rich text           | Tiptap editor; body stored as Tiptap JSON (`jsonb`), rendered to HTML on the server                                                                                                                                       |
| Images              | Files in **Cloudinary** as private (`authenticated`) assets; `CloudImage` (next/image + pre-signed URLs at fixed widths). Client-side resize/compress before upload (`browser-image-compression`), which also strips EXIF |
| Dates               | `date-fns`                                                                                                                                                                                                                |
| Fonts               | `next/font/google`: **Cormorant Garamond** (headings), **Inter** (body)                                                                                                                                                   |
| Hosting             | Vercel                                                                                                                                                                                                                    |
| Package manager     | pnpm                                                                                                                                                                                                                      |

Route protection lives in `src/proxy.ts` (Next 16+; it was `middleware.ts` in older versions; with a `src/` folder it must sit next to `app/`). It refreshes the Supabase session and redirects unauthenticated requests on `/admin/**` to `/login`. Every admin Server Action also re-checks the user server-side, so it never relies on the proxy alone.

---

## Design system

Follows the prototype (`DESIGN.md`). Tokens live in `src/app/globals.css`; components in `src/components/ui/`; `/styleguide` shows them all.

- **Mood:** warm, romantic, elegant, clean. Generous whitespace, 12px rounded corners (`rounded-xl`) on cards, inputs, buttons and photos, shadows only on raised elements (menus, the + button, dialogs, toasts), no clutter.
- **Palette** (Tailwind theme tokens; the default Tailwind palette is cleared):
  - `ivory` `#FBF8F3`: page background
  - `linen` `#F3ECE2`: cards, inputs
  - `sand` `#E4D7C5`: borders and dividers
  - `muted` `#6E635A`: secondary text
  - `ink` `#2E2A27`: main text
  - `accent` `#B9776B`: **the single accent hue**, used for icons, focus ring and dots. Not for text or button fills (white on it fails contrast).
  - `accent-dark` `#9C5F54`: buttons, links, active states. Hover/pressed: `accent-deep` `#844E45`.
  - Supporting tokens (borders, tints, danger, lightbox, photo placeholders) are in `globals.css`.
- **Type:** Cormorant Garamond (500/600, italic for quotes) for headings and names, Inter (400/500/600) for body and UI. Body text 16px minimum on mobile. Size tokens: `text-title` 40 / `text-title-lg` 56, `text-section` 28 / `text-section-lg` 36, `text-caption` 13 and others in `globals.css`.
- **Mobile:** bottom tab bar in admin (Home · Timeline · **+ New** · Photos · More; More holds Calendar, About editor, Settings, Sign out). Tap targets at least 44px. Sticky save bar on the entry editor. Photo picker uses `accept="image/*"` with multiple selection.
- **Desktop admin:** navigation in the top header for now (the PRD's left sidebar is not designed yet).
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
- `entry_category`: `everyday` | `date_night` | `travel` | `milestone` | `food` | `family` | `other` (prototype list, migration 0004; extend with `ALTER TYPE … ADD VALUE`)
- `entry_mood`: `loved` | `happy` | `calm` | `excited` | `funny` | `tired` | `bittersweet` | `sad` (prototype list, migration 0004; labels and emoji in `src/lib/constants.ts`)

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
RLS: **anon** can select where `visibility = 'public'` **and the Moments feed is on** (`moments_enabled()`); turning Moments off hides every public entry from visitors. **Members** can select all rows, insert (with `author_id = auth.uid()`), and update or delete all rows (either partner may fix the other's typo). Change this to "own rows only" if preferred.

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

**Public-visibility rule** (one SQL function `photo_is_public(photo)` used by both table and storage policies): a photo is public if `is_public` or `show_on_about` is true, if it is the hero photo, or if its entry is public **and the Moments feed is on**.
RLS: anon can select where `photo_is_public`. Members have full CRUD.

### `site_settings`: single row (`id = 1`, enforced by a check constraint)

| column           | type                  | notes                                      |
| ---------------- | --------------------- | ------------------------------------------ |
| id               | int PK check (id = 1) |                                            |
| couple_names     | text                  | "Daniel & Linda"                           |
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

### Storage (photo files in Cloudinary)

Decided 13 Oct 2026: files live in Cloudinary (free plan); the `photos` table and its RLS stay in Supabase and still decide who sees what.

- Every file is a private **`authenticated`** asset with public_id `dalin/photos/{yyyy}/{mm}/{uuid}` (stored in `photos.storage_path`; the uuid is also the row id). Never use the public `upload` type.
- Nothing loads without a URL signed on the server (`src/lib/cloudinary.ts`). The server signs **only rows it just read through Supabase**, so RLS decides: public pages use the anonymous client, admin pages the member's session.
- Signed Cloudinary URLs **don't expire** on the free plan. So whenever a photo **stops being public** (entry made private, photo removed from gallery/About, hero changed, Moments switched off), the app **renames the asset** (`renameAsset`, with CDN invalidation) and updates `storage_path`; old links die within ~20 s (measured). `public_photo_ids(ids)` reports which photos are public before and after a change. Phase 7's toggles must do this too.
- Upload pipeline (client, `src/components/admin/upload-photo.ts`): read `taken_at`, resize to a 2560px longest edge and re-encode to WebP ~0.82 (JPEG fallback), which strips EXIF/GPS; make a 16px blur placeholder; get a one-time signed upload ticket (server picks the public_id); upload straight to Cloudinary; `registerPhoto` checks the asset with Cloudinary (type, format, size) and inserts the row (unattached until the entry is saved).
- Deleting a photo or entry also destroys the Cloudinary assets.
- Keys: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, server-only.
- The Supabase `photos` bucket and its policies (0003) remain but are unused. Videos: later (`photos.media_type` is ready).

### Migrations

SQL lives in `supabase/migrations/` and is managed with the Supabase CLI (`supabase db push`). Generate types with `supabase gen types typescript` into `src/lib/supabase/database.types.ts`. Never hand-edit that file.

---

## Folder structure

```
DaLin/
├─ CLAUDE.md
├─ .env.local.example        # Supabase URL + anon key, NEXT_PUBLIC_SITE_URL, CLOUDINARY_* (server-only), SUPABASE_SERVICE_ROLE_KEY (scripts only)
├─ next.config.ts            # images.remotePatterns for the Supabase host
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/            # 0001_init.sql, 0002_rls.sql, 0003_storage.sql, 0004_prototype_lists_and_moments_toggle.sql …
│  └─ seed.sql               # site_settings row; profiles inserted after creating the two auth users
├─ public/                   # favicon, og-image, manifest icons
└─ src/
   ├─ proxy.ts               # session refresh + /admin guard
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
   │  ├─ images.ts           # photo rows → signed sources
   │  ├─ cloudinary.ts       # signing, upload tickets, rename/destroy (server-only)
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

## Decisions (13 Oct 2026)

- **Names:** "Daniel & Linda" (`site_settings.couple_names`, `SITE_NAME` fallback).
- **Design:** follow the prototype (`DESIGN.md`): palette above, 12px radius, tab order, 360px minimum width.
- **Moods and categories:** the prototype's lists (migration 0004).
- **Moments off hides public entries** and photos that are public only through their entry (migration 0004). Gallery, About and hero photos stay public.
- **No author name on public moments.** `profiles` stays members-only.
- **No "Forgot password" link.** Passwords are reset in the Supabase dashboard.
- **No wedding countdown yet.**
- **Photo resize stays at 2560px** longest edge.
- **Photo files in Cloudinary**, free plan, re-keyed when unpublished (see Storage). **Videos later.**
- **Names and welcome line are edited in the About editor** (`/admin/about`), which also picks the hero and orders About photos. **Settings** (`/admin/settings`) holds the Moments switch (turning it off re-keys entry-only photos) and each person's own display name and profile photo.
- **Profile photos** are private Cloudinary assets under `dalin/avatars/{uuid}` (`profiles.avatar_path`), members-only, max 1024px.
- **Calendar "Write about it"** opens `/admin/entries/new?date=yyyy-mm-dd`.
- **Admin read view** at `/admin/entries/[id]`, editor at `/admin/entries/new` and `/admin/entries/[id]/edit`. Tab bar hidden in the editor (the save bar replaces it). "Today" uses `Africa/Lagos`.
- **Either partner may edit or delete the other's entries.**
- **Comments** (migration 0007, `comments`): unlimited, members only (never public, even on public moments); each person edits or deletes only their own; deleting an entry deletes its comments (on delete cascade). Shown under each entry at `/admin/entries/[id]`, with counts on dashboard cards and timeline rows.
- **Personal notes** (migration 0006, `notes`): written for the other person and shown on their dashboard from the chosen morning (`deliver_on`, Lagos date); RLS hides them from the recipient until then.
- **Daily words** (`src/lib/daily-words.ts`): each person gets one Scripture (KJV), Romance, Love, Faith and Motivation message every morning, different from the other's.
- **Wedding banner** on the public home page: "coming soon", no date, over a photo that is already public.

## Open questions (fill in when known)

- Welcome line text (placeholder: "Welcome to our little corner of the internet.")
- Custom domain (or `*.vercel.app` for now)
