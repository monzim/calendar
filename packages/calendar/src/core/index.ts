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
export { expandRecurrence, expandAll, type ExpandOptions } from "./recurrence";
export { lanePack, type PackedOccurrence } from "./lanePack";
export { positionOccurrences } from "./position";
export { buildView, type BuildViewOptions, type BuildViewResult } from "./pipeline";
export { toInstant, toDisplay, minutesSinceMidnight, toCalendarDate } from "./timezone";

// Adapters
export { fromRoutine, type FromRoutineOptions } from "./fromRoutine";

// Grouping / filtering (legend)
export {
  groupEvents,
  filterEvents,
  eventGroupKeys,
  type GroupBy,
  type EventGroup,
} from "./filter";

// Remote feeds
export { fetchICS, normalizeFeedUrl, type ICSFeed, type FetchICSOptions } from "./feeds";

// Export / import
export { toICS, parseICS, downloadICS } from "./ics";
export { toGoogleCalendarUrl, toOutlookUrl } from "./urls";
