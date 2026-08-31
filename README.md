# A Gentle Month

A calm, editable monthly planner inspired by botanical paper stationery. It includes month navigation, editable goals, important dates, a monthly mantra, calendar day notes, reflections, local autosave, and print-friendly styling.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Build for deployment

```bash
npm install
npm run build
```

The production files are written to `dist/`.

For a static host such as GitHub Pages, Netlify, Vercel, or Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `dist`

This app has no backend and stores planner entries in the browser's local storage under the `a-gentle-month:planner:v1` key. Use the Print button to create a paper or PDF copy from the browser print dialog.
