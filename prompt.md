Act as a senior frontend engineer. We are starting development on "ManaDeck", a mobile-first web application built with React and TypeScript that consumes the Scryfall API (Magic: The Gathering).

STRICT ARCHITECTURAL & DESIGN CONSTRAINTS:
1. NO CSS frameworks or UI component libraries (Tailwind, Bootstrap, Material UI, Chakra, etc. are strictly forbidden). Use pure modern CSS or CSS Modules.
2. Strict Mobile-First approach with dark theme palette (#121214, #1e1e24, #27272a, with cyan and neon green accents).
3. Use semantic HTML5 elements (<header>, <nav>, <main>, <section>, <article>, <footer>).
4. Do not over-engineer; focus strictly on Step 1.

TASK - PHASE 1 (Project Scaffolding & Base Layout):
1. Ensure the base project is initialized with React + TypeScript (Vite template).
2. Generate a comprehensive `.gitignore` file tailored for a modern React/TypeScript/Vite environment (including node_modules, dist, .env, OS artifacts, build outputs, and editor configurations).
3. Install only essential routing and utility packages (e.g., `react-router-dom` and `lucide-react` for lightweight icons).
4. Set up the folder hierarchy under `src/`:
   - `src/components/layout/`
   - `src/components/common/`
   - `src/pages/`
   - `src/services/`
   - `src/types/`
   - `src/hooks/`
   - `src/styles/`
5. Create a global CSS variables file (`src/styles/variables.css` and `src/styles/global.css`) establishing colors, typography, reset rules, and responsive spacing tokens.
6. Build a persistent mobile-first layout with a fixed bottom navigation bar (Bottom Navigation) featuring active route highlights for:
   - Home (`/`)
   - Search (`/buscar`)
   - Wishlist (`/deseos`)
   - History (`/historial`)
   - Contact (`/contacto`)
7. Create placeholder page components for each route to verify functional navigation and shell layout rendering.

Please produce clean, modular code for Phase 1 without implementing API endpoints or complex business logic yet.
