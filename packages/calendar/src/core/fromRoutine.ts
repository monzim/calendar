import { addDays, startOfDay } from "date-fns";
import type {
  CalendarEvent,
  ISODateTime,
  RecurrenceRule,
  RoutineInput,
  RoutineSlot,
  TimeZone,
  Weekday,
  WeekdayInput,
} from "./types";
import { generateId, normalizeWeekday, weekdayIndex } from "./helpers";
import { toInstant } from "./timezone";

export interface FromRoutineOptions {
  /** Anchor for the first occurrence search. Default: now. */
  baseDate?: ISODateTime | Date;
  /** Timezone applied to every generated event (and used to interpret slot times). */
  timeZone?: TimeZone;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

function dateOnly(d: Date): string {
  return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** First date on/after `base` whose weekday matches `targetIdx` (0=Sun..6=Sat). */
function nextWeekday(base: Date, targetIdx: number): Date {
  const start = startOfDay(base);
  const diff = (targetIdx - start.getDay() + 7) % 7;
  return addDays(start, diff);
}

/**
 * Expand ergonomic weekly routines into canonical recurring `CalendarEvent`s.
 * Schedule days that share the same time window collapse into a single event
 * with a `byWeekday` rule; differing times become separate events.
 */
export function fromRoutine<TMeta = Record<string, unknown>>(
  routines: RoutineInput<TMeta>[],
  options: FromRoutineOptions = {},
): CalendarEvent<TMeta>[] {
  const baseDate = options.baseDate ? toInstant(options.baseDate) : new Date();
  const validFromBase = (validFrom?: ISODateTime) =>
    validFrom ? toInstant(validFrom) : baseDate;

  const events: CalendarEvent<TMeta>[] = [];

  for (const routine of routines) {
    // Group weekday entries by identical "HH:mm-HH:mm" slot.
    const groups = new Map<string, { slot: RoutineSlot; days: Weekday[] }>();
    for (const [rawDay, slot] of Object.entries(routine.schedule)) {
      if (!slot) continue;
      const code = normalizeWeekday(rawDay as WeekdayInput);
      if (!code) continue;
      const key = `${slot.start}-${slot.end}`;
      const group = groups.get(key);
      if (group) group.days.push(code);
      else groups.set(key, { slot: slot as RoutineSlot, days: [code] });
    }

    let groupIndex = 0;
    for (const { slot, days } of groups.values()) {
      // Anchor DTSTART at the earliest matching weekday on/after validFrom/base.
      const anchorBase = validFromBase(routine.validFrom);
      const anchor = days
        .map((d) => nextWeekday(anchorBase, weekdayIndex(d)))
        .sort((a, b) => a.getTime() - b.getTime())[0]!;
      const day = dateOnly(anchor);

      const recurrence: RecurrenceRule = {
        freq: "weekly",
        byWeekday: days,
      };
      if (routine.validUntil) recurrence.until = routine.validUntil;

      const baseId = routine.id ?? generateId("routine");
      events.push({
        id: groups.size > 1 ? `${baseId}__${groupIndex}` : baseId,
        title: routine.title,
        start: `${day}T${slot.start}:00`,
        end: `${day}T${slot.end}:00`,
        timezone: options.timeZone,
        recurrence,
        actors: routine.actors,
        location: routine.location,
        color: routine.color,
        calendarId: routine.calendarId,
        meta: routine.meta,
      });
      groupIndex++;
    }
  }

  return events;
}
