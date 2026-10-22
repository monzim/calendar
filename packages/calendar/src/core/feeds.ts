import { parseICS } from "./ics";
import type { CalendarEvent } from "./types";

/** A remote iCalendar feed to subscribe to. */
export interface ICSFeed {
  /** `https://…` or `webcal://…` URL of an `.ics` feed. */
  url: string;
  /** Stamped onto every event from this feed (unless the event already has one). */
  calendarId?: string;
  /** Stamped onto every event from this feed (unless the event already has one). */
  color?: string;
}

export interface FetchICSOptions {
  /** Abort the request (e.g. on unmount). */
  signal?: AbortSignal;
  /**
   * Custom fetch — use it to route through a CORS proxy or add auth headers.
   * Most public feeds (Google, Outlook) do not send CORS headers, so browser
   * apps usually need a same-origin proxy.
   */
  fetch?: typeof fetch;
}

/**
 * Short, non-reversible namespace for a feed. Private feed URLs (e.g. Google's
 * "secret address") are credentials, so they must never end up in event ids —
 * those flow into DOM keys and `.ics` exports. FNV-1a, 32-bit, base36.
 */
function feedNamespace(url: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < url.length; i++) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `feed-${(hash >>> 0).toString(36)}`;
}

/** Origin only — paths and query strings of feed URLs can carry secret tokens. */
function redact(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "<invalid feed url>";
  }
}

/** `webcal://` is just `https://` with a calendar-app hint. */
export function normalizeFeedUrl(url: string): string {
  return url.replace(/^webcals?:\/\//i, "https://");
}

/**
 * Fetch and parse a remote `.ics` feed. Event ids are namespaced by a hash of
 * the feed URL (never the URL itself) so two feeds can't collide; `calendarId`
 * / `color` from the feed are applied to events that don't set their own.
 */
export async function fetchICS(
  feed: string | ICSFeed,
  options: FetchICSOptions = {},
): Promise<CalendarEvent[]> {
  const config: ICSFeed = typeof feed === "string" ? { url: feed } : feed;
  const doFetch = options.fetch ?? globalThis.fetch;
  if (!doFetch) throw new Error("fetchICS: no fetch implementation available");

  const url = normalizeFeedUrl(config.url);
  const res = await doFetch(url, { signal: options.signal, headers: { Accept: "text/calendar" } });
  if (!res.ok) throw new Error(`fetchICS: ${res.status} ${res.statusText} from ${redact(url)}`);

  return parseICS(await res.text()).map((event, i) => ({
    ...event,
    id: `${feedNamespace(config.url)}#${event.id ?? i}`,
    calendarId: event.calendarId ?? config.calendarId,
    color: event.color ?? config.color,
  }));
}
