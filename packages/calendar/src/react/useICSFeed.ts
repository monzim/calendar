"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchICS, type ICSFeed } from "../core/feeds";
import type { CalendarEvent } from "../core/types";

export interface UseICSFeedOptions {
  /** Re-fetch every N milliseconds. Off by default. */
  refreshInterval?: number;
  /** Custom fetch (CORS proxy, auth headers…). */
  fetch?: typeof fetch;
  /** Set false to pause fetching. Default true. */
  enabled?: boolean;
}

export interface ICSFeedError {
  url: string;
  error: Error;
}

export interface UseICSFeedReturn {
  /** Events from every feed that loaded; failed feeds contribute nothing. */
  events: CalendarEvent[];
  loading: boolean;
  /** One entry per feed that failed on the last load. */
  errors: ICSFeedError[];
  refresh: () => void;
}

const EMPTY: CalendarEvent[] = [];

function toFeeds(input: string | ICSFeed | Array<string | ICSFeed> | null | undefined): ICSFeed[] {
  if (!input) return [];
  return (Array.isArray(input) ? input : [input]).map((f) => (typeof f === "string" ? { url: f } : f));
}

/**
 * Subscribe to one or more remote `.ics` feeds. Fetches on mount (client only —
 * SSR renders with no feed events), on feed changes, on `refresh()`, and on the
 * optional interval. Inline arrays are fine: feeds are compared by value.
 */
export function useICSFeed(
  feeds: string | ICSFeed | Array<string | ICSFeed> | null | undefined,
  options: UseICSFeedOptions = {},
): UseICSFeedReturn {
  const { refreshInterval, fetch: customFetch, enabled = true } = options;
  const key = JSON.stringify(toFeeds(feeds));
  const list = useMemo(() => JSON.parse(key) as ICSFeed[], [key]);

  const [events, setEvents] = useState<CalendarEvent[]>(EMPTY);
  const [errors, setErrors] = useState<ICSFeedError[]>([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled || list.length === 0) {
      setEvents(EMPTY);
      setErrors([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    Promise.allSettled(list.map((feed) => fetchICS(feed, { signal: controller.signal, fetch: customFetch }))).then(
      (results) => {
        if (controller.signal.aborted) return;
        const next: CalendarEvent[] = [];
        const failed: ICSFeedError[] = [];
        results.forEach((r, i) => {
          if (r.status === "fulfilled") next.push(...r.value);
          else failed.push({ url: list[i]!.url, error: r.reason instanceof Error ? r.reason : new Error(String(r.reason)) });
        });
        setEvents(next);
        setErrors(failed);
        setLoading(false);
      },
    );
    return () => controller.abort();
  }, [list, enabled, customFetch, tick]);

  useEffect(() => {
    if (!enabled || !refreshInterval) return;
    const id = setInterval(refresh, refreshInterval);
    return () => clearInterval(id);
  }, [enabled, refreshInterval, refresh]);

  return { events, loading, errors, refresh };
}
