import { format, isSameDay } from "date-fns";
import { buildView } from "./pipeline";
import { toDisplay } from "./timezone";
import type {
  CalendarEvent,
  DateRange,
  DayBucket,
  EventOccurrence,
  GridConfig,
  TimeZone,
} from "./types";

/**
 * Plain-Markdown export of a schedule, shaped for pasting into an AI chat
 * (ChatGPT, Claude…). Deliberately leaves out ids, URLs, emails and avatar
 * links: only what a person would read on the calendar goes to a third party.
 */
export interface MarkdownOptions {
  /** Display zone for times and day boundaries. Named in the output. */
  timeZone?: TimeZone;
  /** Heading for the document. Default "Schedule". */
  title?: string;
  /** Marks today's section. */
  now?: Date | null;
  /** Include event descriptions. Default true. */
  includeDescriptions?: boolean;
  /** Include people (name + role, never email). Default true. */
  includePeople?: boolean;
  /** List days without events as "No events" so free days are explicit. Default true. */
  includeEmptyDays?: boolean;
}

function time(date: Date, tz?: TimeZone): string {
  return format(toDisplay(date, tz), "h:mm a");
}

const UNIT = { daily: "day", weekly: "week", monthly: "month", yearly: "year" } as const;

function repeatLabel(occurrence: EventOccurrence): string | null {
  if (!occurrence.isRecurring) return null;
  const rule = occurrence.event.recurrence;
  if (rule && typeof rule === "object" && "freq" in rule) {
    return rule.interval && rule.interval > 1
      ? `repeats every ${rule.interval} ${UNIT[rule.freq]}s`
      : `repeats ${rule.freq}`;
  }
  return "repeats";
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** One Markdown bullet for an occurrence: "- 9:30 AM – 12:00 PM · **Title** · Room 101 · …". */
export function occurrenceToMarkdown(
  occurrence: EventOccurrence<any>,
  options: Pick<MarkdownOptions, "timeZone" | "includeDescriptions" | "includePeople"> = {},
): string {
  const { timeZone, includeDescriptions = true, includePeople = true } = options;
  const { event } = occurrence;
  const parts = [
    occurrence.allDay ? "All day" : `${time(occurrence.start, timeZone)} – ${time(occurrence.end, timeZone)}`,
    `**${oneLine(event.title)}**`,
  ];
  if (event.location) parts.push(oneLine(event.location));
  if (includePeople && event.actors?.length) {
    const people = event.actors
      .filter((a) => a.name)
      .map((a) => (a.role ? `${a.name} (${a.role})` : a.name!));
    if (people.length) parts.push(people.join(", "));
  }
  if (event.calendarId) parts.push(`calendar: ${event.calendarId}`);
  const repeat = repeatLabel(occurrence);
  if (repeat) parts.push(repeat);

  let line = `- ${parts.join(" · ")}`;
  if (includeDescriptions && event.description) line += `\n  - ${oneLine(event.description)}`;
  return line;
}

/** A standalone Markdown document for one occurrence (heading, date, details). */
export function eventToMarkdown(occurrence: EventOccurrence<any>, options: MarkdownOptions = {}): string {
  const { timeZone } = options;
  return [
    `# Event: ${oneLine(occurrence.event.title)}`,
    "",
    `${format(toDisplay(occurrence.start, timeZone), "EEEE, MMMM d, yyyy")} · times in ${timeZone ?? "local time"}`,
    "",
    occurrenceToMarkdown(occurrence, options),
  ].join("\n");
}

/** Markdown for already-bucketed days (what a view renders). */
export function daysToMarkdown(days: DayBucket<any>[], options: MarkdownOptions = {}): string {
  const { timeZone, title = "Schedule", now, includeEmptyDays = true } = options;
  const today = now ? toDisplay(now, timeZone) : null;
  const lines: string[] = [];

  if (days.length) {
    const first = toDisplay(days[0]!.date, timeZone);
    const last = toDisplay(days[days.length - 1]!.date, timeZone);
    const span = days.length === 1 ? format(first, "EEEE, MMMM d, yyyy") : `${format(first, "MMM d")} – ${format(last, "MMM d, yyyy")}`;
    lines.push(`# ${title}: ${span}`, "");
  } else {
    lines.push(`# ${title}`, "");
  }
  lines.push(`Times are in ${timeZone ?? "local time"}.`);

  for (const day of days) {
    const local = toDisplay(day.date, timeZone);
    const items: EventOccurrence[] = [...day.allDay, ...day.occurrences];
    if (!items.length && !includeEmptyDays) continue;
    const isToday = today ? isSameDay(local, today) : false;
    lines.push("", `## ${format(local, "EEEE, MMM d")}${isToday ? " (today)" : ""}`);
    if (!items.length) lines.push("- No events");
    for (const occ of items) lines.push(occurrenceToMarkdown(occ, options));
  }
  return lines.join("\n");
}

const MARKDOWN_GRID: GridConfig = { dayStartHour: 0, dayEndHour: 24, pxPerHour: 60 };

/** Expand `events` over `range` (recurrence included) and render them as Markdown. */
export function scheduleToMarkdown<TMeta = Record<string, unknown>>(
  events: CalendarEvent<TMeta>[],
  options: MarkdownOptions & { range: DateRange },
): string {
  const { days } = buildView(events, { range: options.range, grid: MARKDOWN_GRID, timeZone: options.timeZone });
  return daysToMarkdown(days, options);
}

// ---------------------------------------------------------------------------
// Prompts + chat deep links
// ---------------------------------------------------------------------------

export const DEFAULT_AI_INSTRUCTIONS =
  "Here is my calendar. Use it to answer my questions — for example: find free time, " +
  "spot clashes, plan my week, or summarize what's coming up. Ask me what I need help with.";

export const DEFAULT_EVENT_AI_INSTRUCTIONS =
  "Here is an event from my calendar. Help me with it — for example: prepare for it, " +
  "draft a message about it, or plan around it. Ask me what I need help with.";

/** Wrap schedule Markdown with instructions (and an optional first question). */
export function buildAIPrompt(markdown: string, options: { instructions?: string; question?: string } = {}): string {
  const { instructions = DEFAULT_AI_INSTRUCTIONS, question } = options;
  return [instructions, "", markdown, ...(question ? ["", question] : [])].join("\n");
}

/** A chat app that accepts a prefilled prompt via URL. */
export interface AIProvider {
  id: string;
  label: string;
  /** Build the URL that opens a new chat prefilled with `prompt`. */
  url: (prompt: string) => string;
}

export const AI_PROVIDERS = {
  chatgpt: {
    id: "chatgpt",
    label: "ChatGPT",
    url: (prompt: string) => `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  claude: {
    id: "claude",
    label: "Claude",
    url: (prompt: string) => `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
} satisfies Record<string, AIProvider>;

/**
 * Longest prefilled URL we hand to a browser. Past this, browsers and chat apps
 * start truncating — callers should copy the prompt to the clipboard instead.
 */
export const MAX_AI_URL_LENGTH = 8000;
