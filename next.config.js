// Content-Security-Policy.
//
// script-src keeps 'unsafe-inline': Next.js App Router injects its own
// inline <script> tags per page to stream React Server Component payloads
// into the client for hydration — blocking inline scripts breaks hydration
// on every page, confirmed by testing (CSP violations on the RSC payload
// scripts, page never becomes interactive). The framework-supported fix is
// a per-request nonce generated in middleware, but that requires reading
// headers() in the root layout, which forces every page to dynamic
// (server-rendered per-request) rendering instead of static generation —
// a much larger architectural change than "add security headers" implies,
// changing the performance/caching profile of the whole app. Not doing that
// blind in this pass. The one inline script this app itself used (theme
// detection + SW registration) was still moved to public/theme-init.js
// (same-origin, external file) on principle, and everything else in this
// policy (connect-src, frame-src, object-src, frame-ancestors, etc.) still
// meaningfully restricts the attack surface even with this one exception.
//
// style-src also keeps 'unsafe-inline' because the app uses React inline
// `style={{...}}` props extensively (dynamic progress-bar widths etc.) —
// CSP restricts the `style` attribute too, and auditing/converting every
// one of those is out of scope here.
// 'unsafe-eval' is added only in development: `next dev`'s webpack HMR/fast
// refresh relies on eval()-based bundling, and without this every page's
// hydration breaks in dev (confirmed: pages hang on client-side checks like
// "Verifying secure session..." because the JS bundle partially fails to
// execute). Production builds (`next build`/`next start`, and Vercel) don't
// use eval-based bundling, so this stays out of the real production policy.
const isDev = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ""}https://sdk.cashfree.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
  "font-src 'self' data:",
  // wss:// explicitly listed alongside https:// for Supabase Realtime (used
  // by the dashboard's live-update subscription), which CSP treats as a
  // distinct scheme from https:// even on the same host. ipwho.is is
  // src/hooks/useLocation.ts's client-side IP-geolocation fallback when
  // browser geolocation is denied/unavailable (used by the climate/weather
  // context on /tracking).
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sdk.cashfree.com https://api.cashfree.com https://sandbox.cashfree.com https://ipwho.is",
  "frame-src https://sdk.cashfree.com https://api.cashfree.com https://sandbox.cashfree.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  // Only takes effect over HTTPS (which Vercel terminates by default); harmless locally over http.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // camera: photo analyzer capture (app/image-analyzer). geolocation: climate/weather context (useLocation).
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=(), payment=(self)" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/service-worker.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
