# NexEdge CDN layer

This adds the CDN (Steps 4-15 from your plan) on top of your existing
Backend, without changing anything that already works. Three pieces:

```
origin-patch/    2 files to add to your existing Backend (new internal route)
edge-server/     ONE reusable edge codebase, run 5x with different .env files
cdn-router/      routes requests to the nearest healthy edge
```

## How the flow works

```
User (browser, has JWT cookie + lat/lng)
  |
  v
CDN Router (:6000)  --- GET /files/:fileId?lat=..&lng=..
  |
  | 1. Calls origin: GET /api/cdn/authorize/:fileId (with user's cookie)
  |    Origin re-uses your EXISTING getAuthorizedFile() logic —
  |    owner-or-active-email-grant, same rules as openFile/downloadFile.
  |    This is what stops "caching bypassing your file permissions."
  |
  | 2. Ranks all healthy edges by Haversine distance to the user
  |
  | 3. Tries nearest edge, falls through to next if it fails
  v
Edge (:5001-5005)  --- GET /serve/:fileId?originUrl=...&version=...
  |
  | Cache check (5 min TTL by default):
  |   HIT  -> serve bytes straight from local disk
  |   MISS -> fetch bytes from ImageKit URL, save to disk, then serve
  v
User gets the file, with X-Cache-Status and X-Served-By-Edge headers
so you can see exactly what happened for your demo/writeup.
```

The edge servers never see the JWT and never talk to Mongo. They only
trust "the router already checked this." The router is the only thing
that talks to the origin's auth logic — so there's exactly one place
in the whole system deciding who can access what, same as before.

## Setup

### 1. Apply the origin patch
See `origin-patch/HOW_TO_APPLY.md` — copies 2 small files into your
existing Backend and adds one route registration in app.js. Nothing
else changes.

### 2. Install and run the 5 edges
```bash
cd edge-server
npm install
./start-all-edges.sh
```
This starts Delhi (5001), Mumbai (5002), Kolkata (5003), Bangalore
(5004), Chennai (5005) — all the SAME codebase in src/server.js,
configured via the .env files in env-examples/.

### 3. Install and run the router
```bash
cd cdn-router
npm install
cp .env.example .env   # edit ORIGIN_URL if your origin isn't on :3000
npm run dev
```

### 4. Run your existing origin as normal
```bash
cd Backend
npm run dev
```

### 5. Try it
Once you're logged in (existing auth flow, so you have a `token`
cookie) and have uploaded a file, fetch it through the CDN instead of
directly:

```
GET http://localhost:6000/files/<fileId>?lat=26.9124&lng=75.7873
```
(That lat/lng is Jaipur — closest to Delhi, so first request should
show `X-Served-By-Edge: Delhi`, `X-Cache-Status: MISS`. Request the
same file again and you'll get `X-Cache-Status: HIT`.)

## Useful endpoints for your demo/writeup

| Endpoint | What it shows |
|---|---|
| `GET :6000/edges` | Which edges are up (Step 14) |
| `GET :6000/metrics` | Aggregate hit ratio/response time across all edges (Step 15) |
| `GET :5001/cache` | What's currently cached on Delhi specifically |
| `DELETE :6000/cache/:fileId` | Invalidate a file across all 5 edges at once (Step 13) |

## What was verified working end-to-end (tested in this session)

- Unauthenticated requests correctly rejected with 401 before ever
  reaching an edge
- A simulated Jaipur user (26.91, 75.78) was correctly routed to Delhi
  over Mumbai — 235.3 km, matching your doc's own worked example
- First request: `MISS`, fetched from origin, cached to disk
- Second identical request: `HIT`, byte-identical response served
  from local cache
- Cache invalidation via the router correctly cleared only the
  targeted file from Delhi's cache, leaving other cached files intact
- Router's `/metrics` correctly aggregated across reachable edges and
  reported unreachable ones honestly rather than crashing

## Honest caveat worth mentioning in your writeup

Your files are already served from ImageKit, which is itself a CDN.
This project layer is caching bytes that are already being served from
a CDN — so it won't outperform ImageKit in a real sense. What it does
demonstrate, and demonstrates correctly, is the actual CDN mechanics:
geo-based routing, cache HIT/MISS/TTL, invalidation, health checks,
and monitoring — which is presumably the point of the exercise. Worth
being upfront about that distinction if this is for a course or
portfolio review.
