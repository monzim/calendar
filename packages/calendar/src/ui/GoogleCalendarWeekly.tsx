"use client";

import { Calendar, type CalendarProps } from "./Calendar";

/**
 * Week-first preset — the spiritual successor to the original
 * `GoogleCalendarWeekly` component. Identical to `<Calendar>` but defaults to
 * the week view with a Sunday week start. Every `Calendar` prop still applies.
 */
export function GoogleCalendarWeekly<TMeta = Record<string, unknown>>(
  props: CalendarProps<TMeta>,
) {
  return <Calendar<TMeta> defaultView="week" weekStartsOn={0} {...props} />;
}
