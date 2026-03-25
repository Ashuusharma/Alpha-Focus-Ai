export type NotificationCategory = "routine" | "challenge" | "progress" | "tips" | "system";

export type NotificationEventType =
  | "routine_reminder"
  | "routine_completed"
  | "routine_missed"
  | "challenge_started"
  | "challenge_milestone"
  | "progress_improved"
  | "streak_milestone"
  | "streak_at_risk"
  | "reward_unlocked"
  | "daily_tip"
  | "system_alert";

export type NotificationPreferenceRow = {
  user_id: string;
  routine_enabled: boolean;
  challenge_enabled: boolean;
  progress_enabled: boolean;
  tips_enabled: boolean;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  category: NotificationCategory;
  event_type: NotificationEventType;
  title: string;
  message: string;
  action_url: string | null;
  metadata: Record<string, unknown>;
  dedupe_key: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};
