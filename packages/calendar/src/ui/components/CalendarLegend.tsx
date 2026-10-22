"use client";

import { actorInitials } from "../../core/helpers";
import type { EventGroup } from "../../core/filter";
import { Avatar, AvatarFallback, AvatarImage } from "../primitives/avatar";
import { cn } from "../lib/cn";
import { eventStyle } from "../lib/eventStyle";

export interface CalendarLegendProps {
  groups: EventGroup[];
  isHidden: (key: string) => boolean;
  /** Click toggles a group. */
  onToggle: (key: string) => void;
  /** Alt/Option-click (or double-click) shows only that group. */
  onSolo?: (key: string) => void;
  onShowAll?: () => void;
  className?: string;
}

/** Toggleable chip bar for filtering events by calendar, person, or custom group. */
export function CalendarLegend({ groups, isHidden, onToggle, onSolo, onShowAll, className }: CalendarLegendProps) {
  if (groups.length === 0) return null;
  const anyHidden = groups.some((g) => isHidden(g.key));

  return (
    <div
      role="group"
      aria-label="Filter events"
      className={cn("gcal-print-hide flex flex-wrap items-center gap-1.5 border-b px-3 py-2 sm:px-4", className)}
    >
      {groups.map((group) => {
        const hidden = isHidden(group.key);
        return (
          <button
            key={group.key}
            type="button"
            aria-pressed={!hidden}
            title={onSolo ? "Click to toggle · Alt-click to show only this" : undefined}
            onClick={(e) => (e.altKey && onSolo ? onSolo(group.key) : onToggle(group.key))}
            onDoubleClick={onSolo ? () => onSolo(group.key) : undefined}
            style={eventStyle(group.color)}
            className={cn(
              "inline-flex h-7 max-w-56 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-[background-color,opacity,color]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              hidden
                ? "border-dashed bg-transparent text-muted-foreground opacity-70 hover:opacity-100"
                : "gcal-event border-transparent",
            )}
          >
            {group.actor ? (
              <Avatar className={cn("-ml-1 h-5 w-5", hidden && "grayscale")}>
                {group.actor.avatarUrl ? <AvatarImage src={group.actor.avatarUrl} alt="" /> : null}
                <AvatarFallback className="text-[0.5rem]">{actorInitials(group.actor)}</AvatarFallback>
              </Avatar>
            ) : (
              <span
                aria-hidden
                className={cn("h-2 w-2 shrink-0 rounded-full", hidden ? "border border-current" : "gcal-event-dot")}
              />
            )}
            <span className={cn("truncate", hidden && "line-through decoration-1")}>{group.label}</span>
          </button>
        );
      })}
      {anyHidden && onShowAll ? (
        <button
          type="button"
          onClick={onShowAll}
          className="ml-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Show all
        </button>
      ) : null}
    </div>
  );
}
