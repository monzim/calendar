import type { GridConfig, PositionedOccurrence, TimeZone } from "./types";
import type { PackedOccurrence } from "./lanePack";
import { minutesSinceMidnight } from "./timezone";

/**
 * Turn lane-packed occurrences into pixel-positioned blocks for a time grid.
 * `top`/`height` are relative to the top of the day column (which starts at
 * `grid.dayStartHour`). Generalized from v1's hardcoded `(hour - 8) * 60`.
 */
export function positionOccurrences<TMeta = Record<string, unknown>>(
  packed: PackedOccurrence<TMeta>[],
  grid: GridConfig,
  displayZone?: TimeZone,
): PositionedOccurrence<TMeta>[] {
  const startOffsetMin = grid.dayStartHour * 60;
  const perMin = grid.pxPerHour / 60;

  return packed.map(({ occurrence, lane, laneCount }) => {
    const startMin = minutesSinceMidnight(occurrence.start, displayZone);
    const durationMin = Math.max(
      0,
      (occurrence.end.getTime() - occurrence.start.getTime()) / 60000,
    );
    const top = (startMin - startOffsetMin) * perMin;
    const height = durationMin * perMin;
    return { ...occurrence, top, height, lane, laneCount };
  });
}
