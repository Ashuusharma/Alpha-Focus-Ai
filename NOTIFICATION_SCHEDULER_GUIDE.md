# Notification Scheduler Guide

## Recommended cadence
- Hourly run: `0 * * * *`
- Reason: catches daily-tip, missed-routine windows, and milestone updates with low load on free-tier databases.

## Vercel setup
1. Keep `vercel.json` with the hourly cron:
   - path: `/api/notifications/scheduler`
   - schedule: `0 * * * *`
2. Set env:
   - `CRON_SECRET=<strong-random-string>`
   - optional: `NOTIFICATION_SCHEDULER_SECRET=<same-or-different-secret>`
3. Route accepts either:
   - `Authorization: Bearer <CRON_SECRET>`
   - `x-scheduler-secret: <NOTIFICATION_SCHEDULER_SECRET>`

## Non-Vercel cron
- Send POST to `/api/notifications/scheduler` with header:
  - `x-scheduler-secret: <NOTIFICATION_SCHEDULER_SECRET>`

## Cost controls
- Engine enforces max `3` notifications/day/user.
- Dedupe keys prevent repeated notifications for same event/day.
- Keep scheduler at hourly; avoid minute-level schedules.
