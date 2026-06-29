import { describe, expect, it } from "vitest";
import { fromRoutine } from "../fromRoutine";
import { expandRecurrence } from "../recurrence";
import type { RecurrenceRule, RoutineInput } from "../types";

describe("fromRoutine", () => {
  it("splits differing time windows into separate weekly events", () => {
    const routines: RoutineInput<{ courseCode: string; roomId: string }>[] = [
      {
        id: "ml",
        title: "Machine Learning",
        schedule: {
          Thursday: { start: "12:00", end: "15:00" },
          Sunday: { start: "15:30", end: "17:30" },
        },
        actors: [{ id: "f", name: "Dr. Emily Johnson" }],
        location: "Room 102",
        meta: { courseCode: "CSE202", roomId: "102" },
      },
    ];

    const events = fromRoutine(routines, { baseDate: "2026-01-01T00:00:00Z", timeZone: "UTC" });
    expect(events).toHaveLength(2);

    const thursday = events.find((e) => (e.recurrence as RecurrenceRule).byWeekday?.includes("TH"))!;
    expect(thursday).toBeDefined();
    expect((thursday.recurrence as RecurrenceRule).freq).toBe("weekly");
    expect(thursday.title).toBe("Machine Learning");
    expect(thursday.location).toBe("Room 102");
    expect(thursday.actors?.[0]?.name).toBe("Dr. Emily Johnson");
    expect(thursday.meta?.courseCode).toBe("CSE202");
    expect(thursday.timezone).toBe("UTC");
  });

  it("collapses same-time days into one BYDAY rule", () => {
    const events = fromRoutine(
      [
        {
          title: "Algorithms",
          schedule: {
            Monday: { start: "09:00", end: "10:30" },
            Wednesday: { start: "09:00", end: "10:30" },
          },
        },
      ],
      { baseDate: "2026-01-01T00:00:00Z", timeZone: "UTC" },
    );
    expect(events).toHaveLength(1);
    expect((events[0]!.recurrence as RecurrenceRule).byWeekday).toEqual(["MO", "WE"]);
  });

  it("honours validUntil as the recurrence bound", () => {
    const events = fromRoutine(
      [
        {
          title: "Seminar",
          schedule: { Friday: { start: "10:00", end: "11:00" } },
          validFrom: "2026-01-01T00:00:00Z",
          validUntil: "2026-01-31T00:00:00Z",
        },
      ],
      { timeZone: "UTC" },
    );
    const occ = expandRecurrence(events[0]!, {
      start: new Date("2026-01-01T00:00:00Z"),
      end: new Date("2026-12-31T00:00:00Z"),
    });
    // Fridays in Jan 2026: 2, 9, 16, 23, 30
    expect(occ).toHaveLength(5);
  });
});
