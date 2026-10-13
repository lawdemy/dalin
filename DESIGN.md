# DaLin — Design reference

Summary of `Our Diary — Prototype.html` (a bundled design-canvas export: 11 screens plus a style guide, all inline-styled HTML). Use this file as the visual spec while building. Where the prototype disagrees with `CLAUDE.md`, see **Conflicts with CLAUDE.md** at the end. Those need a decision before Phase 1 tokens are written.

Prototype boards:

| #   | Board                                | Frame       |
| --- | ------------------------------------ | ----------- |
| 1   | Home · public · mobile               | 390 × 2120  |
| 2   | About Us · public · mobile           | 390 × 1720  |
| 3   | Gallery + lightbox · public · mobile | 390 × 1240  |
| 4   | Moment entry · public · mobile       | 390 × 1820  |
| 5   | Sign in                              | 390 × 844   |
| 6   | Home · public · desktop              | 1440 × 2000 |
| 7   | Dashboard · private                  | 390 × 1180  |
| 8   | New entry · private                  | 390 × 1820  |
| 9   | Timeline · private                   | 390 × 1300  |
| 10  | Calendar · private                   | 390 × 1040  |
| 11  | Photo library · private              | 390 × 1180  |
| 12  | Style guide · tokens & components    | 1280 × 1560 |

Not designed: admin entry read view, About editor, Settings, empty/loading states beyond one empty card, desktop admin.

---

## Colour

### Core tokens (from the style guide)

| Token         | Hex       | Use                                                                                                     |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `ivory`       | `#FBF8F3` | Page background; text on dark fills                                                                     |
| `linen`       | `#F3ECE2` | Cards, inputs, stat tiles, quote blocks                                                                 |
| `sand`        | `#E4D7C5` | Borders, dividers, disabled button fill                                                                 |
| `ink`         | `#2E2A27` | Main text; selected chip/day fill (13.4:1 on ivory)                                                     |
| `muted`       | `#6E635A` | Secondary text, captions, inactive tabs (darkened from `#7A6F66` for contrast)                          |
| `accent`      | `#B9776B` | Icons, focus ring, calendar dots, progress bars, selected-mood border. **Not** for text or button fills |
| `accent-dark` | `#9C5F54` | Primary buttons, links, active tab, switch "on" (5.0:1 with white)                                      |
| `accent-deep` | `#844E45` | Hover / pressed for accent-dark                                                                         |

### Supporting colours used across screens

| Role                                                                                 | Hex                                                                                       |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Input border                                                                         | `#D6C7B3`                                                                                 |
| Body text, softer (paragraphs on cards, dialog body)                                 | `#4A433E`                                                                                 |
| List row divider (lighter than sand)                                                 | `#EDE4D8`                                                                                 |
| Segmented-control track / editor toolbar bg                                          | `#EFE7DB`                                                                                 |
| Private badge bg / fg                                                                | `#EFE8DE` / `#4A433E`                                                                     |
| Rose tint: public badge bg, selected mood bg, secondary-button hover, error alert bg | `#F6E3DE`                                                                                 |
| Public badge fg, error text, "Sign out" / "Delete entry" text                        | `#7A3B30`                                                                                 |
| Danger fill (Delete button), invalid input border (1.5px)                            | `#A3473A`                                                                                 |
| Disabled text, drag handle, inactive cover star                                      | `#8F847A`                                                                                 |
| Dashed upload / empty-state border                                                   | `#C9B49E`                                                                                 |
| Avatar initial bg / fg                                                               | `#E6D3CB` (partner A), `#D6CBBB` (partner B) / `#6B4038`                                  |
| Lightbox background / muted text                                                     | `#1F1B19` / `#D9CFC4`                                                                     |
| Light accent on dark (toast icon + "Undo", selected calendar dot)                    | `#E6B5AA`                                                                                 |
| Photo placeholder tones                                                              | `#DCC9B6` `#E6D3CB` `#E4D7C5` `#D6CBBB` `#E9DDD0` `#D9C3B0` (placeholder label `#5E544C`) |
| Scrim behind sheets                                                                  | `rgba(46,42,39,0.4)`                                                                      |

