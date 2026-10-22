"use client";

import { format, isSameDay } from "date-fns";
import { toDisplay } from "../../core/timezone";
import type { DayBucket, GridConfig, PositionedOccurrence, TimeZone } from "../../core/types";
import { cn } from "../lib/cn";
import { eventStyle } from "../lib/eventStyle";
import type { EventContentRenderer } from "../lib/render";
import { EventCard } from "./EventCard";
import { NowIndicator } from "./NowIndicator";

export interface TimeGridProps {
  days: DayBucket[];
  grid: GridConfig;
  timeZone?: TimeZone;
  now: Date | null;
  nowIndicator?: boolean;
  onEventClick?: (occurrence: PositionedOccurrence) => void;
  renderEventContent?: EventContentRenderer<any>;
}

const GUTTER_PX = 56;
const MIN_COL_PX = 116;

function hourLabel(hour: number): string {
  const h = ((hour + 11) % 12) + 1;
  const suffix = hour < 12 || hour === 24 ? "AM" : "PM";
  return `${h} ${suffix}`;
}

export function TimeGrid({
  days,
  grid,
  timeZone,
  now,
  nowIndicator = true,
  onEventClick,
  renderEventContent,
}: TimeGridProps) {
  const { dayStartHour, dayEndHour, pxPerHour } = grid;
  const hours: number[] = [];
  for (let h = dayStartHour; h < dayEndHour; h++) hours.push(h);
  const bodyHeight = (dayEndHour - dayStartHour) * pxPerHour;

  const today = now ? toDisplay(now, timeZone) : null;
  const cols = `${GUTTER_PX}px repeat(${days.length}, minmax(0, 1fr))`;
  const minWidth = days.length > 1 ? GUTTER_PX + days.length * MIN_COL_PX : undefined;
  const hasAllDay = days.some((d) => d.allDay.length > 0);

  return (
    <div className="gcal-scroll relative overflow-x-auto">
      <div style={{ minWidth }}>
        {/* Header (sticky to top while the body scrolls under it) */}
        <div className="sticky top-0 z-30 grid border-b bg-card" style={{ gridTemplateColumns: cols }}>
          <div className="sticky left-0 z-10 border-r bg-card" />
          {days.map((day) => {
            const local = toDisplay(day.date, timeZone);
            const isToday = today ? isSameDay(local, today) : false;
            return (
              <div key={day.date.toISOString()} className="flex flex-col items-center gap-1 px-1 py-2.5">
                <div
                  className={cn(
                    "text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground",
                    isToday && "text-foreground",
                  )}
                >
                  {format(local, "EEE")}
                </div>
                <div
                  className={cn(
                    "flex h-8 min-w-8 items-center justify-center rounded-full px-1 text-lg font-semibold leading-none tabular-nums tracking-tight transition-colors",
                    isToday ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/90",
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
          <div className="grid border-b" style={{ gridTemplateColumns: cols }}>
            <div className="sticky left-0 z-10 flex items-center justify-end border-r bg-card px-2 py-1 text-[0.625rem] uppercase tracking-wide text-muted-foreground">
              All day
            </div>
            {days.map((day) => (
              <div key={day.date.toISOString()} className="min-h-8 space-y-1 border-r p-1 last:border-r-0">
                {day.allDay.map((occ) => (
                  <button
                    key={occ.occurrenceId}
                    type="button"
                    disabled={!onEventClick}
                    onClick={onEventClick ? () => onEventClick(occ as PositionedOccurrence) : undefined}
                    style={eventStyle(occ.event.color)}
                    className={cn(
                      "gcal-event gcal-event-bar flex w-full items-center truncate rounded-md py-0.5 pl-2.5 pr-1.5 text-left text-xs font-medium transition-colors",
                      onEventClick && "cursor-pointer",
                    )}
                  >
                    {renderEventContent ? (
                      renderEventContent(occ, { surface: "allDay", timeZone })
                    ) : (
                      <span className="truncate">{occ.event.title}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        ) : null}

        {/* Body */}
        <div className="grid" style={{ gridTemplateColumns: cols }}>
          {/* Time gutter (sticky to left while scrolling horizontally) */}
          <div className="sticky left-0 z-10 border-r bg-card">
            {hours.map((h, i) => (
              <div key={h} className="relative" style={{ height: pxPerHour }}>
                {/* The first label would sit on the header edge and get clipped. */}
                {i > 0 ? (
                  <span className="absolute -top-[0.4375rem] right-2 text-[0.625rem] font-medium tabular-nums text-muted-foreground">
                    {hourLabel(h)}
                  </span>
                ) : null}
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
                className={cn("relative border-r last:border-r-0", isToday && "bg-primary/[0.04]")}
                style={{ height: bodyHeight }}
              >
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className={cn("relative", i > 0 && "border-t")}
                    style={{ height: pxPerHour }}
                  >
                    {/* Faint half-hour guide */}
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/30" />
                  </div>
                ))}
                {day.occurrences.map((occ) => (
                  <EventCard
                    key={occ.occurrenceId}
                    occurrence={occ}
                    timeZone={timeZone}
                    onEventClick={onEventClick}
                    renderEventContent={renderEventContent}
                  />
                ))}
                {nowIndicator && isToday ? <NowIndicator now={now} grid={grid} timeZone={timeZone} /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
