import { describe, expect, it } from "vitest";
import { toGoogleCalendarUrl, toOutlookUrl } from "../urls";
import type { CalendarEvent } from "../types";

const oneOff: CalendarEvent = {
  id: "g",
  title: "Thesis Defense",
  start: "2026-07-02T14:00:00Z",
  end: "2026-07-02T15:30:00Z",
  location: "Room 612",
};

const routine: CalendarEvent = {
  id: "r",
  title: "ML",
  start: "2026-01-05T09:00:00Z",
  end: "2026-01-05T10:30:00Z",
  recurrence: { freq: "weekly", byWeekday: ["MO", "WE"] },
};

describe("calendar URLs", () => {
  it("builds a Google Calendar template URL", () => {
    const url = toGoogleCalendarUrl(oneOff);
    expect(url).toContain("calendar.google.com/calendar/render");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("dates=20260702T140000Z%2F20260702T153000Z");
    expect(url).toContain("location=Room+612");
  });

  it("includes recurrence in the Google URL for routines", () => {
    const url = toGoogleCalendarUrl(routine);
    expect(url).toContain("recur=");
    expect(decodeURIComponent(url)).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE");
  });

  it("builds an Outlook compose URL", () => {
    const url = toOutlookUrl(oneOff);
    expect(url).toContain("outlook.live.com/calendar/0/deeplink/compose");
    expect(url).toContain("startdt=2026-07-02T14%3A00%3A00.000Z");
  });
});
