import { describe, expect, it } from "vitest";
import { lanePack } from "../lanePack";
import type { CalendarEvent, EventOccurrence } from "../types";

const event: CalendarEvent = { id: "e", title: "E", start: "x", end: "y" };

/** Build an occurrence spanning [startHour, endHour) on a fixed UTC day. */
function occ(startHour: number, endHour: number): EventOccurrence {
  const start = new Date(Date.UTC(2026, 0, 1, startHour));
  const end = new Date(Date.UTC(2026, 0, 1, endHour));
  return { occurrenceId: `${startHour}-${endHour}`, event, start, end, allDay: false, isRecurring: false };
}

describe("lanePack", () => {
  it("gives disjoint events a single lane", () => {
    const packed = lanePack([occ(9, 10), occ(11, 12)]);
    expect(packed.every((p) => p.laneCount === 1 && p.lane === 0)).toBe(true);
  });

  it("splits two overlapping events into two lanes", () => {
    const packed = lanePack([occ(9, 11), occ(10, 12)]);
    expect(packed.map((p) => p.lane).sort()).toEqual([0, 1]);
    expect(packed.every((p) => p.laneCount === 2)).toBe(true);
  });

  it("packs a 3-deep overlap cluster into three lanes", () => {
    const packed = lanePack([occ(0, 3), occ(1, 4), occ(2, 5)]);
    expect(packed.every((p) => p.laneCount === 3)).toBe(true);
    expect(packed.map((p) => p.lane).sort()).toEqual([0, 1, 2]);
  });

  it("treats back-to-back events as non-overlapping", () => {
    const packed = lanePack([occ(9, 10), occ(10, 11)]);
    expect(packed.every((p) => p.laneCount === 1)).toBe(true);
  });
});
