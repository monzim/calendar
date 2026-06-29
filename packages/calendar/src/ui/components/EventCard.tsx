"use client";

import { format } from "date-fns";
import { actorInitials } from "../../core/helpers";
import { toDisplay } from "../../core/timezone";
import type { PositionedOccurrence, TimeZone } from "../../core/types";
import { Avatar, AvatarFallback, AvatarImage } from "../primitives/avatar";
import { cn } from "../lib/cn";
import { ClockIcon, MapPin } from "./icons";

export interface EventCardProps {
  occurrence: PositionedOccurrence;
  timeZone?: TimeZone;
  onEventClick?: (occurrence: PositionedOccurrence) => void;
}

function fmt(date: Date, tz?: TimeZone): string {
  return format(toDisplay(date, tz), "h:mm a");
}

const GAP = 2; // px between side-by-side lanes

export function EventCard({ occurrence, timeZone, onEventClick }: EventCardProps) {
  const { event, top, height, lane, laneCount } = occurrence;
  const widthPct = 100 / laneCount;
  const interactive = !!onEventClick;
  const color = event.color;

  return (
    <button
      type="button"
      onClick={interactive ? () => onEventClick(occurrence) : undefined}
      disabled={!interactive}
      style={{
        top,
        height: Math.max(height, 22),
        left: `calc(${lane * widthPct}% + ${lane === 0 ? 0 : GAP}px)`,
        width: `calc(${widthPct}% - ${GAP}px)`,
      }}
      className={cn(
        "absolute z-10 flex flex-col gap-0.5 overflow-hidden rounded-md border bg-secondary p-1.5 text-left text-xs text-secondary-foreground shadow-sm",
        interactive && "cursor-pointer transition-colors hover:bg-primary/15",
      )}
    >
      <span className="flex items-center gap-1 text-[0.625rem] font-medium text-muted-foreground">
        <ClockIcon className="h-3 w-3 shrink-0" />
        {fmt(occurrence.start, timeZone)} – {fmt(occurrence.end, timeZone)}
      </span>
      <span className="flex items-center gap-1 leading-tight font-semibold">
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full bg-primary"
          style={color ? { backgroundColor: color } : undefined}
        />
        <span className="truncate">{event.title}</span>
      </span>
      {event.location ? (
        <span className="flex items-center gap-1 truncate text-[0.625rem] text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          {event.location}
        </span>
      ) : null}
      {event.actors?.length ? (
        <span className="mt-auto flex items-center gap-1 pt-0.5">
          <Avatar className="h-5 w-5">
            {event.actors[0]!.avatarUrl ? (
              <AvatarImage src={event.actors[0]!.avatarUrl} alt={event.actors[0]!.name ?? ""} />
            ) : null}
            <AvatarFallback>{actorInitials(event.actors[0]!)}</AvatarFallback>
          </Avatar>
          {event.actors[0]!.name ? (
            <span className="truncate text-[0.625rem] text-muted-foreground">
              {event.actors[0]!.name}
            </span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}
