# NexEdge
NexEdge — A next generation distributed CDN that uses geo-routing and edge caching to deliver content from the nearest available server.

## Structure

```text
Backend/   Express, MongoDB, authentication, ImageKit and file permissions
CDN/       Local edge simulation and production Cloudflare Worker
Frontend/  Responsive React interface and Vercel routing configuration
```

The frontend uses a small feature-based structure. Each feature keeps its page,
components, state and requests together, so related code is easy to find:

```text
Frontend/src/
├── config/
│   └── api.js             Shared API configuration
├── features/
│   ├── auth/              Login, registration and user session
│   ├── cdn/               Edge health, location and CDN delivery
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

### Recommended on Windows

After installing dependencies in `Backend`, `Frontend`, `CDN/edge-server` and
`CDN/cdn-router`, start the complete project from the root folder:

```powershell
.\start-nexedge.ps1
```

This starts the backend, five edge servers, CDN router and frontend together.
Press `Ctrl+C` to stop the services started by the script. If a service is
already running, its port is left untouched. Runtime logs are written to the
ignored `.runtime` folder.

### Start services manually

Start the API:

```powershell
cd Backend
npm install
npm run dev
```

Install the CDN packages once:

```powershell
cd CDN\edge-server
npm install
cd ..\cdn-router
npm install
```

Start the edge servers using `CDN/edge-server/start-all-edges.sh` in Git Bash,
then start the router in another terminal:

```powershell
cd CDN\cdn-router
npm run dev
```

Start the frontend in another terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend on port 3000
and `/cdn` to the CDN router on port 6000. Keeping both behind the frontend
origin allows the existing HTTP-only authentication cookie to protect every
CDN preview request.

The frontend uses an India-center routing location until the user selects the
crosshair button. After location permission is granted, previews are routed by
the device coordinates. The preview toolbar shows the selected edge, cache
HIT/MISS state and edge distance returned by the CDN router.

## Deploy

Production uses Vercel for the frontend, Render Singapore for the API and a
Cloudflare Worker for real global edge caching. Follow [DEPLOYMENT.md](DEPLOYMENT.md)
for the deployment order and complete environment-variable templates.
