import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { useCalendar } from "../useCalendar";
import { useEventFilter } from "../useEventFilter";
import { useICSFeed } from "../useICSFeed";
import { Calendar } from "../../ui";
import type { CalendarEvent } from "../../core/types";

const events: CalendarEvent[] = [
  {
    id: "ml",
    title: "Machine Learning",
    start: "2026-01-05T09:00:00Z",
    end: "2026-01-05T10:00:00Z",
    calendarId: "CSE",
    color: "#f97316",
    meta: { code: "CSE202" },
  },
  {
    id: "circuits",
    title: "Circuits",
    start: "2026-01-06T11:00:00Z",
    end: "2026-01-06T12:00:00Z",
    calendarId: "EEE",
  },
];
const anchor = new Date("2026-01-05T00:00:00Z");

describe("agenda view", () => {
  it("spans agendaDays from the anchor and steps by the same amount", () => {
    const { result } = renderHook(() =>
      useCalendar({ events, defaultDate: anchor, defaultView: "agenda", agendaDays: 10, timeZone: "UTC" }),
    );
    expect(result.current.days).toHaveLength(10);
    const startMs = result.current.visibleRange.start.getTime();
    expect(startMs).toBe(anchor.getTime());
    act(() => result.current.goNext());
    expect(result.current.visibleRange.start.getTime()).toBe(startMs + 10 * 86_400_000);
  });

  it("renders events grouped by day, and an empty state when there are none", () => {
    const html = renderToStaticMarkup(
      <Calendar events={events} timeZone="UTC" defaultView="agenda" defaultDate={anchor} />,
    );
    expect(html).toContain("gcal-agenda-day");
    expect(html).toContain("Machine Learning");
    expect(html).toContain("Circuits");

    const empty = renderToStaticMarkup(
      <Calendar events={[]} timeZone="UTC" defaultView="agenda" defaultDate={anchor} />,
    );
    expect(empty).toContain("Nothing scheduled");
  });
});

describe("useEventFilter", () => {
  it("toggles, solos and shows all", () => {
    const { result } = renderHook(() => useEventFilter(events, { by: "calendar" }));
    expect(result.current.groups.map((g) => g.key)).toEqual(["CSE", "EEE"]);

    act(() => result.current.toggle("CSE"));
    expect(result.current.events.map((e) => e.id)).toEqual(["circuits"]);

    act(() => result.current.solo("CSE"));
    expect(result.current.hidden).toEqual(["EEE"]);
    // Solo on the already-solo group restores everything.
    act(() => result.current.solo("CSE"));
    expect(result.current.hidden).toEqual([]);

    act(() => result.current.toggle("EEE"));
    act(() => result.current.showAll());
    expect(result.current.events).toBe(events);
  });

  it("supports controlled hidden state", () => {
    const onHiddenChange = vi.fn();
    const { result } = renderHook(() => useEventFilter(events, { hidden: ["EEE"], onHiddenChange }));
    expect(result.current.events.map((e) => e.id)).toEqual(["ml"]);
    act(() => result.current.toggle("CSE"));
    expect(onHiddenChange).toHaveBeenCalledWith(["EEE", "CSE"]);
    // Controlled: state only changes when the parent passes new props.
    expect(result.current.hidden).toEqual(["EEE"]);
  });
});

describe("useICSFeed", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    "UID:x",
    "DTSTART:20260105T090000Z",
    "DTEND:20260105T100000Z",
    "SUMMARY:From feed",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  it("loads feeds, reports per-feed errors, and keeps successful events", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("good") ? new Response(ics) : new Response("", { status: 500, statusText: "Boom" }),
    );
    const { result } = renderHook(() =>
      useICSFeed(["https://a.test/good.ics", { url: "https://a.test/bad.ics" }], {
        fetch: fetchMock as unknown as typeof fetch,
      }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events.map((e) => e.title)).toEqual(["From feed"]);
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0]!.url).toBe("https://a.test/bad.ics");
  });

  it("does not refetch on re-render with an equal inline feed list", async () => {
    const fetchMock = vi.fn(async () => new Response(ics));
    const { result, rerender } = renderHook(() =>
      useICSFeed(["https://a.test/good.ics"], { fetch: fetchMock as unknown as typeof fetch }),
    );
    await waitFor(() => expect(result.current.events).toHaveLength(1));
    rerender();
    rerender();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    act(() => result.current.refresh());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});

describe("Calendar slots and legend", () => {
  it("renders a legend and custom event content", () => {
    const html = renderToStaticMarkup(
      <Calendar
        events={events}
        timeZone="UTC"
        defaultDate={anchor}
        legend
        defaultHiddenGroups={["EEE"]}
        headerActions={<span>custom-action</span>}
        renderEventContent={(occ) => <span>custom:{(occ.event.meta as { code?: string })?.code ?? "none"}</span>}
      />,
    );
    expect(html).toContain('aria-label="Filter events"');
    expect(html).toContain("custom:CSE202");
    // Hidden group's event is filtered out of the grid.
    expect(html).not.toContain("custom:none");
    expect(html).toContain("custom-action");
    expect(html).toContain('aria-label="Print"');
  });
});

describe("Ask AI", () => {
  it("is off by default and renders a header menu when enabled", () => {
    const off = renderToStaticMarkup(<Calendar events={events} timeZone="UTC" defaultDate={anchor} />);
    expect(off).not.toContain("Ask AI");
    const on = renderToStaticMarkup(<Calendar events={events} timeZone="UTC" defaultDate={anchor} ai />);
    expect(on).toContain("Ask AI");
  });
});
