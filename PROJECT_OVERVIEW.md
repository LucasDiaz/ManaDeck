# ManaDeck — Project Overview

> Auto-generated codebase audit. Reflects the actual state of the code as of
> the latest commit (`7bb3365`), not the `README.md`, which is stale (it still
> describes a "Phase 1, no API calls yet" scaffold — that is no longer true).

---

## 1. Project Summary

**ManaDeck** is a mobile-first single-page web app for browsing **Magic: The
Gathering** cards through the public [Scryfall API](https://scryfall.com/docs/api).
Users can search the full card database with filters (text, color, type,
format, rarity), view detailed card pages (oracle text, prices, legalities,
alternate printings, double-faced card flipping), save cards to a persistent
wishlist with deck-building metadata, and see an automatic history of
recently-viewed cards. The UI is entirely in Spanish and dark-themed.

**Core purpose:** a lightweight companion app for MTG players to look up
cards and build a personal "want list," without any backend of its own —
all card data comes live from Scryfall, and all user data (wishlist,
history) lives in the browser's `localStorage`.

**Architecture at a glance:**
- Pure client-side React SPA — no server, no database, no auth.
- Scryfall REST API is the only external data source, called directly from
  the browser via `fetch`.
- User-specific state (wishlist, viewing history) is persisted to
  `localStorage` through a small hand-rolled store, synced across
  browser tabs.
- Routing is client-side via `react-router-dom`, with one persistent layout
  shell (header + bottom nav) wrapping all routed pages.

**Technology stack:**

| Layer            | Choice                                                        |
| ----------------- | -------------------------------------------------------------- |
| UI framework      | React 19 (function components + hooks only)                    |
| Language          | TypeScript (strict-ish; `noUnusedLocals`, `verbatimModuleSyntax`) |
| Build tool        | Vite 8 (`@vitejs/plugin-react`)                                 |
| Routing           | `react-router-dom` v7 (`BrowserRouter`, nested `<Route>`s)      |
| Icons             | `lucide-react`                                                  |
| Styling           | Plain modern CSS: global tokens (`variables.css`) + per-component CSS Modules — **no CSS framework, no UI kit** |
| Data source       | Scryfall REST API, consumed via native `fetch` (no HTTP client library) |
| Persistence       | Browser `localStorage`, wrapped in a custom `useSyncExternalStore`-compatible store |
| Linting           | `oxlint` (rules for `react`, `typescript`, `oxc` plugins)       |
| Package manager   | npm (`package-lock.json` present)                               |

No test runner, state-management library (Redux/Zustand/etc.), CSS
framework, or backend is present anywhere in the project.

---

## 2. What Has Been Done

Despite the README claiming "Phase 1 — scaffolding only," the app is
functionally complete for its scope. Implemented features:

- **Persistent app shell** — sticky brand header (`AppHeader`) + fixed
  bottom navigation (`BottomNav`) wrapping every route, with active-route
  highlighting and auto-scroll-to-top on navigation.
- **Home page** — hero section + a "Cartas destacadas" (featured cards)
  grid of 6 random cards pulled from Scryfall, with a manual "Barajar"
  (shuffle/refetch) button and loading skeletons.
- **Search page** — full-text search plus filter chips/pills for mana
  color (multi-select), card type, format, and rarity; results are
  paginated with an incremental "Cargar más" (load more) button that
  transparently fetches the next Scryfall page once the local buffer runs
  low; live filter re-querying when a chip is toggled after the first
  search; an active-filter counter with a "Limpiar" (clear) action.
- **Card detail page** — full card showcase: art, mana cost, type line,
  rarity badge, set/collector number, power/toughness/loyalty/defense,
  a "flip" control for double-faced/transform cards (per-face oracle
  text, mana cost, stats), oracle text with inline mana-symbol SVGs,
  flavor text, market prices (USD/EUR, foil), a legality grid across six
  formats, artist credit, a link out to Scryfall, and a paginated list of
  every other printing of the card (with set icons and per-printing
  prices).
- **Wishlist** — add/edit a card via an accessible modal dialog
  (focus-trapped, Esc-to-close, portal-rendered) collecting priority
  (number), category/deck name, and an optional note (200-char limit),
  with client-side validation; list view sorted by priority then recency;
  remove single entries or clear the whole list.
- **History** — every card detail view is automatically logged
  (deduplicated, most-recent-first, capped at 60 entries) with a relative
  "hace X min/h/d" timestamp; remove single entries or clear all.
- **Contact/about page** — static links (email, GitHub, Scryfall
  attribution) and a disclaimer.
- **404 page** — fallback for unmatched routes with a link home.
- **Cross-cutting UX**: skeleton loaders, inline error panels with retry,
  empty states, spinners, abortable in-flight requests (via
  `AbortController`) that cancel on unmount/param change, and
  localStorage state that stays in sync across browser tabs (`storage`
  event listener).

**Not implemented** (explicitly stubbed or absent):
- Deck building ("Crear mazo" is a disabled action on the Home page,
  labeled "Próximamente" / "coming soon").
- Any backend, authentication, or multi-device sync.
- Automated tests (no test framework/config in the repo at all).

---

## 3. Architecture & File Relationships

### 3.1 Bootstrapping

```
index.html
  └─ src/main.tsx            (createRoot, StrictMode, BrowserRouter)
        ├─ imports styles/variables.css, styles/global.css (once, globally)
        └─ renders <App />
              └─ src/App.tsx  (Routes table)
                    └─ <Layout />  (persistent shell, wraps every route via <Outlet/>)
                          ├─ <AppHeader />
                          ├─ <Outlet />  → the active page component
                          └─ <BottomNav />
```

`App.tsx` defines one route tree: every path is a child of a single
`<Route element={<Layout />}>`, so `Layout` (header + content + bottom
nav) is never unmounted between page navigations — only the `<Outlet/>`
content swaps. `Layout` also calls `useScrollToTop()`, which watches
`useLocation().pathname` and resets scroll on every route change.

### 3.2 Layered dependency flow

```
types/        →  no internal dependencies (pure TS types + tiny helpers)
   ↑
services/     →  depends on types/  (Scryfall client + response shaping)
   ↑
lib/          →  no internal dependencies (generic localStorage store)
   ↑
hooks/        →  depends on services/, types/, lib/
   ↑
components/   →  depends on hooks/, services/, types/
   ↑
pages/        →  depends on components/, hooks/, services/, types/
   ↑
App.tsx       →  depends on pages/, components/layout/
```

Each layer only imports from layers below it — there are no upward or
circular imports. Every directory exposes a single `index.ts` barrel file
that re-exports its public surface, so consumers import from
`"../../services"` / `"../../hooks"` / `"../../components/cards"` etc.
rather than reaching into individual files.

### 3.3 Data flow: fetching cards from Scryfall

```
Page component (Home / Search / CardDetailPage)
   │  calls
   ▼
useFetch(factory, deps) / useAsync(fn)      ← src/hooks/
   │  wraps a call to
   ▼
services/scryfall.ts   (getRandomCards / searchCards / getCardById / getCardPrints)
   │  builds a URL with buildScryfallUrl(), issues fetch()
   ▼
Scryfall REST API (api.scryfall.com)
   │  JSON response
   ▼
services/scryfall.ts normalises success → typed Card / ScryfallListResponse<Card>
                       normalises failure → ScryfallApiError | ScryfallNetworkError
   │
   ▼
useFetch/useAsync state: { data, error, status } + isLoading/isSuccess/isError flags
   │
   ▼
Page renders CardGrid + CardCard (success), CardCardSkeleton (loading),
             or ErrorState (error, with a retry callback wired to refetch())
```

- **`useFetch`** — declarative "run on mount / when deps change" fetching,
  used when the page owns exactly one query driven by props/route params
  (Home's featured cards, CardDetailPage's card-by-id and its prints).
  Passes an `AbortSignal` into the factory so a superseded request (e.g.
  navigating to a different card id) is cancelled.
- **`useAsync`** — imperative "call this whenever I say so" wrapper, used
  by SearchPage because searches are triggered by user actions (submit,
  toggling a filter chip, loading more) rather than purely by prop
  changes; SearchPage keeps its own `cards`/`page`/`totalCards` state on
  top of it and appends/dedupes pages manually.

Both hooks share the same `AsyncState<T>` shape (`data`/`error`/`status`)
and expose the same derived booleans, defined once in `useAsync.ts` and
re-used by `useFetch.ts`.

### 3.4 Data flow: local persistence (wishlist & history)

```
lib/persistentStore.ts
  createPersistentStore<T>(key, fallback) → { get, set, update, subscribe }
      - reads/writes JSON to localStorage[key]
      - keeps an in-memory snapshot
      - notifies subscribers on change, including cross-tab via the
        window "storage" event
        │
        ├── hooks/useWishlist.ts   → store keyed "manadeck:wishlist"
        │      save(card, draft) → builds a WishlistEntry (via toCardSummary)
        │      sorted by priority then most-recently-added
        │
        └── hooks/useHistory.ts    → store keyed "manadeck:history"
               logVisit(card) → moves/creates a HistoryEntry at the front,
               capped to 60 entries

Both hooks subscribe via React's useSyncExternalStore(store.subscribe, store.get, …),
so any component reading useWishlist()/useHistory() re-renders automatically
whenever the underlying store changes — including changes made in another
browser tab.
```

`WishlistPage` and `HistoryPage` are thin: they call the corresponding
hook and render a list of `EntryRow` (shared list-row component) inside a
shared `Collection.module.css` layout. `CardDetailPage` triggers both
side effects: it calls `logVisit(data)` once a card loads (via
`useEffect`), and opens `WishlistModal` (a portal-rendered dialog) when
the user taps the heart button; the modal calls `useWishlist().save()`
directly on submit.

`toCardSummary()` (in `types/collections.ts`) is the single place that
converts a full Scryfall `Card` into the lightweight `CardSummary` shape
actually persisted (id, name, set name, collector number, image,
type line) — both `useHistory` and `useWishlist` funnel through it so the
storage schema stays consistent.

### 3.5 Card rendering / mana-symbol subsystem

`components/cards/` is the largest component group and is itself
layered:

```
mana.ts            parseManaCost("{2}{U}{U}") → ["2","U","U"]
manaLabels.ts       manaSymbolLabel("{T}") → "Girar"   (accessible alt text)
   │
   ├─ ManaSymbol.tsx   single Scryfall SVG symbol (badge or toggle button)
   │      - fetched from services/scryfall.ts → getManaSymbolUrl()
   ├─ ManaCost.tsx      row of ManaSymbols for a full cost string (uses mana.ts)
   └─ oracleSymbols.tsx renderOracleTextWithSymbols() — splits oracle-text
          lines on {...} tokens and swaps each for an inline <img> SVG
             │
             └─ OracleText.tsx   renders paragraphs + flavor text using the above

cardHelpers.ts   formatCardPrice(), rarityLabel(), cardSubline() — small
                 pure formatting helpers shared by CardCard and CardDetailPage

CardCard.tsx      grid tile: image (with graceful fallback + onError),
                  rarity badge, price badge — links to /carta/:id
CardCardSkeleton.tsx  loading placeholder matching CardCard's footprint
CardGrid.tsx      responsive <ul role="list"> grid container (2–4 cols by breakpoint)
```

All mana/set iconography is fetched live as SVGs from Scryfall's CDN
(`svgs.scryfall.io`) via URL-builder helpers in `services/scryfall.ts`
(`getManaSymbolUrl`, `getSetIconUrl`) — no icon assets are bundled locally
for cards/mana (only `lucide-react` icons for generic UI chrome, and
`public/favicon.svg` for the app's own favicon).

### 3.6 Component/page relationship map

```
components/layout/   Layout, AppHeader, BottomNav, navItems (NAV_ITEMS config)
                      → used once, by App.tsx (Layout) 

components/common/    PageHeader, EmptyState, ErrorState, Spinner
                      → generic, reused across almost every page

components/cards/     CardCard, CardCardSkeleton, CardGrid, ManaCost,
                       ManaSymbol, OracleText (+ helpers)
                      → used by pages/Home, pages/Search, pages/CardDetailPage

components/collections/  EntryRow
                      → used by pages/WishlistPage, pages/HistoryPage

components/wishlist/  WishlistModal
                      → used only by pages/CardDetailPage

pages/                 Home, Search, CardDetailPage, WishlistPage,
                        HistoryPage, ContactPage, NotFoundPage
                      → wired into routes by App.tsx; each imports from
                        components/*, hooks/, services/, types/
```

### 3.7 Styling architecture

- `src/styles/variables.css` — the single source of design tokens (colors,
  spacing, radius, shadows, typography, z-index, layout widths) defined as
  CSS custom properties on `:root`, imported once in `main.tsx`. Includes
  a documented "compatibility aliases" block (`--color-*` names) kept for
  older component CSS that predates the current "Storm/Arcane" palette
  naming.
- `src/styles/global.css` — a modern CSS reset + base element styling
  (focus rings, scrollbar theming, reduced-motion support), also imported
  once in `main.tsx`.
- Every component/page has a co-located `*.module.css` file (CSS Modules,
  scoped class names) — e.g. `CardCard.module.css` next to `CardCard.tsx`.
  There is no global component library; every visual piece is bespoke CSS
  built on the shared token set.
- `pages/Page.module.css` and `pages/Collection.module.css` are shared
  across multiple simple pages (`ContactPage`/`NotFoundPage` use
  `Page.module.css`; `WishlistPage`/`HistoryPage` use
  `Collection.module.css`) rather than each page owning a dedicated
  stylesheet.

---

## 4. File Directory Breakdown

```
ManaDeck/
├── index.html                    HTML entry point; mounts #root, loads src/main.tsx
├── package.json                  Scripts (dev/build/lint/preview) + dependencies
├── package-lock.json             Locked dependency graph (npm)
├── vite.config.ts                Vite config — just the React plugin, no overrides
├── tsconfig.json                 TS project-references root (app + node configs)
├── tsconfig.app.json             TS compiler options for src/ (strict-ish, bundler resolution)
├── tsconfig.node.json            TS compiler options for Vite config itself
├── .oxlintrc.json                Lint rules (react/typescript/oxc plugins)
├── .gitignore                    Standard Node/Vite ignores
├── README.md                     Project readme — STALE, describes an earlier "Phase 1" state
├── public/
│   └── favicon.svg               App favicon (referenced from index.html)
└── src/
    ├── main.tsx                  App bootstrap: StrictMode + BrowserRouter + global CSS imports
    ├── App.tsx                   Route table (all routes nested under <Layout/>)
    ├── styles/
    │   ├── variables.css         Design tokens (colors, spacing, type, radius, z-index…)
    │   └── global.css            CSS reset + base element/typography/scrollbar styling
    ├── types/
    │   ├── index.ts              Barrel: re-exports navigation, card, collections types
    │   ├── card.ts                Scryfall domain types (Card, CardFace, Prices, Legalities,
    │   │                          CardFilters, ScryfallListResponse/Error, isScryfallError guard)
    │   ├── collections.ts         CardSummary/HistoryEntry/WishlistEntry/WishlistDraft +
    │   │                          toCardSummary() converter
    │   └── navigation.ts          NavItem type for the bottom nav config
    ├── services/
    │   ├── index.ts               Barrel re-export of the Scryfall client's public surface
    │   └── scryfall.ts            Scryfall API client: fetch wrapper, error normalisation
    │                              (ScryfallApiError/ScryfallNetworkError), query builder,
    │                              getRandomCards/searchCards/getCardById/getCardPrints,
    │                              getManaSymbolUrl/getSetIconUrl/getCardImage helpers
    ├── lib/
    │   └── persistentStore.ts     Generic localStorage store w/ useSyncExternalStore-style
    │                              subscribe API; cross-tab sync via the "storage" event
    ├── hooks/
    │   ├── index.ts               Barrel re-export of all hooks + their types
    │   ├── useAsync.ts             Generic {data,error,status}+run()/reset() async wrapper
    │   ├── useFetch.ts             Declarative fetch-on-mount/deps-change wrapper (AbortSignal)
    │   ├── useHistory.ts           Recently-viewed history, backed by persistentStore
    │   ├── useWishlist.ts          Wishlist CRUD, backed by persistentStore
    │   └── useScrollToTop.ts       Scrolls to top on route change (mounted in Layout)
    ├── components/
    │   ├── layout/
    │   │   ├── index.ts            Barrel export
    │   │   ├── Layout.tsx           Persistent shell: header + <Outlet/> + bottom nav
    │   │   ├── Layout.module.css
    │   │   ├── AppHeader.tsx        Sticky brand header ("ManaDeck" wordmark, links home)
    │   │   ├── AppHeader.module.css
    │   │   ├── BottomNav.tsx        Fixed bottom nav bar, active-route highlighting
    │   │   ├── BottomNav.module.css
    │   │   └── navItems.ts          NAV_ITEMS config array (route/label/icon per tab)
    │   ├── common/
    │   │   ├── index.ts             Barrel export
    │   │   ├── PageHeader.tsx       Reusable page title/subtitle/actions header
    │   │   ├── PageHeader.module.css
    │   │   ├── EmptyState.tsx        Icon + title + description placeholder block
    │   │   ├── EmptyState.module.css
    │   │   ├── ErrorState.tsx        Error panel w/ message + optional retry button
    │   │   ├── ErrorState.module.css
    │   │   ├── Spinner.tsx           Loading ring, optional visible/SR-only label
    │   │   └── Spinner.module.css
    │   ├── cards/
    │   │   ├── index.ts              Barrel export of the whole card-rendering subsystem
    │   │   ├── CardCard.tsx           Grid tile (image + rarity + price), links to detail page
    │   │   ├── CardCard.module.css
    │   │   ├── CardCardSkeleton.tsx    Loading placeholder for CardCard
    │   │   ├── CardCardSkeleton.module.css
    │   │   ├── CardGrid.tsx            Responsive grid container (<ul role="list">)
    │   │   ├── CardGrid.module.css
    │   │   ├── ManaCost.tsx            Row of ManaSymbols for a mana-cost string
    │   │   ├── ManaCost.module.css
    │   │   ├── ManaSymbol.tsx           Single mana/cost SVG symbol (badge or toggle chip)
    │   │   ├── ManaSymbol.module.css
    │   │   ├── OracleText.tsx           Rules-text box with inline mana symbols + flavor text
    │   │   ├── OracleText.module.css
    │   │   ├── oracleSymbols.tsx        Tokenizes oracle text, swaps {X} for inline SVG <img>
    │   │   ├── cardHelpers.ts           formatCardPrice / rarityLabel / cardSubline helpers
    │   │   └── mana.ts                  parseManaCost() tokenizer
    │   ├── collections/
    │   │   ├── index.ts              Barrel export
    │   │   ├── EntryRow.tsx           Shared compact row for Wishlist & History lists
    │   │   └── EntryRow.module.css
    │   └── wishlist/
    │       ├── index.ts              Barrel export
    │       ├── WishlistModal.tsx      Accessible add/edit dialog (focus trap, validation, portal)
    │       └── WishlistModal.module.css
    └── pages/
        ├── index.ts                  Barrel export of every page component
        ├── Home/
        │   ├── index.tsx              Hero + "Cartas destacadas" random-card grid
        │   └── Home.module.css
        ├── Search/
        │   ├── index.tsx              Search form (text/color/type/format/rarity) + paginated results
        │   ├── Search.module.css
        │   └── searchOptions.ts       Static option lists (COLOR/TYPE/FORMAT/RARITY_OPTIONS)
        ├── CardDetailPage.tsx          Full card detail view (art, text, prices, legalities, prints)
        ├── CardDetailPage.module.css
        ├── WishlistPage.tsx            Wishlist list view (uses Collection.module.css)
        ├── HistoryPage.tsx             History list view (uses Collection.module.css)
        ├── Collection.module.css       Shared styles for Wishlist/History pages
        ├── ContactPage.tsx             Static contact/about page (uses Page.module.css)
        ├── NotFoundPage.tsx            404 fallback page (uses Page.module.css)
        └── Page.module.css             Shared styles for Contact/NotFound pages
```

Note: several source comments reference a `CLAUDE.md` style guide (e.g.
"Storm/Arcane palette per CLAUDE.md", "breakpoints follow RF8 exactly (see
CLAUDE.md)") and functional-requirement IDs like `RF4`/`RF6`/`RF8`
(recently-viewed history, wishlist, responsive grid). No `CLAUDE.md` or
requirements document currently exists in the repository — it was either
never committed or was removed; the code itself is the only remaining
source of truth for those requirements.

---

## 5. Setup & Usage

### Prerequisites
- Node.js (a version compatible with Vite 8 / the `@types/node ^24` dev
  dependency — Node 20+ is recommended) and npm.
- No environment variables, API keys, or `.env` file are required —
  Scryfall's API is public and called anonymously from the browser.
- No backend/database to stand up.

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

Starts the Vite dev server (default `http://localhost:5173`) with HMR.

### Type-check + production build

```bash
npm run build
```

Runs `tsc -b` (project-references build across `tsconfig.app.json` /
`tsconfig.node.json`) followed by `vite build`. The type-check step will
fail the build on any TypeScript error — there is no separate `typecheck`
script.

### Preview the production build

```bash
npm run preview
```

Serves the built `dist/` output locally, as Vite's `preview` would in
production.

### Lint

```bash
npm run lint
```

Runs `oxlint` using `.oxlintrc.json` (React hooks-rules and
component-export rules enabled).

### Testing

**No test runner is configured.** There is no Jest/Vitest/Playwright
config, no `test` script in `package.json`, and no `*.test.*`/`*.spec.*`
files anywhere in `src/`. Verifying behavior currently means running the
dev server and exercising the UI manually, or type-checking via
`npm run build`.

### Routes reference

| Path          | Page              |
| ------------- | ------------------ |
| `/`           | Home                |
| `/buscar`     | Search               |
| `/carta/:id`  | Card detail (Scryfall card id) |
| `/deseos`     | Wishlist              |
| `/historial`  | History                |
| `/contacto`   | Contact                |
| `*`           | 404 Not Found           |
