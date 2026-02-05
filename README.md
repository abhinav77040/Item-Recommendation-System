# ShopSmart AI – Local E‑Commerce SPA

A single-page e‑commerce website that runs entirely on local data. Products, categories, and images are all stored inside the project; no external APIs or network calls are required.

## Features

- **Local products data**
  - All products and categories are defined in `assets/data/products.js` (`window.LocalData`).
  - Images are inline SVG data URLs (no external image hosting).

- **Modern responsive UI**
  - Tailwind CSS via CDN.
  - Clean layout with hero section, search, category grids, product cards, and modals.

- **Functionality**
  - Search and filter by category and rating.
  - "Load more" pagination on the home products grid.
  - Saved items (wishlist) stored in `localStorage`.
  - Recommended page powered by simple AI‑style recommendation logic (`agent.js` + `agents.js`).
  - Dynamic recommendation popup.
  - Dark mode toggle with preference stored in `localStorage`.

## Project Structure

- `index.html` – main SPA shell and page sections.
- `assets/css/styles.css` – custom styles.
- `assets/js/config.js` – Tailwind configuration helpers.
- `assets/js/ui.js` – UI rendering helpers (cards, pages, carousel, modals).
- `assets/js/router.js` – hash‑based routing (`#home`, `#categories`, `#recommended`, etc.).
- `assets/js/agent.js` – base recommendation engine.
- `assets/js/agents.js` – higher level agents wrapper (`window.Recs`).
- `assets/js/app.js` – main app logic: state, events, routing, dark mode, recommendations.
- `assets/data/products.js` – local products & categories as `window.LocalData`.

## How to Run

1. Open the project folder: `PBL/PBL`.
2. Open `index.html` in a modern browser (Chrome, Edge, etc.).
3. No build step or server is required; it runs as a static site.

> Note: To reset saved items or user data, clear `localStorage` for this site in your browser.
