export type ReminderType = "pm_routine" | "hydration" | "sleep";

export type RoutineReminder = {
  type: ReminderType;
  enabled: boolean;
  hour24: number;
  minute: number;
  label: string;
};

const REMINDER_KEY = "oneman_routine_reminders";
const INDIA_TIMEZONE = "Asia/Kolkata";

const defaultReminders: RoutineReminder[] = [
  { type: "pm_routine", enabled: true, hour24: 21, minute: 0, label: "Time for your PM routine check-in." },
  { type: "hydration", enabled: true, hour24: 15, minute: 0, label: "Hydration check: finish your water target." },
  { type: "sleep", enabled: true, hour24: 23, minute: 0, label: "Sleep window starts now for better recovery." },
];

export function loadRoutineReminders() {
  if (typeof window === "undefined") return defaultReminders;
  try {
    const raw = localStorage.getItem(REMINDER_KEY);
    if (!raw) return defaultReminders;
    const parsed = JSON.parse(raw) as RoutineReminder[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultReminders;
    return parsed;
  } catch {
    return defaultReminders;
  }
}

export function saveRoutineReminders(reminders: RoutineReminder[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
}

export async function ensureNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

function getIndiaClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: INDIA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  return {
    hour24: Number(parts.find((part) => part.type === "hour")?.value || "0"),
    minute: Number(parts.find((part) => part.type === "minute")?.value || "0"),
  };
}

export function getDueReminder(reminders = loadRoutineReminders(), now = new Date()) {
  const indiaClock = getIndiaClock(now);

  return reminders.find((reminder) => {
    if (!reminder.enabled) return false;
    return reminder.hour24 === indiaClock.hour24 && reminder.minute === indiaClock.minute;
  }) || null;
}

export function maybeSendRoutineReminder(reminders = loadRoutineReminders(), now = new Date()) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const due = getDueReminder(reminders, now);
  if (!due) return;

  const dedupeKey = `oneman_last_reminder_${due.type}`;
  const dayStamp = now.toISOString().slice(0, 10);
  if (localStorage.getItem(dedupeKey) === dayStamp) return;

  new Notification("Alpha Focus Coach", {
    body: due.label,
    icon: "/icons/icon-192.png",
  });

  localStorage.setItem(dedupeKey, dayStamp);
}
