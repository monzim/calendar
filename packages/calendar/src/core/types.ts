/**
 * @monzim/calendar — data model
 * ---------------------------------------------------------------------------
 * The single source of truth for the whole library. Every view, the recurrence
 * engine, and the .ics / Google-Calendar exporters consume these types.
 *
 *   1. A "routine" is just an event with a recurrence rule — one model, every view.
 *   2. The generic `CalendarEvent` is strict (concrete datetimes) so it maps
 *      cleanly to iCalendar (RFC 5545) for export. Ergonomic, date-free input
 *      for weekly schedules lives in `RoutineInput` + the `fromRoutine()` adapter.
 *   3. Everything attachable is optional — supply whatever you have.
 */

// ===========================================================================
// Scalars
// ===========================================================================

/** ISO-8601 datetime, e.g. "2026-06-29T09:30:00+06:00" or "2026-06-29T09:30:00". */
export type ISODateTime = string;

/** IANA timezone identifier, e.g. "Asia/Dhaka", "America/New_York". */
export type TimeZone = string;

/** Two-letter weekday codes — identical to iCalendar (RFC 5545) BYDAY values. */
export type Weekday = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";

/** Full weekday names, accepted as input for convenience. */
export type WeekdayName =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

/** Either form is accepted wherever a weekday is supplied. */
export type WeekdayInput = Weekday | WeekdayName;

// ===========================================================================
// Actor — a person (or entity) attached to an event
// ===========================================================================

/**
 * Someone associated with an event: instructor, organizer, attendee, host, etc.
 * Every field is optional. Provide an `id` when the same person recurs across
 * events so the library can group, filter, and color-code by them.
 */
export interface Actor {
  /** Stable identity across events (e.g. faculty id). Enables "show this person's schedule". */
  id?: string;
  /** Display name. Also drives avatar initials when `avatarUrl` is absent. */
  name?: string;
  email?: string;
  /** Link to an avatar image. */
  avatarUrl?: string;
  /** Free-form role label: "instructor", "organizer", "attendee", "host"... */
  role?: string;
  /** Optional RSVP / participation status. */
  status?: "accepted" | "declined" | "tentative" | "pending";
  /** Optional per-actor color (token name or hex) for color-coding people. */
  color?: string;
}

// ===========================================================================
// Recurrence
// ===========================================================================

/**
 * Structured recurrence rule. Maps 1:1 to iCalendar RRULE on export.
 * For the common timetable case you only need `freq: "weekly"` + `byWeekday`.
 */
export interface RecurrenceRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  /** Repeat every N periods (default 1). */
  interval?: number;
  /** Days of week to repeat on (weekly / monthly). */
  byWeekday?: Weekday[];
  /** Days of month (monthly / yearly): 1..31, or negative to count from month end. */
  byMonthday?: number[];
  /** Stop repeating after this datetime (inclusive). Mutually exclusive with `count`. */
  until?: ISODateTime;
  /** Stop after N occurrences. Mutually exclusive with `until`. */
  count?: number;
}

// ===========================================================================
// CalendarEvent — the generic, canonical model
// ===========================================================================

/**
 * The canonical event. A one-off event has no `recurrence`; a routine is the
 * same shape with a `recurrence` rule attached.
 *
 * `TMeta` lets consumers attach strongly-typed domain data without losing type
 * safety, e.g. CalendarEvent<{ courseCode: string; roomId: string; credits: number }>.
 */
export interface CalendarEvent<TMeta = Record<string, unknown>> {
  /** Unique id. If omitted on input, the library generates one (used as the React key root). */
  id?: string;
  title: string;

  /**
   * Start / end of the (first) occurrence — always concrete datetimes.
   * - One-off: the actual event time.
   * - Recurring: time-of-day + the recurrence anchor (iCal DTSTART).
   * - All-day: the time component is ignored; `end` is treated as exclusive.
   */
  start: ISODateTime | Date;
  end: ISODateTime | Date;
  allDay?: boolean;

  /** Event-local timezone. Falls back to the calendar-level timezone if unset. */
  timezone?: TimeZone;

  /** Present ⇒ this is a routine. Structured rule, or a raw "RRULE:FREQ=WEEKLY;BYDAY=MO" string. */
  recurrence?: RecurrenceRule | string;
  /** Datetimes to skip (cancelled instances) — iCal EXDATE. */
  exceptions?: ISODateTime[];

