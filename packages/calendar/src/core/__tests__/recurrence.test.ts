import { describe, expect, it } from "vitest";
import { expandRecurrence } from "../recurrence";
import type { CalendarEvent, DateRange } from "../types";

const range = (a: string, b: string): DateRange => ({ start: new Date(a), end: new Date(b) });

function ev(partial: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: "e",
    title: "Event",
    start: "2026-01-05T09:00:00",
    end: "2026-01-05T10:00:00",
    timezone: "UTC",
    ...partial,
  };
}

describe("expandRecurrence", () => {
  it("weekly byWeekday enumerates each chosen day", () => {
    const occ = expandRecurrence(
      ev({ recurrence: { freq: "weekly", byWeekday: ["MO", "WE"] } }),
      range("2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z"),
    );
    // Mondays 5,12,19,26 + Wednesdays 7,14,21,28 = 8
    expect(occ).toHaveLength(8);
    expect(occ[0]!.start.toISOString()).toBe("2026-01-05T09:00:00.000Z");
    expect(occ[0]!.isRecurring).toBe(true);
    expect(occ[0]!.end.toISOString()).toBe("2026-01-05T10:00:00.000Z");
  });

  it("daily with interval skips periods", () => {
    const occ = expandRecurrence(
      ev({ start: "2026-01-01T00:00:00", end: "2026-01-01T01:00:00", recurrence: { freq: "daily", interval: 2 } }),
      range("2026-01-01T00:00:00Z", "2026-01-10T00:00:00Z"),
    );
    // Jan 1,3,5,7,9
    expect(occ).toHaveLength(5);
  });

  it("count caps occurrences", () => {
    const occ = expandRecurrence(
      ev({ start: "2026-01-01T00:00:00", end: "2026-01-01T01:00:00", recurrence: { freq: "daily", count: 3 } }),
      range("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z"),
    );
    expect(occ).toHaveLength(3);
  });

  it("until bounds occurrences (inclusive)", () => {
    const occ = expandRecurrence(
      ev({ start: "2026-01-01T00:00:00", end: "2026-01-01T01:00:00", recurrence: { freq: "daily", until: "2026-01-03T00:00:00" } }),
      range("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z"),
    );
    expect(occ).toHaveLength(3); // Jan 1,2,3
  });

  it("removes EXDATE exceptions", () => {
    const occ = expandRecurrence(
      ev({
        start: "2026-01-01T00:00:00",
        end: "2026-01-01T01:00:00",
        recurrence: { freq: "daily", count: 5 },
        exceptions: ["2026-01-03T00:00:00"],
      }),
      range("2026-01-01T00:00:00Z", "2026-12-31T00:00:00Z"),
    );
    expect(occ).toHaveLength(4);
    expect(occ.map((o) => o.start.toISOString())).not.toContain("2026-01-03T00:00:00.000Z");
  });

  it("accepts a raw RRULE string", () => {
    const occ = expandRecurrence(
      ev({ start: "2026-01-02T09:00:00", end: "2026-01-02T10:00:00", recurrence: "RRULE:FREQ=WEEKLY;BYDAY=FR;COUNT=2" }),
      range("2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z"),
    );
    expect(occ).toHaveLength(2); // Fri Jan 2, Jan 9
    expect(occ[1]!.start.toISOString()).toBe("2026-01-09T09:00:00.000Z");
  });

  it("passes through a one-off that intersects the range", () => {
    const occ = expandRecurrence(
      ev({}),
      range("2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z"),
    );
    expect(occ).toHaveLength(1);
    expect(occ[0]!.isRecurring).toBe(false);
  });

  it("drops a one-off outside the range", () => {
    const occ = expandRecurrence(
      ev({}),
      range("2026-03-01T00:00:00Z", "2026-04-01T00:00:00Z"),
    );
    expect(occ).toHaveLength(0);
  });
});
