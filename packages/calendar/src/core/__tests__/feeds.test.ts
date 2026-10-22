import { describe, expect, it, vi } from "vitest";
import { fetchICS, normalizeFeedUrl } from "../feeds";
import { parseICS } from "../ics";

const FEED = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "UID:weekly",
  'DTSTART;TZID="Asia/Dhaka":20260105T090000',
  "DTEND;TZID=Asia/Dhaka:20260105T100000",
  "RRULE:FREQ=WEEKLY;BYDAY=MO",
  "SUMMARY:Standup",
  "DESCRIPTION:Daily sync",
  "BEGIN:VALARM",
  "ACTION:DISPLAY",
  "DESCRIPTION:Reminder",
  "END:VALARM",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:weekly",
  "RECURRENCE-ID;TZID=Asia/Dhaka:20260112T090000",
  "DTSTART;TZID=Asia/Dhaka:20260112T110000",
  "DTEND;TZID=Asia/Dhaka:20260112T120000",
  "SUMMARY:Standup (moved)",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:holiday",
  "DTSTART;VALUE=DATE:20260126",
  "SUMMARY:Holiday",
  "COLOR:crimson",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:outlook",
  "DTSTART;TZID=Pacific Standard Time:20260105T090000",
  "DTEND;TZID=Pacific Standard Time:20260105T100000",
  "SUMMARY:Windows zone",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

describe("parseICS on real-world feeds", () => {
  const events = parseICS(FEED);

  it("ignores properties inside nested components (VALARM)", () => {
    expect(events[0]!.description).toBe("Daily sync");
  });

  it("turns RECURRENCE-ID overrides into exceptions + a standalone event", () => {
    expect(events[0]!.exceptions?.map((x) => new Date(x).getTime())).toEqual([Date.parse("2026-01-12T03:00:00Z")]);
    expect(events[1]!.id).toBe("weekly__20260112T090000");
    expect(events[1]!.recurrence).toBeUndefined();
  });

  it("defaults a missing DTEND to one day for all-day events and reads COLOR", () => {
    expect(events[2]).toMatchObject({ allDay: true, start: "2026-01-26", end: "2026-01-27", color: "crimson" });
  });

  it("keeps unknown TZIDs as floating times instead of throwing", () => {
    expect(events[3]!.start).toBe("2026-01-05T09:00:00");
  });
});

describe("fetchICS", () => {
  it("normalizes webcal URLs", () => {
    expect(normalizeFeedUrl("webcal://example.com/a.ics")).toBe("https://example.com/a.ics");
  });

  it("fetches, parses, namespaces ids and stamps feed calendarId/color", async () => {
    const fetchMock = vi.fn(async () => new Response(FEED, { status: 200 }));
    const events = await fetchICS(
      { url: "webcal://example.com/team.ics", calendarId: "Team", color: "#123456" },
      { fetch: fetchMock as unknown as typeof fetch },
    );
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/team.ics", expect.anything());
    expect(events[0]).toMatchObject({ calendarId: "Team", color: "#123456" });
    expect(events[0]!.id).toMatch(/^feed-[0-9a-z]+#weekly$/);
    // An event's own COLOR wins over the feed color.
    expect(events[2]!.color).toBe("crimson");
  });

  it("never leaks the (possibly secret) feed URL into ids or errors", async () => {
    const secret = "https://calendar.example.com/ical/me/private-s3cr3t/basic.ics?token=abc";
    const ok = vi.fn(async () => new Response(FEED));
    const events = await fetchICS(secret, { fetch: ok as unknown as typeof fetch });
    for (const e of events) expect(e.id).not.toMatch(/s3cr3t|token|example/);

    const fail = vi.fn(async () => new Response("", { status: 403, statusText: "Forbidden" }));
    const err = await fetchICS(secret, { fetch: fail as unknown as typeof fetch }).catch((e: Error) => e);
    expect(String(err)).toContain("https://calendar.example.com");
    expect(String(err)).not.toMatch(/s3cr3t|token/);
  });

  it("throws on HTTP errors", async () => {
    const fetchMock = vi.fn(async () => new Response("nope", { status: 404, statusText: "Not Found" }));
    await expect(fetchICS("https://x.test/a.ics", { fetch: fetchMock as unknown as typeof fetch })).rejects.toThrow(
      /404/,
    );
  });
});