  /** People attached to this event. One element for the single-faculty case. */
  actors?: Actor[];

  /** Free-text location / room label. */
  location?: string;
  description?: string;
  url?: string;

  /** Color (token name or hex) for rendering this event. */
  color?: string;
  /** Grouping / source calendar ("CSE", "Personal", "Room-101") for filtering + coloring. */
  calendarId?: string;

  /** Per-event opt-out of drag / resize interactions. */
  editable?: boolean;

  /** Typed escape hatch for domain data the model doesn't name (course code, room id, credits...). */
  meta?: TMeta;
}

// ===========================================================================
// RoutineInput — ergonomic, date-free input for weekly schedules
// ===========================================================================

/** A single day's time window inside a routine. Times are local "HH:mm". */
export interface RoutineSlot {
  /** "HH:mm", e.g. "09:30". */
  start: string;
  /** "HH:mm", e.g. "12:00". */
  end: string;
}

/**
 * Convenience input for recurring weekly schedules (class timetables, shift
 * rosters, clinic hours). No calendar dates required — just weekday + time.
 * `fromRoutine()` expands this into standard recurring `CalendarEvent`s.
 *
 * Schedule keys accept BOTH full names ("Monday") and codes ("MO").
 */
export interface RoutineInput<TMeta = Record<string, unknown>> {
  id?: string;
  title: string;
  /** weekday -> time window. A day can appear once; multiple days = multiple instances. */
  schedule: Partial<Record<WeekdayInput, RoutineSlot>>;
  actors?: Actor[];
  location?: string;
  color?: string;
  calendarId?: string;
  /** Optional bounds for the recurrence (semester start/end), else it repeats indefinitely. */
  validFrom?: ISODateTime;
  validUntil?: ISODateTime;
  meta?: TMeta;
}

// ===========================================================================
// EventOccurrence — what the engine produces & views render
// ===========================================================================

/**
 * A concrete, expanded instance of an event on a specific date. The recurrence
 * engine turns `CalendarEvent[]` (some recurring) into `EventOccurrence[]` for a
 * visible date range, applying timezones and dropping `exceptions`.
 *
 * Layout fields (top, height, lane index/count from overlap packing) belong to a
 * view-layer `PositionedOccurrence`, NOT here — the data model stays presentation-free.
 */
export interface EventOccurrence<TMeta = Record<string, unknown>> {
  /** `${event.id}__${startISO}` — stable per instance; safe as a React key. */
  occurrenceId: string;
  /** The source event this instance was expanded from. */
  event: CalendarEvent<TMeta>;
  /** Concrete resolved start / end for this specific instance. */
  start: Date;
  end: Date;
  allDay: boolean;
  /** True when expanded from a recurring event (vs a one-off). */
  isRecurring: boolean;
}

// ===========================================================================
// View-layer types — produced by the engine for time-grid rendering
// ===========================================================================

/** Supported view types in v1. `today` = `day` pinned to the current date. */
export type CalendarViewType = "week" | "day" | "today" | "month";

/** A concrete date range [start, end). */
export interface DateRange {
  start: Date;
  end: Date;
}

/** Time-grid geometry for day/week columns. */
export interface GridConfig {
  /** First visible hour, 0–24. Default 8. */
  dayStartHour: number;
  /** Last visible hour, 0–24 (exclusive bottom). Default 18. */
  dayEndHour: number;
  /** Vertical pixels per hour. Default 60. */
  pxPerHour: number;
}

/**
 * An occurrence with computed layout for a time-grid column. `top`/`height` are
 * pixels; `lane`/`laneCount` pack overlapping events side by side (width = 1/laneCount).
 */
export interface PositionedOccurrence<TMeta = Record<string, unknown>>
  extends EventOccurrence<TMeta> {
  /** Pixel offset from the top of the day column. */
  top: number;
  /** Pixel height of the event block. */
  height: number;
  /** Zero-based column index within its overlap cluster. */
  lane: number;
  /** Total columns in this occurrence's overlap cluster. */
  laneCount: number;
}

/** One day's worth of laid-out occurrences, the unit a view renders. */
export interface DayBucket<TMeta = Record<string, unknown>> {
  /** Midnight (local) of this day. */
  date: Date;
  /** Timed occurrences with grid positions (empty for month view's purposes). */
  occurrences: PositionedOccurrence<TMeta>[];
  /** All-day occurrences spanning this day. */
  allDay: EventOccurrence<TMeta>[];
}
