// Types (the fixed data model + view-layer types)
export type {
  ISODateTime,
  TimeZone,
  Weekday,
  WeekdayName,
  WeekdayInput,
  Actor,
  RecurrenceRule,
  CalendarEvent,
  RoutineSlot,
  RoutineInput,
  EventOccurrence,
  CalendarViewType,
  DateRange,
  GridConfig,
  PositionedOccurrence,
  DayBucket,
} from "./types";

// Model helpers
export {
  isRecurring,
  normalizeWeekday,
  weekdayName,
  weekdayIndex,
  weekdayFromIndex,
  actorInitials,
  generateId,
} from "./helpers";

// Engine
export { expandRecurrence, expandAll } from "./recurrence";
export { lanePack, type PackedOccurrence } from "./lanePack";
export { positionOccurrences } from "./position";
export { buildView, type BuildViewOptions, type BuildViewResult } from "./pipeline";
export { toInstant, toDisplay, minutesSinceMidnight } from "./timezone";

// Adapters
export { fromRoutine, type FromRoutineOptions } from "./fromRoutine";

// Export / import
export { toICS, parseICS, downloadICS } from "./ics";
export { toGoogleCalendarUrl, toOutlookUrl } from "./urls";
