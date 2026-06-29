"use client";

import { useCallback, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { CalendarViewType, DateRange, DayBucket, GridConfig } from "../core/types";
import { buildView } from "../core/pipeline";
import { toDisplay } from "../core/timezone";
import type { UseCalendarOptions, UseCalendarReturn, WeekStart } from "./types";

const DEFAULT_GRID: GridConfig = { dayStartHour: 8, dayEndHour: 18, pxPerHour: 60 };
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Compute the visible [start, end) range for a view anchored at `date`. */
function rangeFor(view: CalendarViewType, date: Date, weekStartsOn: WeekStart): DateRange {
  switch (view) {
    case "day":
    case "today": {
      const start = startOfDay(date);
      return { start, end: addDays(start, 1) };
    }
    case "month": {
      const start = startOfWeek(startOfMonth(date), { weekStartsOn });
      // Whole weeks: first day of the week AFTER the week containing month-end.
      const end = addDays(startOfWeek(endOfMonth(date), { weekStartsOn }), 7);
      return { start, end };
    }
    case "week":
    default: {
      const start = startOfWeek(date, { weekStartsOn });
      return { start, end: addWeeks(start, 1) };
    }
  }
}

export function useCalendar<TMeta = Record<string, unknown>>(
  options: UseCalendarOptions<TMeta>,
): UseCalendarReturn<TMeta> {
  const {
    events,
    defaultView = "week",
    defaultDate,
    weekStartsOn = 0,
    visibleDays = ALL_DAYS,
    timeZone,
  } = options;

  const grid = useMemo<GridConfig>(() => ({ ...DEFAULT_GRID, ...options.grid }), [options.grid]);

  const [view, setView] = useState<CalendarViewType>(defaultView);
  // Day-granularity anchor: SSR-stable enough (sub-day "now" lives in useNow).
  const [currentDate, setCurrentDate] = useState<Date>(
    () => defaultDate ?? startOfDay(new Date()),
  );

  // Compute the range in the display zone so day boundaries line up with the
  // pipeline's bucketing (date-fns on a TZDate operates in that zone).
  const visibleRange = useMemo(
    () => rangeFor(view, toDisplay(currentDate, timeZone), weekStartsOn),
    [view, currentDate, weekStartsOn, timeZone],
  );

  const allDays = useMemo<DayBucket<TMeta>[]>(
    () => buildView<TMeta>(events, { range: visibleRange, grid, timeZone }).days,
    [events, visibleRange, grid, timeZone],
  );

  // Filter to the requested visible weekdays (work-week). Only meaningful for
  // the week grid — month needs all 7 columns and day shows its single day.
  const days = useMemo<DayBucket<TMeta>[]>(() => {
    if (view !== "week" || visibleDays.length === 7) return allDays;
    const set = new Set(visibleDays);
    return allDays.filter((d) => set.has(toDisplay(d.date, timeZone).getDay()));
  }, [allDays, view, visibleDays, timeZone]);

  const step = useCallback(
    (dir: 1 | -1) => {
      setCurrentDate((d) => {
        switch (view) {
          case "day":
          case "today":
            return addDays(d, dir);
          case "month":
            return addMonths(d, dir);
          default:
            return addWeeks(d, dir);
        }
      });
    },
    [view],
  );

  const goNext = useCallback(() => step(1), [step]);
  const goPrev = useCallback(() => step(-1), [step]);
  const goToday = useCallback(() => setCurrentDate(startOfDay(new Date())), []);

  return {
    view,
    setView,
    currentDate,
    setCurrentDate,
    goNext,
    goPrev,
    goToday,
    visibleRange,
    days,
    weekStartsOn,
    visibleDays,
    grid,
    timeZone,
  };
}
