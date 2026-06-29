"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe "current time". Returns `null` on the server and during the first
 * client render (so server + hydration markup match), then the live `Date`
 * after mount, ticking every `tickMs`. Drives the now-indicator + today
 * highlight without a hydration mismatch.
 */
export function useNow(tickMs = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  return now;
}
