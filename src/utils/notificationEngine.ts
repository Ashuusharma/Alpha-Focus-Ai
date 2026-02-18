export type NotificationTriggerInput = {
  uvIndex: number;
  sleepHours: number;
  missedRoutine: boolean;
};

export type SmartNotification = {
  id: string;
  title: string;
  message: string;
  actionLabel: string;
};

export function getSmartNotifications(input: NotificationTriggerInput): SmartNotification[] {
  const notifications: SmartNotification[] = [];

  if (input.uvIndex > 7) {
    notifications.push({
      id: "uv_high",
      title: "High UV Alert",
      message: "UV is high today. Apply and reapply sunscreen.",
      actionLabel: "Apply Sunscreen",
    });
  }

  if (input.sleepHours < 6) {
    notifications.push({
      id: "low_sleep",
      title: "Low Sleep Recovery",
      message: "Hydrate early and keep the routine gentle today.",
      actionLabel: "Open Recovery Routine",
    });
  }

  if (input.missedRoutine) {
    notifications.push({
      id: "missed_routine",
      title: "Consistency Reminder",
      message: "You missed your routine. Complete a quick reset now.",
      actionLabel: "Start Quick Routine",
    });
  }

  return notifications;
}
