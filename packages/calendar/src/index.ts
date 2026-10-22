/**
 * @monzim/calendar — batteries-included entry.
 *
 * One import gives you the styled component plus the full data model, the
 * recurrence/layout engine, and the export/import helpers:
 *
 *   import { GoogleCalendarWeekly, fromRoutine } from "@monzim/calendar";
 *   import "@monzim/calendar/styles.css";
 *
 * Power users can drop to the layered entries: "@monzim/calendar/core"
 * (framework-agnostic), "/react" (headless hooks), "/ui" (the skin).
 */

// Data model + engine + export/import
export * from "./core";

// Headless hooks
export {
  useCalendar,
  useNow,
  useEventFilter,
  useICSFeed,
  CalendarProvider,
  useCalendarContext,
} from "./react";
export type {
  WeekStart,
  UseCalendarOptions,
  UseCalendarReturn,
  UseEventFilterOptions,
  UseEventFilterReturn,
  UseICSFeedOptions,
  UseICSFeedReturn,
  ICSFeedError,
  CalendarProviderProps,
} from "./react";

// Batteries-included UI
export { Calendar, GoogleCalendarWeekly, CalendarLegend, printCalendar } from "./ui";
export type { CalendarProps, EventContentRenderer, EventRenderContext } from "./ui";
