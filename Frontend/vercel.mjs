function deploymentTarget(name) {
  const value = process.env[name]?.trim().replace(/\/$/, "");

  if (!value) {
    throw new Error(`${name} must be set in the Vercel project environment.`);
  }

  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error(`${name} must use HTTPS.`);
  }

  return url.toString().replace(/\/$/, "");
}

const apiTarget = deploymentTarget("API_PROXY_TARGET");
const cdnTarget = deploymentTarget("CDN_PROXY_TARGET");

export const config = {
  rewrites: [
    {
      source: "/api/:path*",
      destination: `${apiTarget}/api/:path*`,
    },
    {
      source: "/cdn/:path*",
      destination: `${cdnTarget}/:path*`,
    },
    {
      source: "/(.*)",
      destination: "/index.html",
    },
  ],
  headers: [
    {
      source: "/(.*)",
      headers: [
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ],
    },
  ],
};