### Shadows (used sparingly)

| Use                                   | Value                             |
| ------------------------------------- | --------------------------------- |
| Dropdown menu (public header)         | `0 12px 24px rgba(46,42,39,0.08)` |
| Floating "+ New" tab button           | `0 6px 16px rgba(156,95,84,0.35)` |
| Confirm dialog                        | `0 16px 40px rgba(46,42,39,0.16)` |
| Toast                                 | `0 8px 24px rgba(46,42,39,0.18)`  |
| Selected segment in segmented control | `0 1px 3px rgba(46,42,39,0.12)`   |

Cards themselves have **no shadow**. They read as `linen` fills or `1px sand` outlines.

---

## Typography

- **Cormorant Garamond** 500 / 600 (headings, names, numbers, quotes, menu links). Italic 500 for quotes.
- **Inter** 400 / 500 / 600 (body and UI).
- Base: Inter 16px, line-height 1.6, colour `ink`.

| Role                           | Mobile                                               | Desktop                    | Notes                                       |
| ------------------------------ | ---------------------------------------------------- | -------------------------- | ------------------------------------------- |
| Page title (h1)                | CG 40 / 600, lh 1.1                                  | CG 56 / 600, lh 1.05       |                                             |
| Section (h2)                   | CG 28 / 600                                          | CG 36 / 600                |                                             |
| Wordmark ("[Name] & [Name]")   | CG 24 / 600                                          | CG 28 / 600                | letter-spacing 0.2px                        |
| Featured card title            | CG 26 / 600, lh 1.2                                  | same                       |                                             |
| List card title                | CG 22 / 600, lh 1.2                                  |                            |                                             |
| Big numbers (stats, countdown) | CG 36–40 / 600, lh 1                                 |                            |                                             |
| Mobile menu links              | CG 26 / 500 (600 + accent-dark when current)         |                            | 56px rows                                   |
| Quote / pull line              | CG 24–26 italic 500, lh 1.3                          |                            | accent-dark on About; `linen` box on Moment |
| Eyebrow above h1               | Inter 13 / 500, uppercase, letter-spacing 2px, muted |                            | "OUR DIARY", "ABOUT US", "GALLERY"          |
| Body                           | Inter 16 / 400, lh 1.6                               | Welcome line 18 on desktop |                                             |
| Form label                     | Inter 14 / 500                                       |                            | required marker `*` in accent-dark          |
| Meta / caption                 | Inter 13, muted                                      |                            | Format: `Sun 11 Oct 2026 · Family`          |
| Badges, tab labels             | Inter 12 / 500 (600 when active)                     |                            |                                             |

---

## Spacing, radius, sizing

- **8px grid.** Common gaps: 2, 4, 6, 8, 12, 16, 24. Section spacing 48px (mobile) / 80px (desktop).
- **Gutters:** 20px on mobile pages (16px for photo grids), 24px on desktop. Desktop content max-width 1200px, and 720px for text-centred blocks.
- **Radius:** 12px is the default for cards, inputs, buttons and photo tiles (Tailwind `rounded-xl`). 8px for thumbnails and small inputs, 10px for photo-library tiles and inner segments, 14px for the segmented track, 16px for dialogs, 20px for the bottom-sheet top corners, and full for pills, avatars and the FAB.
- **Heights:** inputs 48 (title input 52), buttons 48, full-width primary CTAs 52 (dashboard "New entry" 56), filter chips 40, category chips in the form 44, read-only tags 28, visibility badges 26, icon buttons 44 × 44.
- **Icons:** Lucide, 20px, stroke 1.5–1.8, `currentColor`. Decorative heart/book icons use `accent`.
- **Tap targets:** at least 44px everywhere. Text links get `min-height: 44px`.

---

## Components

