# NexEdge deployment

## Production layout

```text
Browser
  -> Vercel (React SPA)
       /api/* -> Render API
       /cdn/* -> Cloudflare Worker
                    -> Render /api/cdn/authorize/:fileId
                    -> Cloudflare edge cache or ImageKit origin
```

Vercel keeps API and CDN requests under the frontend origin. This avoids
cross-site cookie failures while the services remain independently deployed.
The Cloudflare Worker runs at the actual network edge, so production does not
pretend that multiple processes in one Render region are servers in different
Indian cities. The Express CDN router and disk edge servers remain available
for local development.

## 1. Prepare external services

Create these before deploying:

- A MongoDB Atlas database and database user.
- An ImageKit account with public key, private key and URL endpoint.
- Google OAuth credentials and a valid Gmail refresh token.
- A Cloudflare account for the Worker.
- One long random value to use as `CDN_SHARED_SECRET` in both Render and
  Cloudflare.

For a quick MongoDB Atlas demo, allow Render to reach the cluster. For a real
production account, prefer restricted/static outbound IP access rather than
leaving `0.0.0.0/0` permanently enabled.

Generate the shared CDN secret locally:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 2. Deploy the backend to Render

Create a Render Blueprint from the repository root. Render reads
`render.yaml`, uses `Backend` as the service root and deploys in Singapore.

Enter these values when Render requests them:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/nexedge
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=https://your-project.vercel.app,https://*.vercel.app

IMAGEKIT_PUBLIC_KEY=public_your_key
IMAGEKIT_PRIVATE_KEY=private_your_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

GOOGLE_USER=your_email@gmail.com
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_valid_google_oauth_refresh_token

CDN_SHARED_SECRET=the_random_value_generated_above
```

Render generates `JWT_SECRET`. It also injects `PORT` and
`RENDER_EXTERNAL_HOSTNAME`, so neither needs to be entered manually. After the
deployment, record the API URL, for example:

```text
https://nexedge-api.onrender.com
```

The Blueprint uses Render's free plan to avoid creating a paid service without
your approval. Free services sleep after inactivity. Upgrade the API to a paid
always-on instance if smooth first-request latency is required.

## 3. Deploy the CDN to Cloudflare Workers

From `CDN/cloudflare-worker`:

```powershell
npm install
npx wrangler login
npx wrangler secret put ORIGIN_URL
npx wrangler secret put FRONTEND_ORIGIN
npx wrangler secret put CDN_SHARED_SECRET
npm run deploy
```

Provide these values when prompted:

```env
ORIGIN_URL=https://nexedge-api.onrender.com
FRONTEND_ORIGIN=https://your-project.vercel.app
CDN_SHARED_SECRET=the_exact_same_value_used_on_render
```

`CACHE_TTL_SECONDS=300` is already non-secret configuration in
`wrangler.jsonc`. Record the deployed Worker URL, for example:

```text
https://nexedge-cdn.your-subdomain.workers.dev
```

Cloudflare checks the user's cookie with Render before every cache lookup.
Cached file bytes are versioned by the file update timestamp and browser
responses are marked private/no-store.

## 4. Deploy the frontend to Vercel

Import the same repository into Vercel and set the project Root Directory to
`Frontend`. Vercel detects Vite and uses `vercel.mjs` for service rewrites and
SPA fallback routing.

Add these Vercel environment variables to Production and Preview:

```env
VITE_API_BASE_URL=/api
VITE_CDN_BASE_URL=/cdn
VITE_CDN_MODE=cloudflare

API_PROXY_TARGET=https://nexedge-api.onrender.com
CDN_PROXY_TARGET=https://nexedge-cdn.your-subdomain.workers.dev
```

The `API_PROXY_TARGET` and `CDN_PROXY_TARGET` values are used only while
Vercel builds its routing configuration. They are intentionally not prefixed
with `VITE_`, so the frontend bundle does not expose them as application
configuration.

After Vercel assigns the final frontend URL, update both:

- Render `FRONTEND_URL` and `CORS_ORIGINS`
- Cloudflare Worker `FRONTEND_ORIGIN`

Then redeploy/restart those services.

## 5. Local environment files

Copy the supplied examples without committing the resulting secret files.

`Backend/.env`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/nexedge
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:5173
IMAGEKIT_PUBLIC_KEY=public_your_key
IMAGEKIT_PRIVATE_KEY=private_your_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
GOOGLE_USER=your_email@gmail.com
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_valid_google_oauth_refresh_token
CDN_SHARED_SECRET=replace_with_one_shared_random_value
```

`Frontend/.env`:

```env
VITE_API_BASE_URL=/api
VITE_CDN_BASE_URL=/cdn
VITE_CDN_MODE=local
```

`CDN/cdn-router/.env`:

```env
ROUTER_PORT=6000
ORIGIN_URL=http://localhost:3000
CDN_SHARED_SECRET=replace_with_one_shared_random_value
```

`CDN/cloudflare-worker/.dev.vars` when testing the Worker locally:

```env
ORIGIN_URL=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:5173
CDN_SHARED_SECRET=replace_with_one_shared_random_value
```

## 6. Production checks

Check these URLs after deployment:

```text
https://nexedge-api.onrender.com/health
https://nexedge-cdn.your-subdomain.workers.dev/health
https://your-project.vercel.app/login
```

Then register and verify an account, upload a file, open it twice and confirm
the preview changes from `Cache MISS` to `Cache HIT`. Test a shared account
with view-only access and confirm the download button is absent.
