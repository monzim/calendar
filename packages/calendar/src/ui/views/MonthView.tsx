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
    <div className="gcal-scroll overflow-x-auto">
      <div className="min-w-[36rem]">
        <div className="grid grid-cols-7 border-b">
          {weekdayHeader.map((day) => (
            <div
              key={day.date.toISOString()}
              className="px-2 py-2 text-center text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground"
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
                  "min-h-[5.5rem] space-y-0.5 border-b border-r p-1 sm:min-h-28 sm:p-1.5",
                  "[&:nth-child(7n)]:border-r-0",
                  !inMonth && "bg-muted/20",
                )}
              >
                <div className="flex justify-end">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                      isToday && "bg-primary text-primary-foreground",
                      !inMonth && !isToday && "text-muted-foreground",
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
                      "flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-left text-xs transition-colors",
                      onEventClick && "cursor-pointer hover:bg-accent",
                    )}
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                      style={occ.event.color ? { backgroundColor: occ.event.color } : undefined}
                    />
                    <span className="truncate text-foreground/90">{occ.event.title}</span>
                  </button>
                ))}
                {overflow > 0 ? (
                  <div className="px-1.5 text-[0.625rem] font-medium text-muted-foreground">+{overflow} more</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
