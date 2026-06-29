import { addDays, isSameDay, startOfDay } from "date-fns";
import type {
  CalendarEvent,
  DateRange,
  DayBucket,
  EventOccurrence,
  GridConfig,
  TimeZone,
} from "./types";
import { expandAll } from "./recurrence";
import { lanePack } from "./lanePack";
import { positionOccurrences } from "./position";
import { toDisplay } from "./timezone";

export interface BuildViewOptions {
  range: DateRange;
  grid: GridConfig;
  /** Display timezone. When unset, the runtime-local zone is used. */
  timeZone?: TimeZone;
}

export interface BuildViewResult<TMeta = Record<string, unknown>> {
  days: DayBucket<TMeta>[];
}

/** Local midnight (in display zone) of an instant. */
function dayStartLocal(instant: Date, zone?: TimeZone): Date {
  return startOfDay(toDisplay(instant, zone));
}

/**
 * Expand events over `range`, then bucket per calendar day (in the display
 * zone), lane-pack overlapping timed occurrences, and compute grid positions.
 * Month views consume the same buckets (ignoring `top`/`height`).
 */
export function buildView<TMeta = Record<string, unknown>>(
  events: CalendarEvent<TMeta>[],
  options: BuildViewOptions,
): BuildViewResult<TMeta> {
  const { range, grid, timeZone } = options;
  const occurrences = expandAll(events, range);

  const timed: EventOccurrence<TMeta>[] = [];
  const allDay: EventOccurrence<TMeta>[] = [];
  for (const occ of occurrences) (occ.allDay ? allDay : timed).push(occ);

  // Build the ordered list of visible days.
  const days: DayBucket<TMeta>[] = [];
  let cursor = dayStartLocal(range.start, timeZone);
  const guard = 400; // safety bound (~1 year+) against malformed ranges
  for (let i = 0; cursor.getTime() < range.end.getTime() && i < guard; i++) {
    const date = cursor;
    const dayTimed = timed.filter((o) =>
      isSameDay(toDisplay(o.start, timeZone), date),
    );
    const dayAllDay = allDay.filter((o) => {
      const s = dayStartLocal(o.start, timeZone).getTime();
      const e = o.end.getTime();
      return s <= date.getTime() && date.getTime() < e;
    });
    days.push({
      date,
      occurrences: positionOccurrences(lanePack(dayTimed), grid, timeZone),
      allDay: dayAllDay,
    });
    cursor = addDays(cursor, 1);
  }

  return { days };
}
