import type { ReactNode } from "react";
import type { EventOccurrence, TimeZone } from "../../core/types";

/** Where an event is being rendered, so a custom renderer can adapt its density. */
export interface EventRenderContext {
  /** `grid` = timed block in day/week, `allDay` = all-day row, `month` = month chip, `agenda` = list row. */
  surface: "grid" | "allDay" | "month" | "agenda";
  /** Pixel height of the block (grid surface only). */
  height?: number;
  timeZone?: TimeZone;
}

/**
 * Replaces the inside of an event block/chip/row. The library keeps the
 * wrapper (positioning, color tint, click handling), so return content only.
 */
export type EventContentRenderer<TMeta = Record<string, unknown>> = (
  occurrence: EventOccurrence<TMeta>,
  context: EventRenderContext,
) => ReactNode;
