import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { useCalendar } from "../useCalendar";
import { useNow } from "../useNow";
import type { CalendarEvent } from "../../core/types";

const events: CalendarEvent[] = [];
const anchor = new Date("2026-01-07T00:00:00Z"); // Wednesday

describe("useCalendar navigation", () => {
  it("defaults to a week view spanning 7 days", () => {
    const { result } = renderHook(() =>
      useCalendar({ events, defaultDate: anchor, weekStartsOn: 0, timeZone: "UTC" }),
    );
    expect(result.current.view).toBe("week");
    expect(result.current.days).toHaveLength(7);
  });

  it("advances and rewinds by a week", () => {
    const { result } = renderHook(() =>
      useCalendar({ events, defaultDate: anchor, weekStartsOn: 0, timeZone: "UTC" }),
    );
    const startMs = result.current.visibleRange.start.getTime();
    act(() => result.current.goNext());
    expect(result.current.visibleRange.start.getTime()).toBe(startMs + 7 * 86_400_000);
    act(() => result.current.goPrev());
    expect(result.current.visibleRange.start.getTime()).toBe(startMs);
  });

  it("switches to a month grid of full weeks", () => {
    const { result } = renderHook(() =>
      useCalendar({ events, defaultDate: anchor, weekStartsOn: 0, timeZone: "UTC" }),
    );
    act(() => result.current.setView("month"));
    expect(result.current.days.length % 7).toBe(0);
    expect(result.current.days.length).toBeGreaterThanOrEqual(28);
  });

  it("restricts rendered days to visibleDays (work-week)", () => {
    const { result } = renderHook(() =>
      useCalendar({
        events,
        defaultDate: anchor,
        weekStartsOn: 0,
        visibleDays: [1, 2, 3, 4, 5],
        timeZone: "UTC",
      }),
    );
    expect(result.current.days).toHaveLength(5);
  });
});

describe("useNow SSR safety", () => {
  it("renders nothing time-dependent on the server", () => {
    function Probe() {
      const now = useNow();
      return now ? <div data-now="1" /> : null;
    }
    const html = renderToStaticMarkup(<Probe />);
    expect(html).toBe("");
  });
});
