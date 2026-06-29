"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { downloadICS } from "../core/ics";
import { toDisplay } from "../core/timezone";
import type {
  CalendarEvent,
  CalendarViewType,
  DayBucket,
  EventOccurrence,
  PositionedOccurrence,
  TimeZone,
} from "../core/types";
import { useCalendar } from "../react/useCalendar";
import { useNow } from "../react/useNow";
import type { UseCalendarOptions } from "../react/types";
import { CalendarHeader } from "./components/CalendarHeader";
import { TimeGrid } from "./components/TimeGrid";
import { EventDialog } from "./components/EventDialog";
import { MonthView } from "./views/MonthView";
import { cn } from "./lib/cn";

export interface CalendarProps<TMeta = Record<string, unknown>>
  extends UseCalendarOptions<TMeta> {
  className?: string;
  /** Which views to offer in the toggle. Default: today / day / week / month. */
  views?: CalendarViewType[];
  /** Show the current-time line in day/today/week. Default true. */
  nowIndicator?: boolean;
  /** Show the ".ics" export button. Default true. */
  showExport?: boolean;
  exportFilename?: string;
  onEventClick?: (occurrence: PositionedOccurrence | EventOccurrence) => void;
}

const DEFAULT_VIEWS: CalendarViewType[] = ["today", "day", "week", "month"];

function rangeLabel(
  view: CalendarViewType,
  start: Date,
  end: Date,
  current: Date,
  tz?: TimeZone,
): string {
  if (view === "month") return format(toDisplay(current, tz), "MMMM yyyy");
  if (view === "day" || view === "today") {
    return format(toDisplay(current, tz), "EEE, MMM d, yyyy");
  }
  const first = toDisplay(start, tz);
  const last = toDisplay(addDays(end, -1), tz);
  return `${format(first, "MMM d")} – ${format(last, "MMM d, yyyy")}`;
}

export function Calendar<TMeta = Record<string, unknown>>(props: CalendarProps<TMeta>) {
  const {
    className,
    views = DEFAULT_VIEWS,
    nowIndicator = true,
    showExport = true,
    exportFilename = "calendar.ics",
    onEventClick,
    ...calendarOptions
  } = props;

  const cal = useCalendar<TMeta>(calendarOptions);
  const now = useNow();

  const label = useMemo(
    () => rangeLabel(cal.view, cal.visibleRange.start, cal.visibleRange.end, cal.currentDate, cal.timeZone),
    [cal.view, cal.visibleRange, cal.currentDate, cal.timeZone],
  );

  const handleExport = showExport
    ? () => downloadICS(calendarOptions.events as CalendarEvent[], exportFilename)
    : undefined;

  // Built-in details dialog. A consumer `onEventClick` overrides it entirely.
  const [selected, setSelected] = useState<EventOccurrence | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const handleEventClick = onEventClick
    ? (onEventClick as (occ: EventOccurrence) => void)
    : (occ: EventOccurrence) => {
        setSelected(occ);
        setDialogOpen(true);
      };

  return (
    <div
      className={cn(
        "gcal-root flex w-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground",
        className,
      )}
    >
      <CalendarHeader
        label={label}
        view={cal.view}
        views={views}
        onViewChange={cal.setView}
        onPrev={cal.goPrev}
        onNext={cal.goNext}
        onToday={cal.goToday}
        onExport={handleExport}
      />

      {cal.view === "month" ? (
        <MonthView
          days={cal.days as DayBucket[]}
          monthDate={cal.currentDate}
          timeZone={cal.timeZone}
          now={now}
          onEventClick={handleEventClick}
        />
      ) : (
        <TimeGrid
          days={cal.days as DayBucket[]}
          grid={cal.grid}
          timeZone={cal.timeZone}
          now={now}
          nowIndicator={nowIndicator}
          onEventClick={handleEventClick}
        />
      )}

      {onEventClick ? null : (
        <EventDialog
          occurrence={selected}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          timeZone={cal.timeZone}
        />
      )}
    </div>
  );
}
