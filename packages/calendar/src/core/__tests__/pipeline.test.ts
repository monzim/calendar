import { describe, expect, it } from "vitest";
import { buildView } from "../pipeline";
import type { CalendarEvent, GridConfig } from "../types";

const grid: GridConfig = { dayStartHour: 8, dayEndHour: 18, pxPerHour: 60 };

describe("buildView", () => {
  it("buckets recurring occurrences onto the correct weekdays", () => {
    const events: CalendarEvent[] = [
      {
        id: "ml",
        title: "ML",
        start: "2026-01-05T09:00:00", // Monday
        end: "2026-01-05T10:00:00",
        timezone: "UTC",
        recurrence: { freq: "weekly", byWeekday: ["MO", "WE"] },
      },
    ];

    const { days } = buildView(events, {
      range: { start: new Date("2026-01-05T00:00:00Z"), end: new Date("2026-01-12T00:00:00Z") },
      grid,
      timeZone: "UTC",
    });

    expect(days).toHaveLength(7);
    expect(days[0]!.occurrences).toHaveLength(1); // Mon Jan 5
    expect(days[0]!.occurrences[0]!.top).toBe(60);
    expect(days[2]!.occurrences).toHaveLength(1); // Wed Jan 7
    expect(days[1]!.occurrences).toHaveLength(0); // Tue Jan 6
    expect(days[4]!.occurrences).toHaveLength(0); // Fri Jan 9
  });

  it("separates all-day occurrences from timed ones", () => {
    const events: CalendarEvent[] = [
      { id: "c", title: "Conf", start: "2026-01-06", end: "2026-01-08", allDay: true },
    ];
    const { days } = buildView(events, {
      range: { start: new Date("2026-01-05T00:00:00Z"), end: new Date("2026-01-12T00:00:00Z") },
      grid,
      timeZone: "UTC",
    });
    expect(days[1]!.allDay).toHaveLength(1); // Jan 6
    expect(days[2]!.allDay).toHaveLength(1); // Jan 7
    expect(days[3]!.allDay).toHaveLength(0); // Jan 8 (end exclusive)
    expect(days[1]!.occurrences).toHaveLength(0);
  });
});
