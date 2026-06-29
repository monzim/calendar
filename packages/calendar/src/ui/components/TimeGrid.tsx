"use client";

import { format, isSameDay } from "date-fns";
import { toDisplay } from "../../core/timezone";
import type { DayBucket, GridConfig, PositionedOccurrence, TimeZone } from "../../core/types";
import { cn } from "../lib/cn";
import { EventCard } from "./EventCard";
import { NowIndicator } from "./NowIndicator";

export interface TimeGridProps {
  days: DayBucket[];
  grid: GridConfig;
  timeZone?: TimeZone;
  now: Date | null;
  nowIndicator?: boolean;
  onEventClick?: (occurrence: PositionedOccurrence) => void;
}

const GUTTER = "4rem";

function hourLabel(hour: number): string {
  return format(new Date(2000, 0, 1, hour), "h a");
}

export function TimeGrid({ days, grid, timeZone, now, nowIndicator = true, onEventClick }: TimeGridProps) {
  const { dayStartHour, dayEndHour, pxPerHour } = grid;
  const hours: number[] = [];
  for (let h = dayStartHour; h < dayEndHour; h++) hours.push(h);
  const bodyHeight = (dayEndHour - dayStartHour) * pxPerHour;

  const today = now ? toDisplay(now, timeZone) : null;
  const cols = `${GUTTER} repeat(${days.length}, minmax(0, 1fr))`;
  const hasAllDay = days.some((d) => d.allDay.length > 0);

  return (
    <div className="gcal-time-grid overflow-x-auto">
      {/* Header */}
      <div className="grid border-b" style={{ gridTemplateColumns: cols }}>
        <div className="border-r p-2" />
        {days.map((day) => {
          const local = toDisplay(day.date, timeZone);
          const isToday = today ? isSameDay(local, today) : false;
          return (
            <div key={day.date.toISOString()} className="border-r p-2 text-center last:border-r-0">
              <div className="text-xs font-medium text-muted-foreground">{format(local, "EEE")}</div>
              <div
                className={cn(
                  "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {format(local, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day row */}
      {hasAllDay ? (
        <div className="grid border-b bg-muted/40" style={{ gridTemplateColumns: cols }}>
          <div className="flex items-center justify-end border-r p-1 pr-2 text-[0.625rem] text-muted-foreground">
            all-day
          </div>
          {days.map((day) => (
            <div key={day.date.toISOString()} className="min-h-7 space-y-1 border-r p-1 last:border-r-0">
              {day.allDay.map((occ) => (
                <div
                  key={occ.occurrenceId}
                  className="truncate rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
                >
                  {occ.event.title}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {/* Body */}
      <div className="grid" style={{ gridTemplateColumns: cols }}>
        {/* Time gutter */}
        <div className="border-r">
          {hours.map((h) => (
            <div
              key={h}
              className="relative border-b pr-2 text-right text-[0.625rem] text-muted-foreground"
              style={{ height: pxPerHour }}
            >
              <span className="absolute right-2 -top-1.5">{hourLabel(h)}</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const local = toDisplay(day.date, timeZone);
          const isToday = today ? isSameDay(local, today) : false;
          return (
            <div
              key={day.date.toISOString()}
              className="relative border-r last:border-r-0"
              style={{ height: bodyHeight }}
            >
              {hours.map((h) => (
                <div key={h} className="border-b" style={{ height: pxPerHour }} />
              ))}
              {day.occurrences.map((occ) => (
                <EventCard key={occ.occurrenceId} occurrence={occ} timeZone={timeZone} onEventClick={onEventClick} />
              ))}
              {nowIndicator && isToday ? <NowIndicator now={now} grid={grid} timeZone={timeZone} /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
