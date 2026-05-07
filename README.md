# OpenCare — Frontend

React 19 + Vite + TypeScript SPA. All patient-facing UI.

## Stack

- **React 19** with React Router v7
- **Vite 8** with HMR
- **TailwindCSS v4** 
- **shadcn/ui** (Radix UI primitives) + Tabler Icons + Lucide
- **Better Auth** (client SDK) — session management, Google OAuth
- **Cytoscape.js** — interactive ER diagram on `/database`

## Pages

| Route | Description |
|---|---|
| `/sign-in` | Email/password + Google OAuth |
| `/dashboard` | Stats, recent consultations, health profile card |
| `/chat` | AI symptom chat with optional file uploads |
| `/account` | Patient health profile (DOB, sex, weight, blood type, etc.) |
| `/settings` | AI model preferences, account security |
| `/database` | Full-screen interactive ER diagram of the live DB schema |


## Run
This project is package agnostic (you can use any package manager you want)
ex: npm, pnpm, bun, yarn
```bash
npm install
npm run dev      # dev server on :5173
npm run build    # production build to dist/ (on :4173)
npm run preview  # preview production build
```