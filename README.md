# Our Diary

A private diary site for the two of us, with a small public side. See `CLAUDE.md` for the plan, `DESIGN.md` for the visual spec, and the PRD PDF for requirements.

## Run it locally

pnpm comes through Node's corepack (`corepack pnpm …`), or run `corepack enable` once so plain `pnpm` works.

```bash
corepack pnpm install
cp .env.local.example .env.local   # fill in once Supabase is set up (step 2)
corepack pnpm dev                  # http://localhost:3000
```

| Script                    | What it does                          |
| ------------------------- | ------------------------------------- |
| `dev`                     | Start the dev server                  |
| `build` / `start`         | Production build and server           |
| `lint`                    | ESLint                                |
| `typecheck`               | Generate route types, then `tsc`      |
| `format` / `format:check` | Prettier (sorts Tailwind classes too) |

## Design system

- Tokens (colours, type sizes, shadows) live in `src/app/globals.css`. The default Tailwind palette is cleared, so only those colours exist.
- Base components are in `src/components/ui/`. Merge classes with `cn()` from `src/lib/utils.ts`; new size or shadow tokens must be added there too.
- `/styleguide` shows every component in its states. It's `noindex` like the rest of the site.
