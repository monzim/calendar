"use client";

import { format, isSameDay, isSameMonth } from "date-fns";
import { toDisplay } from "../../core/timezone";
import type { DayBucket, EventOccurrence, PositionedOccurrence, TimeZone } from "../../core/types";
import { cn } from "../lib/cn";
import { eventStyle } from "../lib/eventStyle";
import type { EventContentRenderer } from "../lib/render";

export interface MonthViewProps {
  days: DayBucket[];
  monthDate: Date;
  timeZone?: TimeZone;
  now: Date | null;
  onEventClick?: (occurrence: PositionedOccurrence | EventOccurrence) => void;
  renderEventContent?: EventContentRenderer<any>;
}

const MAX_CHIPS = 3;

function chipTime(date: Date, tz?: TimeZone): string {
  const local = toDisplay(date, tz);
  return format(local, local.getMinutes() === 0 ? "h a" : "h:mm a").replace(" ", "").toLowerCase();
}

export function MonthView({ days, monthDate, timeZone, now, onEventClick, renderEventContent }: MonthViewProps) {
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
              className="px-2 py-2.5 text-center text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground"
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
                  "flex min-h-[5.5rem] flex-col gap-0.5 border-b border-r p-1 sm:min-h-28 sm:p-1.5",
                  "[&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0",
                  !inMonth && "bg-muted/40",
                  isToday && "bg-primary/[0.04]",
                )}
              >
                <div className="mb-0.5 flex px-0.5">
                  <span
                    className={cn(
                      "flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums",
                      isToday && "bg-primary text-primary-foreground shadow-sm",
                      !inMonth && !isToday && "font-medium text-muted-foreground/70",
                    )}
                  >
                    {format(local, local.getDate() === 1 ? "MMM d" : "d")}
                  </span>
                </div>
                {shown.map((occ) => (
                  <button
                    key={occ.occurrenceId}
                    type="button"
                    disabled={!onEventClick}
                    onClick={onEventClick ? () => onEventClick(occ) : undefined}
                    style={eventStyle(occ.event.color)}
                    className={cn(
                      "flex w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-xs transition-colors",
                      occ.allDay ? "gcal-event font-medium" : "hover:bg-accent",
                      onEventClick && "cursor-pointer",
                      !inMonth && "opacity-60",
                    )}
                  >
                    {renderEventContent ? (
                      renderEventContent(occ, { surface: "month", timeZone })
                    ) : (
                      <>
                        {occ.allDay ? null : (
                          <span aria-hidden className="gcal-event-dot h-2 w-2 shrink-0 rounded-full" />
                        )}
                        {occ.allDay ? null : (
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {chipTime(occ.start, timeZone)}
                          </span>
                        )}
                        <span className={cn("truncate", !occ.allDay && "font-medium text-foreground/90")}>
                          {occ.event.title}
                        </span>
                      </>
                    )}
                  </button>
                ))}
                {overflow > 0 ? (
                  <div className="px-1.5 text-[0.6875rem] font-medium text-muted-foreground">+{overflow} more</div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
