"use client";

import { format } from "date-fns";
import { actorInitials } from "../../core/helpers";
import { toDisplay } from "../../core/timezone";
import type { PositionedOccurrence, TimeZone } from "../../core/types";
import { Avatar, AvatarFallback, AvatarImage } from "../primitives/avatar";
import { cn } from "../lib/cn";
import { eventStyle } from "../lib/eventStyle";

export interface EventCardProps {
  occurrence: PositionedOccurrence;
  timeZone?: TimeZone;
  onEventClick?: (occurrence: PositionedOccurrence) => void;
}

function fmt(date: Date, tz?: TimeZone): string {
  const local = toDisplay(date, tz);
  return format(local, local.getMinutes() === 0 ? "h a" : "h:mm a");
}

const GAP = 2; // px inset from the column edges
// Overlapping lanes cascade (Google-style): each block spreads past its slot so
// titles stay readable, and later lanes stack on top of earlier ones.
const SPREAD = 1.7;

export function EventCard({ occurrence, timeZone, onEventClick }: EventCardProps) {
  const { event, top, height, lane, laneCount } = occurrence;
  const slot = 100 / laneCount;
  const leftPct = lane * slot;
  const widthPct = lane === laneCount - 1 ? slot : Math.min(slot * SPREAD, 100 - leftPct);
  const interactive = !!onEventClick;

  // Density tiers — drop detail as the block shrinks.
  const inline = height < 40;
  const roomy = height >= 76;
  const actor = event.actors?.[0];
  const timeRange = `${fmt(occurrence.start, timeZone)} – ${fmt(occurrence.end, timeZone)}`;

  return (
    <button
      type="button"
      onClick={interactive ? () => onEventClick(occurrence) : undefined}
      disabled={!interactive}
      title={`${event.title}\n${timeRange}${event.location ? `\n${event.location}` : ""}`}
      style={{
        ...eventStyle(event.color),
        top: top + 1,
        height: Math.max(height - 2, 18),
        left: `calc(${leftPct}% + ${GAP}px)`,
        width: `calc(${widthPct}% - ${GAP * 2}px)`,
        zIndex: 10 + lane,
      }}
      className={cn(
        "gcal-event gcal-event-bar group absolute flex flex-col overflow-hidden rounded-md py-1 pl-2.5 pr-1.5 text-left",
        "transition-[background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        interactive && "cursor-pointer",
      )}
    >
      {inline ? (
        <span className="flex min-w-0 items-baseline gap-1.5 text-xs leading-tight">
          <span className="truncate font-semibold">{event.title}</span>
          <span className="gcal-event-subtle shrink-0 text-[0.6875rem] tabular-nums">
            {fmt(occurrence.start, timeZone)}
          </span>
        </span>
      ) : (
        <>
          <span className="line-clamp-2 text-xs font-semibold leading-snug">{event.title}</span>
          <span className="gcal-event-subtle mt-0.5 truncate text-[0.6875rem] leading-tight tabular-nums">
            {timeRange}
          </span>
          {event.location && height >= 56 ? (
            <span className="gcal-event-subtle truncate text-[0.6875rem] leading-tight">{event.location}</span>
          ) : null}
        </>
      )}

      {roomy && actor ? (
        <span className="mt-auto flex min-w-0 items-center gap-1.5 pt-1">
          <Avatar className="h-4 w-4 ring-1 ring-card">
            {actor.avatarUrl ? <AvatarImage src={actor.avatarUrl} alt={actor.name ?? ""} /> : null}
            <AvatarFallback className="text-[0.5rem]">{actorInitials(actor)}</AvatarFallback>
          </Avatar>
          {actor.name ? (
            <span className="gcal-event-subtle truncate text-[0.6875rem]">{actor.name}</span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}
