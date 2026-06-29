import {
  RRule,
  RRuleSet,
  rrulestr,
  type Options,
  type Weekday as RRuleWeekday,
} from "rrule";
import type {
  CalendarEvent,
  DateRange,
  EventOccurrence,
  RecurrenceRule,
  TimeZone,
  Weekday,
} from "./types";
import { generateId, isRecurring } from "./helpers";
import { toInstant, toDisplay } from "./timezone";

const RRULE_WEEKDAY: Record<Weekday, RRuleWeekday> = {
  SU: RRule.SU,
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
};

const FREQ: Record<RecurrenceRule["freq"], number> = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
};

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

/**
 * rrule does all its math in naive UTC. To make recurrence honour the event's
 * wall clock (and DST), we enumerate the pattern in "naive UTC" — a Date whose
 * UTC fields equal the local wall-clock — then rebuild the real instant per hit.
 */
function toNaiveUTC(instant: Date, zone?: TimeZone): Date {
  const d = toDisplay(instant, zone);
  return new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
    ),
  );
}

/** Inverse of {@link toNaiveUTC}: wall-clock parts → real instant in `zone`. */
function fromNaiveUTC(naive: Date, zone?: TimeZone): Date {
  const iso =
    `${pad(naive.getUTCFullYear(), 4)}-${pad(naive.getUTCMonth() + 1)}-${pad(naive.getUTCDate())}` +
    `T${pad(naive.getUTCHours())}:${pad(naive.getUTCMinutes())}:${pad(naive.getUTCSeconds())}`;
  return toInstant(iso, zone);
}

function buildOptions(rule: RecurrenceRule, dtstart: Date, zone?: TimeZone): Partial<Options> {
  const options: Partial<Options> = {
    freq: FREQ[rule.freq],
    dtstart,
    interval: rule.interval ?? 1,
  };
  if (rule.byWeekday?.length) {
    options.byweekday = rule.byWeekday.map((wd) => RRULE_WEEKDAY[wd]);
  }
  if (rule.byMonthday?.length) {
    options.bymonthday = rule.byMonthday;
  }
  if (rule.count != null) {
    options.count = rule.count;
  }
  if (rule.until != null) {
    options.until = toNaiveUTC(toInstant(rule.until, zone), zone);
  }
  return options;
}

function makeOccurrence<TMeta>(
  event: CalendarEvent<TMeta>,
  id: string,
  start: Date,
  durationMs: number,
  recurring: boolean,
): EventOccurrence<TMeta> {
  // Normalize to a plain Date so consumer-facing instants format with "Z".
  const startDate = new Date(start.getTime());
  return {
    occurrenceId: `${id}__${startDate.toISOString()}`,
    event,
    start: startDate,
    end: new Date(startDate.getTime() + durationMs),
    allDay: event.allDay ?? false,
    isRecurring: recurring,
  };
}

/**
 * Expand a single event into concrete occurrences intersecting `range`.
 * Non-recurring events pass through (when they overlap); recurring events are
 * enumerated with rrule and have their `exceptions` (EXDATE) removed.
 */
export function expandRecurrence<TMeta = Record<string, unknown>>(
  event: CalendarEvent<TMeta>,
  range: DateRange,
): EventOccurrence<TMeta>[] {
  const id = event.id ?? generateId();
  const zone = event.timezone;
  const startInstant = toInstant(event.start, zone);
  const endInstant = toInstant(event.end, zone);
  const durationMs = Math.max(0, endInstant.getTime() - startInstant.getTime());

  if (!isRecurring(event)) {
    // Overlaps the range? (treat end as exclusive)
    if (endInstant.getTime() > range.start.getTime() && startInstant.getTime() < range.end.getTime()) {
      return [makeOccurrence(event, id, startInstant, durationMs, false)];
    }
    return [];
  }

  const dtstart = toNaiveUTC(startInstant, zone);
  let rule: RRule | RRuleSet;

  if (typeof event.recurrence === "string") {
    rule = rrulestr(event.recurrence, { dtstart }) as RRule;
  } else {
    rule = new RRule(buildOptions(event.recurrence as RecurrenceRule, dtstart, zone));
  }

  // EXDATE handling requires a set.
  if (event.exceptions?.length) {
    const set = new RRuleSet();
    set.rrule(rule instanceof RRuleSet ? rule.rrules()[0]! : (rule as RRule));
    for (const exc of event.exceptions) {
      set.exdate(toNaiveUTC(toInstant(exc, zone), zone));
    }
    rule = set;
  }

  const afterNaive = toNaiveUTC(range.start, zone);
  const beforeNaive = toNaiveUTC(range.end, zone);

  return rule
    .between(afterNaive, beforeNaive, true)
    .map((naive) => makeOccurrence(event, id, fromNaiveUTC(naive, zone), durationMs, true));
}

/** Expand many events and flatten, sorted by start. */
export function expandAll<TMeta = Record<string, unknown>>(
  events: CalendarEvent<TMeta>[],
  range: DateRange,
): EventOccurrence<TMeta>[] {
  return events
    .flatMap((e) => expandRecurrence(e, range))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}
