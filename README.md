This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Navigation

- Start here: [00_START_HERE.md](00_START_HERE.md)
- Code workflow map: [docs/WORKFLOW_MAP.md](docs/WORKFLOW_MAP.md)
- Documentation index: [docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)
- Contribution workflow: [CONTRIBUTING.md](CONTRIBUTING.md)

## AI Adapter (Local Setup)

This project now includes a provider-agnostic AI adapter endpoint at `POST /api/ai/advice`.

### 1) Configure env vars

1. Copy `.env.example` to `.env.local`
2. Set:

- `AI_API_KEY`
- `AI_BASE_URL` (OpenAI-compatible endpoint)
- `AI_MODEL`

### 2) Built-in cost & safety controls

- Daily budget cap: `AI_DAILY_BUDGET_USD`
- Request rate limit: `AI_REQUESTS_PER_MINUTE`
- Response caching: `AI_CACHE_TTL_SEC`
- Token cap per request: `AI_MAX_TOKENS`

If budget/rate limits are hit, the app automatically falls back to local expert guidance so UX remains smooth.

## Galaxy AI Image Analyzer Integration

The photo analyzer now sends all captured images to a secure server route and then to Galaxy AI.

- Route: `POST /api/galaxy/analyze`
- Env vars:
	- `GALAXY_API_KEY`
	- `GALAXY_API_URL`

### What is sent

- Captured photo set (up to 3 angles)
- Selected analyzer category
- Answered questionnaire categories
- Questionnaire answers (if available)

### What is returned

- Detected issues
- Confidence score
- Annotated analysis image
- Hotspots (affected regions)

The app stores this payload in session storage for result rendering and also writes scan history to local storage (`oneman_scan_history`) so migration to a future DB is straightforward.

## Context Intelligence APIs (Free / No-Key)

The app now integrates a unified context intelligence route at `GET /api/context/intelligence` using:

- Open-Meteo (weather + UV)
- OpenAQ (air quality, with fallback handling)
- ipwho.is (approximate city/location without browser location permission)

No API key is required for this stack.

### Behavior

- On first load, the app can fetch approximate city + climate context via IP (no permission prompt).
- When users grant geolocation, the app upgrades to precise coordinates.
- If OpenAQ is unavailable, AQI automatically falls back to Open-Meteo air-quality data.

### Sleep logging enhancement

Sleep logs now support bedtime capture (`HH:mm`) in addition to hours + quality for better recovery context.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
