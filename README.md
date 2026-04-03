# FitDesi Frontend

Dark, energetic React + Vite frontend for your AI gym bro backend.

## Tech Stack
- **React 18** + **React Router v6**
- **Vite** (dev server with proxy to FastAPI)
- **Recharts** (weekly calorie chart)
- **Lucide React** (icons)
- **CSS Modules** (scoped styles, no Tailwind needed)
- **Fonts:** Bebas Neue (display) · Syne (body) · JetBrains Mono (mono)

## Screens
| Route | Page |
|---|---|
| `/login` | Onboarding / profile setup |
| `/chat` | AI gym bro chat interface |
| `/dashboard` | Calories + protein progress rings, weekly chart |
| `/logs` | Today's meal log history |
| `/profile` | View & edit profile, BMI, BMR |

## Quick Start

```bash
# 1. Install dependencies
cd fitdesi
npm install

# 2. Start the dev server (proxies /api → localhost:8000)
npm run dev

# 3. Make sure your FastAPI backend is running on port 8000
# cd ../  &&  uvicorn main:app --reload
```

## Backend Routes Required
The frontend calls these endpoints — make sure they exist in `main.py`.
See `BACKEND_ADDITIONS.py` for copy-paste implementations.

| Method | Route | Used by |
|---|---|---|
| POST | `/api/user` | Login page (create profile) |
| GET | `/api/user/{id}` | Profile page |
| GET | `/api/user/{id}/progress` | Dashboard (already in your main.py) |
| GET | `/api/user/{id}/logs` | Logs page |
| POST | `/api/chat` | Chat page (already in your main.py) |

## Project Structure
```
src/
├── api/index.js          # All API calls (axios)
├── hooks/useAuth.jsx     # Auth context + localStorage persistence
├── components/
│   ├── Sidebar.jsx       # Navigation sidebar
│   └── Sidebar.module.css
├── pages/
│   ├── LoginPage.jsx     # Onboarding / sign-up
│   ├── ChatPage.jsx      # Main chat UI
│   ├── DashboardPage.jsx # Progress rings + chart
│   ├── LogsPage.jsx      # Meal log history
│   └── ProfilePage.jsx   # Profile + BMI/BMR stats
├── index.css             # Global CSS variables + utilities
├── App.jsx               # Router + auth guard
└── main.jsx              # Entry point
```

## Notes
- User data is stored in `localStorage` — no separate auth server needed.
- The Vite proxy (`vite.config.js`) forwards `/api/*` to `http://localhost:8000`,
  so no CORS issues in development.
- Weekly chart uses mock data — wire up a real `/api/user/{id}/weekly` endpoint
  when ready.
