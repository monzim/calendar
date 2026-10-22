import { describe, expect, it } from "vitest";
import { filterEvents, groupEvents } from "../filter";
import type { CalendarEvent } from "../types";

const base = { start: "2026-01-05T09:00:00Z", end: "2026-01-05T10:00:00Z" };
const events: CalendarEvent[] = [
  { ...base, id: "a", title: "A", calendarId: "CSE", color: "#f00", actors: [{ id: "smith", name: "Smith" }] },
  { ...base, id: "b", title: "B", calendarId: "CSE", actors: [{ id: "lee", name: "Lee", color: "#00f" }] },
  { ...base, id: "c", title: "C", calendarId: "EEE", actors: [{ id: "smith" }, { id: "lee" }] },
  { ...base, id: "d", title: "D" },
];

describe("groupEvents", () => {
  it("groups by calendar in first-seen order with counts and colors", () => {
    expect(groupEvents(events, "calendar")).toEqual([
      { key: "CSE", label: "CSE", color: "#f00", count: 2 },
      { key: "EEE", label: "EEE", color: undefined, count: 1 },
    ]);
  });

  it("groups by actor, preferring the actor's own color", () => {
    const groups = groupEvents(events, "actor");
    expect(groups.map((g) => [g.key, g.label, g.color, g.count])).toEqual([
      ["smith", "Smith", "#f00", 2],
      ["lee", "Lee", "#00f", 2],
    ]);
  });

  it("accepts a custom key function", () => {
    const groups = groupEvents(events, (e) => (e.title === "D" ? null : e.title.toLowerCase()));
    expect(groups.map((g) => g.key)).toEqual(["a", "b", "c"]);
  });
});

describe("filterEvents", () => {
  it("returns the same array when nothing is hidden", () => {
    expect(filterEvents(events, [], "calendar")).toBe(events);
  });

  it("hides events whose groups are all hidden, keeping ungrouped events", () => {
    expect(filterEvents(events, ["CSE"], "calendar").map((e) => e.id)).toEqual(["c", "d"]);
  });

  it("keeps a multi-actor event while any of its actors is visible", () => {
    expect(filterEvents(events, ["smith"], "actor").map((e) => e.id)).toEqual(["b", "c", "d"]);
    expect(filterEvents(events, ["smith", "lee"], "actor").map((e) => e.id)).toEqual(["d"]);
  });
});