- **Buttons** (all 48px tall, radius 12, weight 600):
  - Primary: `accent-dark` fill, white text. Hover `accent-deep`.
  - Secondary: 1px `accent-dark` border and text, transparent. Hover adds a `#F6E3DE` fill and switches to `accent-deep`.
  - Ghost: `ink` text at weight 500. Hover adds a `linen` fill.
  - Danger: `#A3473A` fill.
  - Disabled: `sand` fill (or a sand border), `#8F847A` text.
  - Focus (every interactive element): `2px solid #B9776B` outline, 2px offset.
- **Inputs:** `linen` fill, 1px `#D6C7B3` border, radius 12, 14–16px horizontal padding. Label above with a 6px gap. When invalid: a 1.5px `#A3473A` border plus a 13px `#7A3B30` message below.
- **Chips:** pill-shaped. Selected: `ink` fill with `ivory` text. Unselected: 1px `#D6C7B3` border, transparent. Read-only tag: 28px tall, `linen`, 13px `#4A433E`.
- **Visibility badge:** 26px pill with a lock or globe icon. Private uses `#EFE8DE` / `#4A433E`; Public uses `#F6E3DE` / `#7A3B30`. The timeline uses a 32px circular icon-only version of the same.
- **Segmented control** (Private | Public): track `#EFE7DB`, padding 4, radius 14. The selected segment is `ivory` with a small shadow and `ink` text; the unselected segment has `muted` text. Helper text below changes with the choice:
  - "Only the two of us can see this entry and its photos."
  - "Anyone with the link can read this on Moments, with its photos."
- **Switch:** 52 × 32. On is `accent-dark`; off is `#D6C7B3`. White knob, 26px.
- **Cards:**
  - Featured: `linen` fill, image on top (150–240px), 16–20px padding, meta line then a CG title.
  - Row: 96px square thumbnail with meta and title beside it.
  - Outline: 1px `sand` border.
- **Photo tile states:** normal; uploading (45% `ink` overlay with a "64%" label, plus a 4px `accent` progress bar in the editor); selected (a 3px `accent-dark` inset ring).
- **Empty state:** dashed `#C9B49E` border, `accent` icon, CG 22 heading ("No entries yet"), 14px muted line ("Your first page is waiting.").
- **Confirm dialog:** 360px wide, `ivory`, 1px `sand` border, radius 16, 24px padding. CG 28 title ("Delete this entry?"). The body names the entry and its photo count. Actions are a Ghost "Keep it" and a Danger "Delete".
- **Toast:** `ink` fill, `ivory` text, radius 12, `#E6B5AA` check icon and "Undo" action ("Entry saved").
- **Avatar:** circle with a CG initial (32px on entries, 44px on the dashboard, 18px inline in the timeline).

---

## Layout and navigation

### Public site

- **Mobile header:** 64px tall, wordmark on the left, a 44px hamburger on the right, `sand` bottom border. The menu opens as a full-width dropdown below the header (`ivory`, shadow) with CG 26 links: Home · About us · Gallery · Moments. The current page is shown in `accent-dark` at weight 600. Moments is hidden when `moments_enabled` is off.
- **Desktop header:** wordmark on the left and inline Inter 15/500 links on the right, inside a 1200px container.
- **Footer:** `sand` top border, centred wordmark (CG 22), and the tagline "Written together, one day at a time."

### Private (admin), mobile

- **Bottom tab bar:** 92px tall including a 26px safe area, `ivory` background, `sand` top border, 5 columns: **Home · Timeline · (+) · Photos · More**.
  - The centre (+) is a raised 60px `accent-dark` circle (margin-top −28px, rose shadow).
  - The active tab is `accent-dark` at weight 600; the rest are `muted`. Labels are 12px.
- **"More" bottom sheet:** scrim, `ivory` sheet with 20px top radius and a grab handle. Rows are 56px each: Calendar · About Us editor · Settings, then a divider, then **Sign out** (in `#7A3B30`).
- Pages pad their bottom by 140px so content clears the tab bar.

---

## Screens

### Home (public)

