import type { Actor, CalendarEvent } from "./types";

/**
 * How events are grouped for the legend / filter bar:
 * - `"calendar"` — by `event.calendarId`
 * - `"actor"` — by each person in `event.actors` (an event can belong to several)
 * - a function returning one or more group keys for an event
 */
export type GroupBy<TMeta = Record<string, unknown>> =
  | "calendar"
  | "actor"
  | ((event: CalendarEvent<TMeta>) => string | string[] | undefined | null);

/** One legend entry: a group key plus what's needed to render it. */
export interface EventGroup {
  key: string;
  label: string;
  /** First color seen for the group (actor color wins for `"actor"`). */
  color?: string;
  /** Number of source events in the group (not expanded occurrences). */
  count: number;
  /** Set for `"actor"` grouping so the legend can show an avatar. */
  actor?: Actor;
}

function actorKey(actor: Actor): string | undefined {
  return actor.id ?? actor.email ?? actor.name;
}

/** Group keys an event belongs to under `by`. Empty when it has none. */
export function eventGroupKeys<TMeta = Record<string, unknown>>(
  event: CalendarEvent<TMeta>,
  by: GroupBy<TMeta>,
): string[] {
  if (by === "calendar") return event.calendarId ? [event.calendarId] : [];
  if (by === "actor") {
    return (event.actors ?? []).map(actorKey).filter((k): k is string => !!k);
  }
  const keys = by(event);
  if (keys == null) return [];
  return Array.isArray(keys) ? keys : [keys];
}

/**
 * Collect the distinct groups across `events`, in first-seen order. Events that
 * belong to no group are not represented (and are never hidden by filtering).
 */
export function groupEvents<TMeta = Record<string, unknown>>(
  events: CalendarEvent<TMeta>[],
  by: GroupBy<TMeta>,
): EventGroup[] {
  const groups = new Map<string, EventGroup>();
  for (const event of events) {
    if (by === "actor") {
      for (const actor of event.actors ?? []) {
        const key = actorKey(actor);
        if (!key) continue;
        const existing = groups.get(key);
        if (existing) {
          existing.count += 1;
          existing.color ??= actor.color ?? event.color;
        } else {
          groups.set(key, {
            key,
            label: actor.name ?? actor.email ?? key,
            color: actor.color ?? event.color,
            count: 1,
            actor,
          });
        }
      }
      continue;
    }
    for (const key of eventGroupKeys(event, by)) {
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
        existing.color ??= event.color;
      } else {
        groups.set(key, { key, label: key, color: event.color, count: 1 });
      }
    }
  }
  return [...groups.values()];
}

/**
 * Drop events whose groups are ALL hidden. An event in several groups (e.g. two
 * instructors) stays visible while any of its groups is visible; events with no
 * group are always kept.
 */
export function filterEvents<TMeta = Record<string, unknown>>(
  events: CalendarEvent<TMeta>[],
  hidden: Iterable<string>,
  by: GroupBy<TMeta>,
): CalendarEvent<TMeta>[] {
  const hiddenSet = hidden instanceof Set ? (hidden as Set<string>) : new Set(hidden);
  if (hiddenSet.size === 0) return events;
  return events.filter((event) => {
    const keys = eventGroupKeys(event, by);
    return keys.length === 0 || keys.some((k) => !hiddenSet.has(k));
  });
}
