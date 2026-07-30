# OpenAI integration troubleshooting

This app calls OpenAI in two places:
- Text/protocol generation — `lib/ai/config.ts`'s `getAIConfig()`, model from `OPENAI_MODEL`
- Photo (Vision) analysis — `lib/ai/config.ts`'s `getVisionAIConfig()`, model from `OPENAI_VISION_MODEL`, called from `lib/ai/visionAnalysis.ts`

Both share `OPENAI_API_KEY` and `OPENAI_BASE_URL`, but are configured with **separate model names on purpose** — a key's project can have access to one model and not the other (see the real incident below).

When Vision fails for any reason, `app/api/galaxy/analyze/route.ts` catches it and falls back to Galaxy AI (or the baseline placeholder response if Galaxy isn't configured either). That means a broken OpenAI config will not surface as a user-facing error — it fails silently into the fallback path. **Always check the logs, not just "does the app work,"** when diagnosing this.

## What to check, in order

### 1. Environment variables actually set
```
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_BASE_URL=
OPENAI_VISION_MODEL=
```
`lib/ai/config.ts` throws `[ai-config] Missing required environment variable: <NAME>` immediately if any of these are empty — check server logs for that exact string first. Remember `.env.local` changes require restarting the dev server (env vars are read at process start via `getAIConfig()`'s internal cache).

### 2. API key validity
A bad/revoked key fails with `401 invalid_api_key`. Test directly, outside the app:
```bash
curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"
```
If this itself 401s, the key is the problem — not the app.

### 3. Project selection (multiple projects on one org)
If your OpenAI account has multiple projects, a key is scoped to exactly one. The `/v1/models` call above returns the model list **for whichever project the key belongs to** — if a model you expect isn't in that list, the key's project doesn't have it, full stop. There's no app-level fix for this; it's an OpenAI dashboard setting.

### 4. Model access (the actual incident we hit)
**Real symptom seen in this app**: `[ai.vision] non_2xx { status: 403, ... "message": "Project \`proj_xxx\` does not have access to model \`gpt-4.1-mini\`", "code": "model_not_found" }`, followed by `[vision] fallback_to_galaxy`.

This was **not a code bug** — the app, request format, and auth were all correct. The project simply didn't have that specific model enabled under **Project Settings → Model Usage** on platform.openai.com. Two ways to resolve it:
- Enable the model in the project's settings (what fixed it here), or
- Point `OPENAI_VISION_MODEL` at a model the project already has access to.

To check what a key actually has access to before assuming anything else is wrong:
```bash
curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).data.map(m=>m.id).sort().join('\n')))"
```

### 5. Does the model actually support vision?
Not every chat model accepts image inputs. Confirm with a minimal direct call before assuming the app is broken:
```bash
curl https://api.openai.com/v1/chat/completions -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" -d '{
  "model": "YOUR_MODEL",
  "max_completion_tokens": 50,
  "messages": [{"role":"user","content":[
    {"type":"text","text":"What color is this, one word?"},
    {"type":"image_url","image_url":{"url":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="}}
  ]}]
}'
```
A `400`/model-specific error here means the model itself doesn't do vision — switch models, this isn't fixable in app code.

### 6. Billing / credits
Insufficient balance or an expired payment method fails with `429 insufficient_quota` (distinct from the rate-limit 429 below — check the `code` field in the error body, not just the HTTP status). Check the Billing tab on platform.openai.com.

### 7. Rate limits
A `429` with `code: "rate_limit_exceeded"` means too many requests/tokens per minute for your tier. `lib/ai/visionAnalysis.ts` already retries once (`VISION_AI_MAX_RETRIES`, default 1) with the same model — persistent rate-limit errors mean you need a higher tier or to reduce request volume, not a code fix. Distinguish this from the `429 rate_limited` this app's own `isRateLimited()` (`lib/server/rateLimit.ts`) returns *before* ever calling OpenAI — check whether the 429 came from our own logs (`[galaxy.analyze] ... rate_limited`) or from `[ai.vision] non_2xx { status: 429 }`.

## Reading the logs for this specific pipeline

Every request through `/api/galaxy/analyze` logs a consistent trace. In order:
```
[vision] prepare_started
[vision] upload_complete       — includes uploadDurationMs, compressedBytes, originalBytes
[vision] request_started
[ai.vision] success            — model, latencyMs, retryCount, tokenUsage
  (or [ai.vision] non_2xx / attempt_error on failure, retried once)
[vision] request_success
[vision] normalized_response
[vision] completed             — selectedModel, fallbackModel, uploadDurationMs,
                                  visionDurationMs, totalDurationMs, tokenUsage
```
On failure instead:
```
[vision] fallback_to_galaxy    — message, name (VisionAnalysisError has typed
                                  fields: promptVersion, model, retryCount,
                                  latencyMs, timeoutReason, lastHttpStatus)
[vision] orphan_cleanup_started / orphan_cleanup_completed   — only if an image
                                  had already been uploaded to Storage before
                                  the failure
[vision] completed             — outcome: "galaxy_fallback_no_key" | "galaxy_success"
```
If you see `fallback_to_galaxy` in logs but the user-facing response looks fine, that's expected — it means Vision failed and Galaxy silently covered for it. Check the message/status in that log line for the actual root cause, using the checklist above.

## A related environment gotcha (not OpenAI, but breaks Vision the same way)

`sharp` (used by `lib/ai/prepareImageForVision.ts`, upstream of every Vision call) requires Node ≥20.9.0 and needs its platform-specific native binary installed. If `npm install` ever runs under an older Node, npm silently skips installing that binary as an "incompatible" optional dependency — the app then throws `Could not load the "sharp" module` the first time an image is processed. Fix: `npm install --include=optional sharp` under a Node ≥20.9.0 runtime, then confirm `node_modules/@img/sharp-win32-x64` (or the equivalent for your OS) actually exists.
