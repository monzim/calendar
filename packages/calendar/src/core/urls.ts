import type { CalendarEvent } from "./types";
import { toCalendarDate, toInstant } from "./timezone";
import { ruleToRRULEString } from "./internal-rrule";

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

function gcalStamp(date: Date): string {
  return (
    `${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/**
 * Deep-link into Google Calendar's pre-filled event composer.
 * Includes recurrence (`recur=RRULE:...`) when the event is a routine.
 */
export function toGoogleCalendarUrl<TMeta = Record<string, unknown>>(
  event: CalendarEvent<TMeta>,
): string {
  const dates = event.allDay
    ? `${toCalendarDate(event.start, event.timezone).replace(/-/g, "")}/${toCalendarDate(event.end, event.timezone).replace(/-/g, "")}`
    : `${gcalStamp(toInstant(event.start, event.timezone))}/${gcalStamp(toInstant(event.end, event.timezone))}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
  });
  if (event.description) params.set("details", event.description);
  if (event.location) params.set("location", event.location);

  let url = `https://calendar.google.com/calendar/render?${params.toString()}`;
  if (event.recurrence) {
    // Google wants `recur` un-encoded as RRULE:... (one rule line).
    url += `&recur=${encodeURIComponent(`RRULE:${ruleToRRULEString(event.recurrence)}`)}`;
  }
  return url;
}

/**
 * Deep-link into Outlook's web composer. Note: Outlook's URL scheme has no
 * reliable recurrence support, so recurring events deep-link as the first
 * occurrence only (use the .ics export for full recurrence).
 */
export function toOutlookUrl<TMeta = Record<string, unknown>>(
  event: CalendarEvent<TMeta>,
): string {
  const allDay = event.allDay ?? false;
  const start = toInstant(event.start, event.timezone);
  const end = toInstant(event.end, event.timezone);

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: allDay ? toCalendarDate(event.start, event.timezone) : start.toISOString(),
    enddt: allDay ? toCalendarDate(event.end, event.timezone) : end.toISOString(),
  });
  if (allDay) params.set("allday", "true");
  if (event.description) params.set("body", event.description);
  if (event.location) params.set("location", event.location);

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
