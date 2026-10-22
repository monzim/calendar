import type { CSSProperties } from "react";

/** Inline style that feeds an event's color into the `--gcal-event` tint system. */
export function eventStyle(color?: string): CSSProperties | undefined {
  return color ? ({ "--gcal-event": color } as CSSProperties) : undefined;
}
