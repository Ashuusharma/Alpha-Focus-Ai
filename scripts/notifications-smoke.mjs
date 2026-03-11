import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal(workspace) {
  const envPath = path.join(workspace, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function readJsonSafe(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

async function main() {
  const workspace = process.cwd();
  loadEnvLocal(workspace);

  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3010";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let email = process.env.E2E_EMAIL;
  let password = process.env.E2E_PASSWORD;

  if (!supabaseUrl || !supabaseAnon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const supabase = createClient(supabaseUrl, supabaseAnon);

  if (!email || !password) {
    const nonce = Date.now();
    email = `qa.notifications.${nonce}@example.com`;
    password = `NotifSmoke#${String(nonce).slice(-6)}!`;
    const signUp = await supabase.auth.signUp({ email, password });
    if (signUp.error) {
      throw new Error(`Auto sign-up failed: ${signUp.error.message}`);
    }
  }

  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.session?.access_token) {
    throw new Error(`Sign-in failed: ${signIn.error?.message || "unknown"}`);
  }

  const token = signIn.data.session.access_token;
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const prefGet = await fetch(`${baseUrl}/api/notifications/preferences`, {
    method: "GET",
    headers: authHeaders,
  });
  const prefGetJson = await readJsonSafe(prefGet);
  if (!prefGet.ok || !prefGetJson?.ok) {
    throw new Error(`Preferences GET failed: ${prefGet.status} ${JSON.stringify(prefGetJson)}`);
  }

  const prefPatch = await fetch(`${baseUrl}/api/notifications/preferences`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      routineEnabled: true,
      challengeEnabled: true,
      progressEnabled: true,
      tipsEnabled: true,
    }),
  });
  const prefPatchJson = await readJsonSafe(prefPatch);
  if (!prefPatch.ok || !prefPatchJson?.ok) {
    throw new Error(`Preferences PATCH failed: ${prefPatch.status} ${JSON.stringify(prefPatchJson)}`);
  }

  const dedupeKey = `smoke:${new Date().toISOString().slice(0, 16)}`;
  const create = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      eventType: "system_alert",
      dedupeKey,
      metadata: { source: "notifications-smoke" },
    }),
  });
  const createJson = await readJsonSafe(create);
  if (!create.ok || !createJson?.ok) {
    throw new Error(`Create failed: ${create.status} ${JSON.stringify(createJson)}`);
  }

  const list = await fetch(`${baseUrl}/api/notifications?limit=20`, {
    method: "GET",
    headers: authHeaders,
  });
  const listJson = await readJsonSafe(list);
  if (!list.ok || !listJson?.ok || !Array.isArray(listJson.notifications)) {
    throw new Error(`List failed: ${list.status} ${JSON.stringify(listJson)}`);
  }

  const notificationId = listJson.notifications[0]?.id;
  if (!notificationId) {
    throw new Error("List succeeded but no notification id found.");
  }

  const readOne = await fetch(`${baseUrl}/api/notifications/read`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ ids: [notificationId] }),
  });
  const readOneJson = await readJsonSafe(readOne);
  if (!readOne.ok || !readOneJson?.ok) {
    throw new Error(`Read failed: ${readOne.status} ${JSON.stringify(readOneJson)}`);
  }

  const schedulerSecret = process.env.NOTIFICATION_SCHEDULER_SECRET || process.env.CRON_SECRET;
  let schedulerStatus = "skipped";
  if (schedulerSecret) {
    const scheduler = await fetch(`${baseUrl}/api/notifications/scheduler`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-scheduler-secret": schedulerSecret,
      },
      body: JSON.stringify({ userId: signIn.data.user?.id }),
    });
    const schedulerJson = await readJsonSafe(scheduler);
    if (!scheduler.ok || !schedulerJson?.ok) {
      throw new Error(`Scheduler failed: ${scheduler.status} ${JSON.stringify(schedulerJson)}`);
    }
    schedulerStatus = "ok";
  }

  console.log(JSON.stringify({
    ok: true,
    baseUrl,
    notificationId,
    unreadCount: Number(listJson.unreadCount || 0),
    schedulerStatus,
  }, null, 2));
}

main().catch((error) => {
  console.error("notifications-smoke failed");
  console.error(error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
  process.exit(1);
});
