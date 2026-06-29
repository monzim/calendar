import type {
  CalendarEvent,
  CalendarViewType,
  DateRange,
  DayBucket,
  GridConfig,
  TimeZone,
} from "../core/types";

/** Day index for week start: 0 = Sunday … 6 = Saturday. */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface UseCalendarOptions<TMeta = Record<string, unknown>> {
  events: CalendarEvent<TMeta>[];
  defaultView?: CalendarViewType;
  /** Anchor date. Defaults to today (at day granularity, SSR-stable). */
  defaultDate?: Date;
  weekStartsOn?: WeekStart;
  /** Subset of weekday indices to render (work-week). Defaults to all 7. */
  visibleDays?: number[];
  timeZone?: TimeZone;
  /** Partial grid geometry; merged over the 8–18 / 60px defaults. */
  grid?: Partial<GridConfig>;
}

export interface UseCalendarReturn<TMeta = Record<string, unknown>> {
  view: CalendarViewType;
  setView: (view: CalendarViewType) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  goNext: () => void;
  goPrev: () => void;
  goToday: () => void;
  visibleRange: DateRange;
  /** Day buckets to render, filtered to `visibleDays`. */
  days: DayBucket<TMeta>[];
  weekStartsOn: WeekStart;
  visibleDays: number[];
  grid: GridConfig;
  timeZone?: TimeZone;
}
