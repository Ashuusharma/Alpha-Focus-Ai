import "server-only";

export type ServerEnv = {
  OPENAI_API_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  WEB_PUSH_VAPID_PRIVATE_KEY: string;
  NOTIFICATION_SCHEDULER_SECRET: string;
};

export type ServerEnvStatus = {
  openAiConfigured: boolean;
  supabaseConfigured: boolean;
  vapidConfigured: boolean;
  schedulerConfigured: boolean;
};

let cached: ServerEnv | null = null;

function required(name: keyof ServerEnv): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`[env] Missing required server environment variable: ${name}`);
  }
  return value;
}

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  cached = {
    OPENAI_API_KEY: required("OPENAI_API_KEY"),
    SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
    WEB_PUSH_VAPID_PRIVATE_KEY: required("WEB_PUSH_VAPID_PRIVATE_KEY"),
    NOTIFICATION_SCHEDULER_SECRET: required("NOTIFICATION_SCHEDULER_SECRET"),
  };

  return cached;
}

export function getServerEnvStatus(): ServerEnvStatus {
  return {
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    supabaseConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    vapidConfigured: Boolean(process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim() && process.env.WEB_PUSH_VAPID_SUBJECT?.trim()),
    schedulerConfigured: Boolean(process.env.NOTIFICATION_SCHEDULER_SECRET?.trim()),
  };
}
