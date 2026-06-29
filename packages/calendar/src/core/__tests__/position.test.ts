import { describe, expect, it } from "vitest";
import { positionOccurrences } from "../position";
import type { CalendarEvent, EventOccurrence, GridConfig } from "../types";
import type { PackedOccurrence } from "../lanePack";

const event: CalendarEvent = { id: "e", title: "E", start: "x", end: "y" };
const grid: GridConfig = { dayStartHour: 8, dayEndHour: 18, pxPerHour: 60 };

function packed(startISO: string, endISO: string): PackedOccurrence {
  const o: EventOccurrence = {
    occurrenceId: startISO,
    event,
    start: new Date(startISO),
    end: new Date(endISO),
    allDay: false,
    isRecurring: false,
  };
  return { occurrence: o, lane: 0, laneCount: 1 };
}

describe("positionOccurrences", () => {
  it("computes top/height from the grid origin", () => {
    const [p] = positionOccurrences(
      [packed("2026-01-01T09:00:00Z", "2026-01-01T10:30:00Z")],
      grid,
      "UTC",
    );
    expect(p!.top).toBe(60); // (9:00 - 8:00) * 60px
    expect(p!.height).toBe(90); // 90 minutes
  });

  it("scales with pxPerHour and dayStartHour", () => {
    const [p] = positionOccurrences(
      [packed("2026-01-01T07:00:00Z", "2026-01-01T08:00:00Z")],
      { dayStartHour: 6, dayEndHour: 20, pxPerHour: 40 },
      "UTC",
    );
    expect(p!.top).toBe(40); // (7 - 6) * 40
    expect(p!.height).toBe(40);
  });
});
