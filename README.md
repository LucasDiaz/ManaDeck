# ManaDeck

Mobile-first web app for browsing **Magic: The Gathering** cards via the
[Scryfall API](https://scryfall.com/docs/api). Built with React + TypeScript
(Vite). No CSS frameworks or UI libraries — pure modern CSS + CSS Modules,
dark theme, semantic HTML5.

## Stack

- **React 19 + TypeScript**, bundled with **Vite**
- **react-router-dom** — routing
- **lucide-react** — icons
- Styling: CSS custom properties (`src/styles/`) + component-scoped CSS Modules

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

## Project structure

```
src/
├── components/
│   ├── layout/     # AppHeader, BottomNav, Layout shell + nav config
│   └── common/     # shared UI: PageHeader, EmptyState
├── pages/          # one component per route
├── services/       # Scryfall API client (config only in Phase 1)
├── types/          # shared TypeScript types (navigation, Scryfall)
├── hooks/          # reusable hooks (useScrollToTop)
└── styles/         # variables.css (design tokens) + global.css (reset/base)
```

## Routes

| Path         | Page          | Bottom-nav label |
| ------------ | ------------- | ---------------- |
| `/`          | Home          | Inicio           |
| `/buscar`    | Search        | Buscar           |
| `/deseos`    | Wishlist      | Deseos           |
| `/historial` | History       | Historial        |
| `/contacto`  | Contact       | Contacto         |

All pages render inside a persistent shell with a sticky brand header and a
fixed bottom navigation bar that highlights the active route.

## Status

**Phase 1 — scaffolding & base layout.** No API calls or business logic yet.

---

ManaDeck is not affiliated with Wizards of the Coast or Scryfall.
