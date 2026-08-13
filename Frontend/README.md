# NexEdge Frontend

React + Vite + SCSS authentication frontend for the NexEdge project.

## Architecture

```text
src/
├── config/
│   └── api.config.js
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── state/
│   │   └── auth.errors.js
│   └── dashboard/
│       └── components/
├── shared/
│   ├── components/
│   ├── services/
│   │   ├── http.service.js
│   │   └── error.service.js
│   └── styles/
├── App.jsx
├── routes.jsx
├── index.scss
└── main.jsx
```

Dependency flow:

`UI/components → hooks/state → feature services → shared HTTP service → backend`

### Error handling architecture

- `http.service.js` owns the shared Axios client only.
- `error.service.js` normalizes network/HTTP errors into `{ status, code, message }`.
- Each feature owns its business-specific error interpretation.
- `auth.errors.js` contains authentication error codes/messages.
- Components do not interpret HTTP status codes.
- If the backend provides an application `code`, it is preserved and treated as authoritative.
- If the current backend does not provide a code, the auth service uses endpoint + status as a controlled fallback.

This prevents a global rule such as `409 = email already exists` from leaking into projects, teams, profile, or other future NexEdge modules.

## Authentication endpoints used

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/get-me`
- `GET /auth/verify-email?token=...`

No backend code is required to run this frontend.

## Environment

Copy `.env.example` to `.env` and set the backend URL if necessary.

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WITH_CREDENTIALS=true
```

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173/login`.
