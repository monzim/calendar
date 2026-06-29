"use client";

import { format, isSameDay, isSameMonth } from "date-fns";
import { toDisplay } from "../../core/timezone";
import type { DayBucket, EventOccurrence, PositionedOccurrence, TimeZone } from "../../core/types";
import { cn } from "../lib/cn";

export interface MonthViewProps {
  days: DayBucket[];
  monthDate: Date;
  timeZone?: TimeZone;
  now: Date | null;
  onEventClick?: (occurrence: PositionedOccurrence | EventOccurrence) => void;
}

const MAX_CHIPS = 3;

export function MonthView({ days, monthDate, timeZone, now, onEventClick }: MonthViewProps) {
  const today = now ? toDisplay(now, timeZone) : null;
  const monthLocal = toDisplay(monthDate, timeZone);
  const weekdayHeader = days.slice(0, 7);

  return (
    <div className="gcal-month-view">
      <div className="grid grid-cols-7 border-b">
        {weekdayHeader.map((day) => (
          <div
            key={day.date.toISOString()}
            className="border-r p-2 text-center text-xs font-medium text-muted-foreground last:border-r-0"
          >
            {format(toDisplay(day.date, timeZone), "EEE")}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const local = toDisplay(day.date, timeZone);
          const isToday = today ? isSameDay(local, today) : false;
          const inMonth = isSameMonth(local, monthLocal);
          const chips: EventOccurrence[] = [...day.allDay, ...day.occurrences];
          const shown = chips.slice(0, MAX_CHIPS);
          const overflow = chips.length - shown.length;

          return (
            <div
              key={day.date.toISOString()}
              className={cn(
                "min-h-24 space-y-1 border-b border-r p-1.5 last:border-r-0",
                !inMonth && "bg-muted/30 text-muted-foreground",
              )}
            >
              <div className="flex justify-end">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday && "bg-primary text-primary-foreground",
                  )}
                >
                  {format(local, "d")}
                </span>
              </div>
              {shown.map((occ) => (
                <button
                  key={occ.occurrenceId}
                  type="button"
                  disabled={!onEventClick}
                  onClick={onEventClick ? () => onEventClick(occ) : undefined}
                  className={cn(
                    "flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-xs",
                    "bg-secondary text-secondary-foreground",
                    onEventClick && "cursor-pointer hover:bg-primary/15",
                  )}
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    style={occ.event.color ? { backgroundColor: occ.event.color } : undefined}
                  />
                  <span className="truncate">{occ.event.title}</span>
                </button>
              ))}
              {overflow > 0 ? (
                <div className="px-1.5 text-[0.625rem] text-muted-foreground">+{overflow} more</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
