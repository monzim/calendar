"use client";

import { minutesSinceMidnight } from "../../core/timezone";
import type { GridConfig, TimeZone } from "../../core/types";

export interface NowIndicatorProps {
  now: Date | null;
  grid: GridConfig;
  timeZone?: TimeZone;
}

/**
 * Horizontal "current time" line. Renders nothing on the server / first client
 * render (`now === null`) or when the time falls outside the visible window.
 */
export function NowIndicator({ now, grid, timeZone }: NowIndicatorProps) {
  if (!now) return null;
  const minutes = minutesSinceMidnight(now, timeZone);
  const windowStart = grid.dayStartHour * 60;
  const windowEnd = grid.dayEndHour * 60;
  if (minutes < windowStart || minutes > windowEnd) return null;

  const top = ((minutes - windowStart) / 60) * grid.pxPerHour;

  return (
    <div
      className="gcal-now-indicator pointer-events-none absolute inset-x-0 z-20 flex items-center"
      style={{ top }}
    >
      <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-destructive shadow-sm" />
      <span className="h-px w-full bg-destructive/80" />
    </div>
  );
}
