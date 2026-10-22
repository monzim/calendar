import { describe, expect, it } from "vitest";
import { AI_PROVIDERS, buildAIPrompt, daysToAIPrompt, eventToAIPrompt, scheduleToMarkdown } from "../ai";
import { buildView } from "../pipeline";
import { toInstant } from "../timezone";
import type { CalendarEvent } from "../types";

const zone = "Asia/Dhaka";
const events: CalendarEvent[] = [
  {
    id: "secret-id-123",
    title: "Machine Learning",
    start: "2026-01-04T15:30:00",
    end: "2026-01-04T17:30:00",
    timezone: zone,
    location: "Room 102",
    description: "Bring\nlaptops",
    url: "https://internal.example.com/course",
    recurrence: { freq: "weekly", byWeekday: ["SU"] },
    actors: [{ name: "Dr. Emily Johnson", role: "instructor", email: "emily@uni.edu", avatarUrl: "https://x/y.png" }],
  },
  { id: "e2", title: "Midterms", start: "2026-01-06", end: "2026-01-07", allDay: true, calendarId: "Academic" },
];
const range = { start: toInstant("2026-01-04T00:00:00", zone), end: toInstant("2026-01-07T00:00:00", zone) };

describe("scheduleToMarkdown", () => {
  const md = scheduleToMarkdown(events, { range, timeZone: zone, now: toInstant("2026-01-04T10:00:00", zone) });

  it("renders a day-by-day schedule with times, places, people and repeats", () => {
    expect(md).toContain("# Schedule: Jan 4 – Jan 6, 2026");
    expect(md).toContain("Times are in Asia/Dhaka.");
    expect(md).toContain("## Sunday, Jan 4 (today)");
    expect(md).toContain(
      "- 3:30 PM – 5:30 PM · **Machine Learning** · Room 102 · Dr. Emily Johnson (instructor) · repeats weekly",
    );
    expect(md).toContain("  - Bring laptops");
    expect(md).toContain("## Monday, Jan 5\n- No events");
    expect(md).toContain("- All day · **Midterms** · calendar: Academic");
  });

  it("never includes ids, URLs, emails or avatar links", () => {
    expect(md).not.toMatch(/secret-id|internal\.example|emily@|https?:\/\//);
  });

  it("can drop descriptions, people and empty days", () => {
    const lean = scheduleToMarkdown(events, {
      range,
      timeZone: zone,
      includeDescriptions: false,
      includePeople: false,
      includeEmptyDays: false,
    });
    expect(lean).not.toContain("laptops");
    expect(lean).not.toContain("Johnson");
    expect(lean).not.toContain("Monday");
  });
});

describe("prompt + providers", () => {
  it("wraps markdown with instructions and an optional question", () => {
    const prompt = buildAIPrompt("# S", { instructions: "Hi.", question: "Free on Monday?" });
    expect(prompt).toBe("Hi.\n\n# S\n\nFree on Monday?");
  });

  it("builds prefilled chat URLs", () => {
    expect(AI_PROVIDERS.chatgpt.url("a b&c")).toBe("https://chatgpt.com/?q=a%20b%26c");
    expect(AI_PROVIDERS.claude.url("a b")).toBe("https://claude.ai/new?q=a%20b");
  });
});

describe("fitting prompts into a chat URL", () => {
  const monthRange = { start: toInstant("2026-01-01T00:00:00", zone), end: toInstant("2026-02-01T00:00:00", zone) };
  const daily: CalendarEvent[] = [
    {
      id: "standup",
      title: "Team standup with a fairly long descriptive title",
      start: "2026-01-01T09:00:00",
      end: "2026-01-01T09:30:00",
      timezone: zone,
      location: "Room 101",
      description: "x".repeat(200),
      recurrence: { freq: "daily" },
      actors: [{ name: "Dr. Alex Smith", role: "host" }],
    },
  ];
  const { days } = buildView(daily, {
    range: monthRange,
    grid: { dayStartHour: 0, dayEndHour: 24, pxPerHour: 60 },
    timeZone: zone,
  });
  const urlFits = (limit: number) => (p: string) => AI_PROVIDERS.chatgpt.url(p).length <= limit;

  it("returns the full prompt when it already fits", () => {
    const prompt = daysToAIPrompt(days, { timeZone: zone, fits: () => true });
    expect(prompt).toContain("x".repeat(200));
    expect(prompt).toContain("Saturday, Jan 31");
  });

  it("drops descriptions before anything else", () => {
    const full = daysToAIPrompt(days, { timeZone: zone });
    const noDesc = daysToAIPrompt(days, { timeZone: zone, includeDescriptions: false });
    const limit = AI_PROVIDERS.chatgpt.url(noDesc).length;
    expect(AI_PROVIDERS.chatgpt.url(full).length).toBeGreaterThan(limit);
    const fitted = daysToAIPrompt(days, { timeZone: zone, fits: urlFits(limit) });
    expect(fitted).toBe(noDesc);
  });

  it("keeps the earliest days with a note when the whole range can't fit", () => {
    const fitted = daysToAIPrompt(days, { timeZone: zone, fits: urlFits(2500) });
    expect(AI_PROVIDERS.chatgpt.url(fitted).length).toBeLessThanOrEqual(2500);
    expect(fitted).toContain("## Thursday, Jan 1");
    expect(fitted).not.toContain("Jan 31");
    expect(fitted).toMatch(/Only days through .+ are listed; later days were left out to fit\./);
  });

  it("always fits, even under an absurd limit", () => {
    const fitted = daysToAIPrompt(days, { timeZone: zone, fits: urlFits(400) });
    expect(AI_PROVIDERS.chatgpt.url(fitted).length).toBeLessThanOrEqual(400);
    expect(fitted).toContain("(truncated to fit)");
    const event = eventToAIPrompt(days[0]!.occurrences[0]!, { timeZone: zone, fits: urlFits(300) });
    expect(AI_PROVIDERS.chatgpt.url(event).length).toBeLessThanOrEqual(300);
  });
});