1. Full-bleed hero photo: 440px on mobile; 560px with rounded corners inside the container on desktop.
2. Centred intro: eyebrow "OUR DIARY", the couple's names as h1, and the welcome line (max-width 320px on mobile).
3. **Wedding countdown** card (toggleable; `linen` fill): "Until we say “I do”", wedding date · place, then three `ivory` tiles for days, hours and minutes.
4. **Latest moments** (only when Moments is on), with a "See all" link:
   - Mobile: one featured card and two row cards.
   - Desktop: a 3-column auto-fit grid with cards at min 280px.
5. **From the gallery:** a 3-column square grid of 6 photos (auto-fit, min 150px on desktop), with a "View all" link.
6. **"How we got here"** outline card: heart icon, one line of text, and a primary "Read our story" button.
7. Footer.

### About us

Eyebrow "ABOUT US", then the h1 "Our story". Below that:

- An engagement details card (`linen`, 2 columns): "Engaged" and the date, "Where" and the place, each with an icon.
- An article with three sections, all built from rich text and photos:
  - **How we met:** text, then a 420px photo with a caption.
  - **The proposal:** text, a centred italic pull quote in `accent-dark`, and two 220px photos side by side.
  - **What comes next:** text.

### Gallery and lightbox

Eyebrow "GALLERY", then the h1 "Little pieces of us". The grid is a 2-column masonry of 12px-radius tiles with 8px gaps and a `zoom-in` cursor. It loads more on scroll and shows "Loading more photos…".

The lightbox is a full-screen `#1F1B19` overlay:

- Top: an "N of 24" counter and a close button.
- Middle: the photo at full width.
- Below the photo: a CG 22 caption and "Swipe for the next photo".
- Bottom: 48px circular outline buttons for previous and next.

### Moment (public entry)

- A "← All moments" back link, then a category tag and a CG 40 title.
- A meta row with icons: date · location · mood emoji with its label.
- A "Written by [Name]" line with an avatar.
- A 300px full-bleed cover image.
- The rich-text body: paragraphs, h2, and a quote block on a `linen` background.
- A **Photos** grid: the first photo spans two columns at 220px, the rest are 160px tiles, and the last tile shows "+N more" on `#4A433E`.
- Newer/Older navigation cards at the bottom (outline cards, 2 columns).

### Sign in

- A centred CG 40 "Welcome back" and the line "Sign in to write in our diary."
- An error alert box (`#F6E3DE` / `#7A3B30`): "Email or password is incorrect."
- An email field, and a password field with a show/hide eye button.
- A "Forgot password?" link (see the conflicts section).
- A full-width 52px "Sign in" button.
- "← Back to the site" at the bottom.

### Dashboard

- The date in muted text ("Tuesday, 13 October") above "Good morning, [Name]" (CG 36), with an avatar on the right.
- A full-width 56px **New entry** button.
- Two stat tiles: "12 entries in October" and "3 shared publicly".
- **On this day:** an outline card with a 72px thumbnail and "1 year ago · 13 Oct 2025" in `accent-dark`.
- **Recent entries:** rows with a date block (CG 26 day number over an uppercase 12px month), the title (ellipsised), "Author · Category", and a visibility badge. A "Timeline" link.

### New entry (editor)

