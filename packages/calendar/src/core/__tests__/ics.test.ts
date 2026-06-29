import { describe, expect, it } from "vitest";
import { parseICS, toICS } from "../ics";
import { toInstant } from "../timezone";
import type { CalendarEvent } from "../types";

function normalize(e: CalendarEvent) {
  return {
    title: e.title,
    startMs: toInstant(e.start, e.timezone).getTime(),
    endMs: toInstant(e.end, e.timezone).getTime(),
    allDay: e.allDay ?? false,
    recurrence: e.recurrence ?? null,
    location: e.location ?? null,
    exceptions: (e.exceptions ?? []).map((x) => toInstant(x, e.timezone).getTime()).sort(),
  };
}

describe("ICS round-trip", () => {
  it("round-trips timed, recurring (RRULE+EXDATE), and all-day events", () => {
    const events: CalendarEvent[] = [
      {
        id: "evt_1",
        title: "Thesis, Defense; final",
        start: "2026-07-02T14:00:00Z",
        end: "2026-07-02T15:30:00Z",
        location: "Room 612",
        description: "Bring slides",
      },
      {
        id: "evt_2",
        title: "Machine Learning",
        start: "2026-01-05T09:00:00Z",
        end: "2026-01-05T10:30:00Z",
        recurrence: { freq: "weekly", byWeekday: ["MO", "WE"] },
        exceptions: ["2026-01-12T09:00:00Z"],
      },
      {
        id: "evt_3",
        title: "Conference",
        start: "2026-08-01",
        end: "2026-08-04",
        allDay: true,
      },
    ];

    const back = parseICS(toICS(events));
    expect(back).toHaveLength(3);
    expect(back.map(normalize)).toEqual(events.map(normalize));
  });

  it("produces CRLF-terminated VCALENDAR boundaries", () => {
    const ics = toICS([{ id: "a", title: "A", start: "2026-01-01T00:00:00Z", end: "2026-01-01T01:00:00Z" }]);
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("BEGIN:VEVENT");
  });
});
