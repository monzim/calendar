import type {
  Actor,
  CalendarEvent,
  ISODateTime,
  RecurrenceRule,
  Weekday,
} from "./types";
import { generateId } from "./helpers";
import { toInstant } from "./timezone";
import { ruleToRRULEString } from "./internal-rrule";

const WEEKDAYS: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const FREQS: RecurrenceRule["freq"][] = ["daily", "weekly", "monthly", "yearly"];

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

/** Absolute instant -> "YYYYMMDDTHHMMSSZ" (UTC). */
function formatUTC(date: Date): string {
  return (
    `${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** Instant -> "YYYYMMDD" (UTC date parts, for all-day VALUE=DATE). */
function formatDateOnly(date: Date): string {
  return `${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** Escape RFC-5545 TEXT values. */
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function unesc(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/** Fold lines to <=75 octets per RFC 5545 (continuation = CRLF + space). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = i === 0 ? 75 : 74;
    out.push((i === 0 ? "" : " ") + line.slice(i, i + chunk));
    i += chunk;
  }
  return out.join("\r\n");
}

function actorLine(actor: Actor): string | null {
  if (!actor.email) return null;
  const cn = actor.name ? `;CN=${esc(actor.name)}` : "";
  return `ATTENDEE${cn}:mailto:${actor.email}`;
}

/** Serialize events to a single RFC-5545 VCALENDAR string. */
export function toICS<TMeta = Record<string, unknown>>(
  events: CalendarEvent<TMeta>[],
): string {
  const now = formatUTC(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//monzim//calendar//EN",
    "CALSCALE:GREGORIAN",
  ];

  for (const event of events) {
    const uid = event.id ?? generateId();
    const startInstant = toInstant(event.start, event.timezone);
    const endInstant = toInstant(event.end, event.timezone);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);

    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(startInstant)}`);
      lines.push(`DTEND;VALUE=DATE:${formatDateOnly(endInstant)}`);
    } else {
      lines.push(`DTSTART:${formatUTC(startInstant)}`);
      lines.push(`DTEND:${formatUTC(endInstant)}`);
    }

    lines.push(`SUMMARY:${esc(event.title)}`);
    if (event.location) lines.push(`LOCATION:${esc(event.location)}`);
    if (event.description) lines.push(`DESCRIPTION:${esc(event.description)}`);
    if (event.url) lines.push(`URL:${event.url}`);
    if (event.recurrence) lines.push(`RRULE:${ruleToRRULEString(event.recurrence)}`);
    if (event.exceptions?.length) {
      lines.push(
        `EXDATE:${event.exceptions.map((e) => formatUTC(toInstant(e, event.timezone))).join(",")}`,
      );
    }
    for (const actor of event.actors ?? []) {
      const line = actorLine(actor);
      if (line) lines.push(line);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n");
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** ICS datetime token -> ISO instant string. */
function icsToISO(value: string, tzid?: string): ISODateTime {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?(Z)?$/.exec(value);
  if (!m) return value;
  const [, y, mo, d, h, mi, s, z] = m;
  if (!h) {
    // date-only
    return `${y}-${mo}-${d}`;
  }
  const floating = `${y}-${mo}-${d}T${h}:${mi}:${s}`;
  if (z) return new Date(`${floating}Z`).toISOString();
  return toInstant(floating, tzid).toISOString();
}

function parseRRULE(value: string): RecurrenceRule {
  const map = new Map<string, string>();
  for (const part of value.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) map.set(k.toUpperCase(), v);
  }
  const freqRaw = (map.get("FREQ") ?? "WEEKLY").toLowerCase();
  const freq = (FREQS.includes(freqRaw as RecurrenceRule["freq"])
    ? freqRaw
    : "weekly") as RecurrenceRule["freq"];
  const rule: RecurrenceRule = { freq };

  const interval = map.get("INTERVAL");
  if (interval) rule.interval = Number(interval);

  const byday = map.get("BYDAY");
  if (byday) {
    rule.byWeekday = byday
      .split(",")
      .map((d) => d.replace(/^[+-]?\d+/, "").toUpperCase())
      .filter((d): d is Weekday => WEEKDAYS.includes(d as Weekday));
  }

  const bymonthday = map.get("BYMONTHDAY");
  if (bymonthday) rule.byMonthday = bymonthday.split(",").map(Number);

  const count = map.get("COUNT");
  if (count) rule.count = Number(count);

  const until = map.get("UNTIL");
  if (until) rule.until = icsToISO(until);

  return rule;
}

/** Split a content line into "NAME;params" and "value", returning parts. */
function splitLine(line: string): { name: string; params: Map<string, string>; value: string } {
  const colon = line.indexOf(":");
  const head = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const [name, ...paramParts] = head.split(";");
  const params = new Map<string, string>();
  for (const p of paramParts) {
    const [k, v] = p.split("=");
    if (k && v) params.set(k.toUpperCase(), v);
  }
  return { name: name!.toUpperCase(), params, value };
}

/** Parse an RFC-5545 string back into events (round-trips {@link toICS}). */
export function parseICS(text: string): CalendarEvent[] {
  // Unfold: a line beginning with space/tab continues the previous line.
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r\n|\n|\r/);

  const events: CalendarEvent[] = [];
  let current: Partial<CalendarEvent> | null = null;
  let actors: Actor[] = [];
  let exceptions: ISODateTime[] = [];

  for (const raw of lines) {
    if (!raw) continue;
    if (raw === "BEGIN:VEVENT") {
      current = { title: "" };
      actors = [];
      exceptions = [];
      continue;
    }
    if (raw === "END:VEVENT") {
      if (current) {
        if (actors.length) current.actors = actors;
        if (exceptions.length) current.exceptions = exceptions;
        events.push(current as CalendarEvent);
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const { name, params, value } = splitLine(raw);
    switch (name) {
      case "UID":
        current.id = value;
        break;
      case "SUMMARY":
        current.title = unesc(value);
        break;
      case "LOCATION":
        current.location = unesc(value);
        break;
      case "DESCRIPTION":
        current.description = unesc(value);
        break;
      case "URL":
        current.url = value;
        break;
      case "DTSTART":
        current.start = icsToISO(value, params.get("TZID"));
        if (params.get("VALUE") === "DATE") current.allDay = true;
        break;
      case "DTEND":
        current.end = icsToISO(value, params.get("TZID"));
        if (params.get("VALUE") === "DATE") current.allDay = true;
        break;
      case "RRULE":
        current.recurrence = parseRRULE(value);
        break;
      case "EXDATE":
        for (const tok of value.split(",")) {
          exceptions.push(icsToISO(tok, params.get("TZID")));
        }
        break;
      case "ATTENDEE": {
        const email = value.replace(/^mailto:/i, "");
        const cn = params.get("CN");
        actors.push(cn ? { name: unesc(cn), email } : { email });
        break;
      }
    }
  }

  return events;
}

/** Browser helper: trigger a download of the events as an .ics file. */
export function downloadICS<TMeta = Record<string, unknown>>(
  events: CalendarEvent<TMeta>[],
  filename = "calendar.ics",
): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([toICS(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
