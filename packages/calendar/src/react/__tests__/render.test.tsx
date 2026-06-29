import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Calendar } from "../../ui";
import { fromRoutine } from "../../core/fromRoutine";
import type { CalendarEvent, CalendarViewType } from "../../core/types";

const events: CalendarEvent[] = [
  ...fromRoutine(
    [
      {
        id: "ml",
        title: "Machine Learning",
        schedule: { Monday: { start: "09:30", end: "12:00" }, Wednesday: { start: "10:30", end: "12:30" } },
        location: "Room 102",
        actors: [{ name: "Dr. Emily Johnson" }],
      },
    ],
    { timeZone: "UTC", baseDate: "2026-01-04T00:00:00Z" },
  ),
  {
    id: "one",
    title: "Thesis Defense",
    start: "2026-01-05T14:00:00Z",
    end: "2026-01-05T15:30:00Z",
    timezone: "UTC",
    location: "Room 612",
  },
];

describe("Calendar renders (SSR-safe)", () => {
  const views: CalendarViewType[] = ["week", "day", "today", "month"];
  for (const view of views) {
    it(`renders the ${view} view with events and no now-line on first paint`, () => {
      const html = renderToStaticMarkup(
        <Calendar
          events={events}
          timeZone="UTC"
          defaultView={view}
          defaultDate={new Date("2026-01-05T00:00:00Z")}
        />,
      );
      expect(html).toContain("gcal-root");
      expect(html).toContain("Machine Learning");
      // useNow is null on the server → no now-indicator markup yet (hydration-safe).
      expect(html).not.toContain("gcal-now-indicator");
    });
  }
});