- **Header** (60px): a close (✕) button, "New entry" centred with "☁ Draft saved 09:52" under it, and a spacer.
- **Title:** a 52px input that uses CG 24/600 for its text.
- **Date and Location:** two columns. Location placeholder: "Where were you?"
- **Mood:** a 4×2 grid of 64px emoji tiles. The selected tile gets `#F6E3DE` and a 1.5px `accent` border.
- **Category:** a wrap of 44px pill chips.
- **Photos:**
  - Hint line: "Location data is removed on upload".
  - A dashed 88px "Add photos" button.
  - One row per photo: drag handle, 60px thumbnail (with an upload % overlay), caption input ("Add a caption"), progress bar, a ★ cover toggle (`accent` when it's the cover), and a 🗑 delete button.
- **What happened?:** a rich-text box with a toolbar on `#EFE7DB` (Bold, Italic, Heading, Bulleted list, Quote, Link). Placeholder: "Write about your day…"
- **Who can see this?:** the Private/Public segmented control with its helper text.
- A "🗑 Delete entry" text button in `#7A3B30`.
- **Sticky save bar** at the bottom: `ivory`, `sand` top border, 34px bottom safe area. Its label reads **"Save entry"** when private and **"Save and share publicly"** when public.

### Timeline

- The h1 "Timeline" and a search input with an icon ("Search entries").
- Visibility filter chips: All · Private · Public. A second chip row is stubbed in for other filters.
- Entries are grouped by month, with a CG 24 month header and an "N entries" count on the right.
- Rows: a 64px thumbnail, the title, an 18px author-initial avatar with "Mon 12 · Food", and a 32px circular visibility icon on the right.

### Calendar

- The h1 "Calendar", then a month switcher (‹ "October 2026" ›).
- A Mon–Sun grid of 48px cells:
  - Days with entries show a 5px `accent` dot.
  - Today gets a 1.5px `accent` ring.
  - The selected day gets an `ink` fill with `ivory` text and a `#E6B5AA` dot.
- Below the grid: the selected day's title, then its entries as outline cards with 56px thumbnails.
- Empty state: "Nothing written on this day." with a secondary "Write about it" button.

### Photo library

- The h1 "Photos" and a secondary **Upload** button.
- Filter chips: All · In gallery · On About page · In public entries · Private. A "15 photos" count.
- A 3-column grid with 6px gaps and 10px-radius tiles. Each tile carries overlay badges: an `ink` "Hero" pill and a public/private icon.
- Tapping a photo opens a **detail bottom sheet**:
  - The photo, where it came from (an entry title or "Unsorted upload"), and its status line. The status says why a photo is public, for example "Public: shown on gallery, a public entry", or "Private: only the two of us".
  - A caption input labelled "(also used as alt text)".
  - Switches for "In public gallery" and "On About page".
  - A "Set as home hero" button (shows "Home hero ✓" when set) and "Delete photo".
- This matches the `photo_is_public` rule in CLAUDE.md: a photo is public if it's in the gallery, on About, the hero, or in a public entry.

---

## Copy and tone

The voice is warm and short, written as "we" and "us". Lines worth keeping:

- "Written together, one day at a time."
- "Little pieces of us"
- "Until we say “I do”"
- "Your first page is waiting."
- "Only the two of us can see this."
- "Keep it" / "Delete"

Sample content is Lagos-flavoured (jollof, suya, Tarkwa Bay, Surulere), but the names are placeholders: `[Name] & [Name]`.

---

## From the PRD (`Our Diary — Website Prototype PRD.pdf`)

The PRD is dated 13 Oct 2026, the same day as the prototype. It sets out the requirements; the prototype shows how they look. Where they disagree on visuals, the prototype is the later and more detailed source. The prototype's style guide even notes "muted: was #7A6F66", the PRD's value.

### Pages 1–5

**Goals and success criteria** (these become design constraints):

- Post an entry with 5 photos from a phone on 4G in **under 2 minutes**. Keep the new-entry flow short and one-thumb.
- Public pages reach **LCP < 2.5 s** on mobile. Size the hero image properly with `next/image` `priority`, and keep blur placeholders.
- **Lighthouse 90+** for Accessibility and Best Practices on public pages.
- Running cost stays at zero on the Vercel and Supabase free tiers.
- Non-goals: comments, likes, guest accounts, video, native apps. The site should still work well when added to the home screen.

**Design system as the PRD states it:**

- Only the accent `#B9776B` was a firm decision; the other hex values were "proposed starting points". The prototype then refined them (see Colour above).
- Text on the accent must be white at 16px semibold or larger, with contrast checked.
- Inter at 400 and 500 only. The prototype also uses Inter 600 for buttons and active tabs, so load 600 as well.
- Content width: 720px for reading, 1200px for galleries.
- Corners are 12px on cards and images. Use a soft shadow only on raised elements, which matches the prototype.
- Lucide icons at 20px with a 1.5px stroke.
- Component list: button (primary/secondary/ghost), text input, textarea, select, date picker, tag chip, visibility toggle (lock and globe icons), entry card, photo tile, lightbox, toast, confirm dialog, empty state.

**Navigation:**

- Public: a wordmark top bar that collapses to a menu on mobile.
- Private on mobile: bottom tabs **Home · Timeline · (+ New) · Photos · More**, where More holds Calendar, About editor, Settings and Sign out. This matches the prototype.
- **Private on desktop: a left sidebar with the same items.** Not designed in the prototype yet.

**Public pages:**

- **Home:** the countdown appears only if a wedding date is set. Show up to 3 latest public moments, hidden when Moments is off. Then a strip of 6 gallery photos and a link to About.
- **About:** the rich-text story from site settings, with About photos placed alongside, and engagement date and place when they're filled in.
- **Gallery:**
  - Masonry, newest first, lazy-loaded in **pages of 24**.
  - The lightbox has swipe, caption and close, plus **keyboard arrows on desktop**.
- **Moments feed:**
  - **10 cards per page, filterable by category**. The feed itself isn't designed yet.
- **Moment page:**
  - Shows title, date, location, mood, **author avatar**, body, and a photo grid with lightbox.
  - When the feed is off, both Moments routes return **404**.
  - A private entry's slug also returns **404, never "access denied"**, so its existence isn't revealed.

**Sign-in:**

- Show/hide password, a **loading state**, and the generic error "Email or password is incorrect".
- A **"Forgot password" link that uses Supabase password reset**.
- A signed-in user visiting `/login` is sent to `/admin`.

**Private pages:**

- **Dashboard:** greeting, New entry button, entries this month, the 5 most recent entries.
- **On this day:** entries from the same date in previous **months or years**, not just previous years.
- **Entry form:**
  - Title is required. Date defaults to today. Mood is an emoji picker with about 8 options.
  - Categories: **Everyday, Date night, Travel, Milestone, Food, Family, Other**, which matches the prototype.
  - Tiptap body with headings, bold, italic, lists, quote and link.
  - Visibility defaults to Private.

**Routes:** 5 public pages, `/login`, and 8 admin screens. The PRD has **no admin read view**; `/admin/entries/[id]` is the _edit_ screen. CLAUDE.md uses `/admin/entries/[id]` for a read view and `/[id]/edit` for editing.

**Photo pipeline:** resize to a **2048px** longest side (CLAUDE.md says 2560px), re-encode in the browser so EXIF and GPS are stripped, and use signed URLs that last about 1 hour.

### Pages 6–10

**Entry form behaviour:**

- **Photos:**
  - Pick or drag several at once, including from the camera roll.
  - Show progress for each photo. Reorder by drag; set cover; add a caption; delete.
- **Autosave a draft every 10 seconds** and **warn before leaving with unsaved changes**. This is what the "Draft saved 09:52" line in the editor header shows.
- The slug is generated from the title and date.
- Deleting an entry asks for confirmation and also deletes its photos, matching the "…and its 7 photos" wording in the dialog.

**Upload rules** (needed for the uploader's errors and hint text):

- Accept JPEG, PNG, HEIC and WebP only, at most **15 MB** before compression.
- Save the output as WebP or JPEG, **under 500 KB** per photo.
- HEIC: most non-Safari browsers can't decode it, so `browser-image-compression` alone may fail on Android/Chrome. Plan a fallback (for example `heic2any`) or a clear error.

**Timeline:**

- Visibility badge on each entry.
- Text search, plus filters for **category, author, visibility and date range**. The prototype only draws the visibility chips, so the other filters need designing (a "Filters" sheet would suit mobile).

**Calendar:** change month with **swipe** as well as the arrow buttons.

**Photos:**

- The same five filters as the prototype.
- Edit caption, the gallery/About toggles, and set as hero.
- **Upload standalone photos not tied to an entry.** This is the "Upload" button.

**About editor** (not designed yet):

- A Tiptap editor for the story.
- **Choose and order About-page photos.**
- A **live preview link**.

**Settings** (not designed yet):

- Our names, welcome line, **wedding and engagement date and place**, home hero photo, and the Moments on/off switch.
- Each owner can update their own display name and **profile photo**.

**Data model points that affect the UI:**

- **profiles:**
  - Visitors **can** read `display_name` and the avatar, so the public author byline works.
  - The avatar is an `avatar_photo_id` (a photo row), not a path.
- **entries:** visitors can read public rows **only when the Moments feed is on**. That rule is in RLS, not just in the page.
- **photos:**
  - The flags are named `in_gallery` and `on_about`; CLAUDE.md uses `is_public` and `show_on_about`.
  - The PRD adds `size_bytes`, and has no `alt_text` or `blur_data_url`.
- **site_settings:**
  - One `about_body` JSON field instead of CLAUDE.md's three (`our_story`, `how_we_met`, `engagement_story`).
  - Adds `wedding_date`.
  - The PRD table has no `wedding_place` or countdown toggle, though the Settings page asks for wedding place.
- The function is named `is_photo_public(photo_id)`; CLAUDE.md calls it `photo_is_public(photo)`.

**Accessibility and mobile:**

- **Design from 360px wide**; CLAUDE.md says 375px. Check public pages at 360 and 1440.
- The bottom tab bar respects the safe area. The prototype's 26px and 34px bottom padding should become `env(safe-area-inset-bottom)`.
- **WCAG 2.1 AA contrast**, a visible focus ring in the accent colour, and **alt text taken from the photo caption**, as in the photo sheet.
- A web app manifest and icon, so the site can be added to a home screen.

**SEO and indexing:** **public pages send `noindex` too**, until the two of you decide to allow search engines. CLAUDE.md only puts `noindex` on `/admin` and `/login`.

**Build plan details that touch design:**

- Step 1 includes a **`/styleguide` page that shows every core component in its states**, mirroring the prototype's style-guide board.
- Step 8 asks for a README on how to post, make something public, and change the site.
- The PRD says `npm run build`; CLAUDE.md uses pnpm.

**Out of scope for now:**

- Video, voice notes, comments and reactions.
- A password-protected "friends" visibility level.
- A map of places, a printed yearly photo book, and email reminders.
- A custom domain.

**Open questions in the PRD:**

- What's the site name and welcome line?
- Should Google be able to find the site?
- Do we want dark mode?
- Is the category list right?
- **Should a public entry show which of us wrote it?** The prototype and the PRD's own requirements say yes, but it's still listed as open.

---

## Conflicts with CLAUDE.md (decide before building)

> **Resolved on 13 Oct 2026.** The decisions are recorded in CLAUDE.md under **Decisions**, and CLAUDE.md has been updated to match. The list below is kept for history.

PRD verdicts are noted in _italics_ where the PRD takes a side.

1. **Palette values differ.** Prototype vs CLAUDE.md:

   | Token         | Prototype | CLAUDE.md |
   | ------------- | --------- | --------- |
   | ivory         | `#FBF8F3` | `#FAF7F2` |
   | linen         | `#F3ECE2` | `#F1EBE3` |
   | sand          | `#E4D7C5` | `#E3D9CC` |
   | muted / taupe | `#6E635A` | `#8A7F74` |

   The bigger change is the accent. The prototype keeps `#B9776B` for icons and focus only. Buttons and links use `#9C5F54`, with `#844E45` on hover, because white on `#B9776B` fails contrast. **Recommendation:** adopt the prototype's values; they were tuned for WCAG AA.
   _PRD: it lists `accent` (#B9776B) for buttons and links, with `accent-dark` (#9C5F54) as hover. The prototype moved the button fill to #9C5F54 for contrast and added #844E45 for hover. The PRD itself says to check contrast on the accent, which supports the prototype._

2. **Radius.** The prototype uses 12px (`rounded-xl`) throughout. CLAUDE.md says `rounded-2xl` (16px). _PRD: 12px, so 2 of 3 sources agree on 12px._
3. **Moods don't match the `entry_mood` enum.**
   - Prototype: Loved 🥰, Happy 😊, Calm 😌, Excited 🤩, Funny 😂, Tired 😴, Bittersweet 🥲, Sad 😢.
   - Enum: joyful, loved, excited, peaceful, grateful, silly, tired, sad.
   - The prototype also disagrees with itself: its Moment page shows "🥰 Grateful".
4. **Categories differ.**
   - Prototype: Everyday, Date night, Travel, Milestone, Food, Family, Other.
   - Enum: the same list, except Family is `family_friends` ("Family & friends") and there is an extra `home`.
   - _PRD: the same list as the prototype. CLAUDE.md is the odd one out._
5. **"Forgot password?" link** on Sign in. CLAUDE.md says there is no password-reset UI in v1. _PRD: include it, using Supabase password reset. That also means building a reset-password page and adding its redirect URL in Supabase._
6. **Wedding countdown** on Home, with a wedding date, a place and an on/off toggle. `site_settings` has no `wedding_date`, `wedding_place` or `show_countdown` columns. _PRD: show it only if a wedding date is set._
7. **About page sections.**
   - Prototype: "Our story" is the page title, followed by How we met / The proposal / What comes next, with a pull quote.
   - Schema: `our_story`, `how_we_met`, `engagement_story`. There is nothing for "What comes next" or the quote.
   - _PRD: a single `about_body` rich-text field, with About photos picked and ordered separately. That's simpler, and it can hold every section and the quote._
8. **Bottom tabs.**
   - Prototype: Home · Timeline · + · Photos · More, with Calendar moved into the More sheet.
   - CLAUDE.md: Timeline · Calendar · + New · Photos · More.
   - _PRD: same as the prototype. It also adds a left sidebar for desktop admin._
9. **Timeline filters.** The prototype only shows search and visibility. CLAUDE.md also asks for author, category and mood filters. _PRD: category, author, visibility and date range (no mood)._
10. **Draft autosave** ("Draft saved 09:52") appears in the editor header but isn't in CLAUDE.md. _PRD: autosave every 10 seconds, plus an unsaved-changes warning._
11. **Caption as alt text.** The photo sheet says the caption is also used as alt text. The schema has a separate `alt_text` column. _PRD: alt text comes from captions, and its table has no `alt_text` column._
12. **Author shown publicly.** The Moment page shows "Written by [Name]" with an avatar, so a display name and avatar can be read by anon. Profiles RLS currently only allows members to select. _PRD: it asks for the author avatar, and its access table lets visitors read `display_name` and the avatar. It still lists this as an open question, though._
13. **Photo resize.** The PRD says a 2048px longest edge; CLAUDE.md says 2560px.
14. **Admin entry routes.** The PRD has no admin read view and uses `/admin/entries/[id]` as the edit screen. CLAUDE.md has a read view at `[id]` and the editor at `[id]/edit`.
15. **"On this day".** The PRD matches previous _months_ as well as years; CLAUDE.md doesn't say.
16. **Moments feed gates entry visibility.**
    - PRD: public entries can be read by visitors only while the feed is on. Turning the feed off makes `/moments` and `/moments/[slug]` return 404.
    - CLAUDE.md's RLS lets anon read every public entry regardless of the setting.
    - Open point: do photos in a public entry stay public while the feed is off?
17. **`noindex` on public pages.** The PRD puts `noindex` on public pages until you decide otherwise; CLAUDE.md only puts it on `/admin` and `/login`.
18. **Naming differences.**

    | Item                  | PRD                      | CLAUDE.md                    |
    | --------------------- | ------------------------ | ---------------------------- |
    | Gallery / About flags | `in_gallery`, `on_about` | `is_public`, `show_on_about` |
    | Public-photo function | `is_photo_public`        | `photo_is_public`            |
    | Avatar                | `avatar_photo_id`        | `avatar_path`                |

    The PRD also adds `size_bytes` and `wedding_date`.

19. **Minimum width.** The PRD says 360px; CLAUDE.md says 375px. _Design for 360px; it covers both._
20. **Uploads.** The PRD allows HEIC, sets a 15 MB input limit and a target of under 500 KB per photo. CLAUDE.md doesn't specify any of these.
