# NexEdge
NexEdge — A next generation distributed CDN that uses geo-routing and edge caching to deliver content from the nearest available server.

## Structure

```text
Backend/   Express, MongoDB, authentication, ImageKit and file permissions
Frontend/  Responsive React interface for mobile, tablet and desktop
```

The frontend uses a small feature-based structure. Each feature keeps its page,
components, state and requests together, so related code is easy to find:

```text
Frontend/src/
├── config/
│   └── api.js             Shared API configuration
├── features/
│   ├── auth/              Login, registration and user session
│   ├── files/             File pages, components, requests and helpers
│   └── theme/             Light/dark theme state and switch
├── App.jsx                Application entry component
├── index.css              Responsive themes, layout and animation
├── main.jsx               React setup and providers
└── routes.jsx             Frontend routes and route protection
```

Empty top-level `api` and `auth` folders are intentionally not kept. API setup is
in `config/api.js`, while working authentication files live in `features/auth`.

## Run locally

Start the API:

```powershell
cd Backend
npm install
npm run dev
```

Start the frontend in another terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend on port 3000,
so the existing HTTP-only authentication cookie works during development.
