## Why this route instead of reusing /api/files/:fileId/download

`downloadFile` does `res.redirect(...)`, which is meant for a browser
tab to follow. The CDN Router is a backend service, not a browser — it
needs a JSON answer it can act on (which edge to hit, whether to cache,
etc.), not an HTTP redirect. Keeping this as its own endpoint also
means you're not tangling CDN-routing concerns into your existing,
already-working file controller.

## Security note

In a real deployment you'd also want to restrict this route so only
your CDN Router's IP/service can call it (e.g. an internal network,
or a shared service-to-service secret header). For your project this
is worth mentioning in your writeup as a "next step," but isn't
required to get the MVP working end-to-end.
