"use client";

import { useCallback, useMemo, useState } from "react";
import { filterEvents, groupEvents, type EventGroup, type GroupBy } from "../core/filter";
import type { CalendarEvent } from "../core/types";

export interface UseEventFilterOptions<TMeta = Record<string, unknown>> {
  /** How to group events into legend entries. Default `"calendar"`. */
  by?: GroupBy<TMeta>;
  /** Initially hidden group keys (uncontrolled). */
  defaultHidden?: string[];
  /** Hidden group keys (controlled). Pair with `onHiddenChange`. */
  hidden?: string[];
  onHiddenChange?: (hidden: string[]) => void;
}

export interface UseEventFilterReturn<TMeta = Record<string, unknown>> {
  /** Distinct groups across ALL events (hidden ones included). */
  groups: EventGroup[];
  /** Events with hidden groups removed — feed this to `useCalendar` / `<Calendar>`. */
  events: CalendarEvent<TMeta>[];
  hidden: string[];
  isHidden: (key: string) => boolean;
  toggle: (key: string) => void;
  /** Show only `key` — or, if it's already the only visible group, show everything. */
  solo: (key: string) => void;
  showAll: () => void;
  setHidden: (hidden: string[]) => void;
}

/** Legend/filter state over a list of events, grouped by calendar, person, or a custom key. */
export function useEventFilter<TMeta = Record<string, unknown>>(
  events: CalendarEvent<TMeta>[],
  options: UseEventFilterOptions<TMeta> = {},
): UseEventFilterReturn<TMeta> {
  const { by = "calendar", defaultHidden, hidden: controlled, onHiddenChange } = options;
  const [uncontrolled, setUncontrolled] = useState<string[]>(defaultHidden ?? []);
  const hidden = controlled ?? uncontrolled;

  const setHidden = useCallback(
    (next: string[]) => {
      if (controlled === undefined) setUncontrolled(next);
      onHiddenChange?.(next);
    },
    [controlled, onHiddenChange],
  );

  const groups = useMemo(() => groupEvents(events, by), [events, by]);
  const filtered = useMemo(() => filterEvents(events, hidden, by), [events, hidden, by]);
  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);

  const isHidden = useCallback((key: string) => hiddenSet.has(key), [hiddenSet]);
  const toggle = useCallback(
    (key: string) => setHidden(hiddenSet.has(key) ? hidden.filter((k) => k !== key) : [...hidden, key]),
    [hidden, hiddenSet, setHidden],
  );
  const solo = useCallback(
    (key: string) => {
      const others = groups.map((g) => g.key).filter((k) => k !== key);
      const alreadySolo = !hiddenSet.has(key) && others.every((k) => hiddenSet.has(k));
      setHidden(alreadySolo ? [] : others);
    },
    [groups, hiddenSet, setHidden],
  );
  const showAll = useCallback(() => setHidden([]), [setHidden]);

  return { groups, events: filtered, hidden, isHidden, toggle, solo, showAll, setHidden };
}
