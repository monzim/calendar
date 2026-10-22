"use client";

import { format, isSameDay } from "date-fns";
import { actorInitials } from "../../core/helpers";
import { toDisplay } from "../../core/timezone";
import type { DayBucket, EventOccurrence, TimeZone } from "../../core/types";
import { Avatar, AvatarFallback, AvatarImage } from "../primitives/avatar";
import { cn } from "../lib/cn";
import { eventStyle } from "../lib/eventStyle";
import type { EventContentRenderer } from "../lib/render";

export interface AgendaViewProps {
  days: DayBucket[];
  timeZone?: TimeZone;
  now: Date | null;
  onEventClick?: (occurrence: EventOccurrence) => void;
  renderEventContent?: EventContentRenderer<any>;
  /** Shown when no day in range has events. */
  emptyLabel?: string;
}

function fmtTime(date: Date, tz?: TimeZone): string {
  const local = toDisplay(date, tz);
  return format(local, local.getMinutes() === 0 ? "h a" : "h:mm a");
}

function DefaultRow({ occurrence, timeZone }: { occurrence: EventOccurrence; timeZone?: TimeZone }) {
  const { event } = occurrence;
  const actor = event.actors?.[0];
  return (
    <>
      <span className="w-28 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground sm:w-36">
        {occurrence.allDay ? "All day" : `${fmtTime(occurrence.start, timeZone)} – ${fmtTime(occurrence.end, timeZone)}`}
      </span>
      <span aria-hidden className="gcal-event-dot mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{event.title}</span>
        {event.location || actor ? (
          <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            {event.location ? <span className="truncate">{event.location}</span> : null}
            {event.location && actor ? <span aria-hidden>·</span> : null}
            {actor ? (
              <span className="flex min-w-0 items-center gap-1.5">
                <Avatar className="h-4 w-4">
                  {actor.avatarUrl ? <AvatarImage src={actor.avatarUrl} alt={actor.name ?? ""} /> : null}
                  <AvatarFallback className="text-[0.5rem]">{actorInitials(actor)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{actor.name ?? actor.email}</span>
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </>
  );
}

/** Chronological list of occurrences, grouped by day; days without events are skipped. */
export function AgendaView({
  days,
  timeZone,
  now,
  onEventClick,
  renderEventContent,
  emptyLabel = "Nothing scheduled in this period.",
}: AgendaViewProps) {
  const today = now ? toDisplay(now, timeZone) : null;
  const withEvents = days.filter((d) => d.allDay.length + d.occurrences.length > 0);

  if (withEvents.length === 0) {
    return <div className="px-4 py-16 text-center text-sm text-muted-foreground">{emptyLabel}</div>;
  }

  return (
    <div className="gcal-scroll divide-y overflow-y-auto">
      {withEvents.map((day) => {
        const local = toDisplay(day.date, timeZone);
        const isToday = today ? isSameDay(local, today) : false;
        const items: EventOccurrence[] = [...day.allDay, ...day.occurrences];
        return (
          <section key={day.date.toISOString()} className="gcal-agenda-day flex gap-3 px-3 py-3 sm:gap-6 sm:px-4">
            <div className="flex w-12 shrink-0 flex-col items-center gap-0.5 pt-1 sm:w-14">
              <span
                className={cn(
                  "text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground",
                  isToday && "text-foreground",
                )}
              >
                {format(local, "EEE")}
              </span>
              <span
                className={cn(
                  "flex h-9 min-w-9 items-center justify-center rounded-full px-1 text-xl font-semibold tabular-nums tracking-tight",
                  isToday && "bg-primary text-primary-foreground shadow-sm",
                )}
              >
                {format(local, "d")}
              </span>
              <span className="text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">
                {format(local, "MMM")}
              </span>
            </div>
            <ul className="flex min-w-0 flex-1 flex-col gap-0.5">
              {items.map((occ) => (
                <li key={occ.occurrenceId}>
                  <button
                    type="button"
                    disabled={!onEventClick}
                    onClick={onEventClick ? () => onEventClick(occ) : undefined}
                    style={eventStyle(occ.event.color)}
                    className={cn(
                      "flex w-full min-w-0 items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      onEventClick && "cursor-pointer hover:bg-accent",
                    )}
                  >
                    {renderEventContent ? (
                      renderEventContent(occ, { surface: "agenda", timeZone })
                    ) : (
                      <DefaultRow occurrence={occ} timeZone={timeZone} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
