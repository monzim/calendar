"use client";

import { format } from "date-fns";
import { actorInitials } from "../../core/helpers";
import { toDisplay } from "../../core/timezone";
import type { PositionedOccurrence, TimeZone } from "../../core/types";
import { Avatar, AvatarFallback, AvatarImage } from "../primitives/avatar";
import { cn } from "../lib/cn";

export interface EventCardProps {
  occurrence: PositionedOccurrence;
  timeZone?: TimeZone;
  onEventClick?: (occurrence: PositionedOccurrence) => void;
}

function fmt(date: Date, tz?: TimeZone): string {
  return format(toDisplay(date, tz), "h:mm");
}

const GAP = 3; // px between side-by-side lanes

export function EventCard({ occurrence, timeZone, onEventClick }: EventCardProps) {
  const { event, top, height, lane, laneCount } = occurrence;
  const widthPct = 100 / laneCount;
  const interactive = !!onEventClick;

  // Density tiers — drop detail as the block shrinks.
  const compact = height < 46;
  const roomy = height >= 72;

  return (
    <button
      type="button"
      onClick={interactive ? () => onEventClick(occurrence) : undefined}
      disabled={!interactive}
      style={{
        top,
        height: Math.max(height, 20),
        left: `calc(${lane * widthPct}% + ${lane === 0 ? 0 : GAP}px)`,
        width: `calc(${widthPct}% - ${lane === laneCount - 1 ? 0 : GAP}px)`,
      }}
      className={cn(
        "group absolute z-10 flex flex-col overflow-hidden rounded-lg border bg-card px-2 py-1 text-left shadow-xs ring-0",
        "transition-[background-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        interactive && "cursor-pointer hover:bg-accent hover:shadow-sm",
      )}
    >
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full bg-primary"
          style={event.color ? { backgroundColor: event.color } : undefined}
        />
        <span className="truncate text-xs font-semibold leading-tight">{event.title}</span>
      </span>

      {!compact ? (
        <span className="truncate pl-3.5 text-[0.6875rem] leading-tight text-muted-foreground tabular-nums">
          {fmt(occurrence.start, timeZone)} – {fmt(occurrence.end, timeZone)}
        </span>
      ) : null}

      {roomy && event.location ? (
        <span className="truncate pl-3.5 text-[0.6875rem] leading-tight text-muted-foreground">
          {event.location}
        </span>
      ) : null}

      {roomy && event.actors?.length ? (
        <span className="mt-auto flex items-center gap-1.5 pt-1">
          <Avatar className="h-4 w-4">
            {event.actors[0]!.avatarUrl ? (
              <AvatarImage src={event.actors[0]!.avatarUrl} alt={event.actors[0]!.name ?? ""} />
            ) : null}
            <AvatarFallback className="text-[0.5rem]">{actorInitials(event.actors[0]!)}</AvatarFallback>
          </Avatar>
          {event.actors[0]!.name ? (
            <span className="truncate text-[0.6875rem] text-muted-foreground">{event.actors[0]!.name}</span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}
