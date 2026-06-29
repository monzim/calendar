import type { Actor, CalendarEvent, Weekday, WeekdayInput, WeekdayName } from "./types";

export function isRecurring<TMeta = Record<string, unknown>>(
  event: CalendarEvent<TMeta>,
): boolean {
  return event.recurrence != null;
}

const CODE_BY_NAME: Record<string, Weekday> = {
  sunday: "SU",
  monday: "MO",
  tuesday: "TU",
  wednesday: "WE",
  thursday: "TH",
  friday: "FR",
  saturday: "SA",
};
const NAME_BY_CODE: Record<Weekday, WeekdayName> = {
  SU: "Sunday",
  MO: "Monday",
  TU: "Tuesday",
  WE: "Wednesday",
  TH: "Thursday",
  FR: "Friday",
  SA: "Saturday",
};

/** 0 (Sun) .. 6 (Sat), matching JS `Date.getDay()`. */
const INDEX_BY_CODE: Record<Weekday, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};
const CODE_BY_INDEX: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

/** Accepts "Monday" | "monday" | "MO" | "mo" -> "MO". Returns null if unrecognized. */
export function normalizeWeekday(input: WeekdayInput | string): Weekday | null {
  const s = String(input).trim();
  if (s.length === 2 && NAME_BY_CODE[s.toUpperCase() as Weekday]) {
    return s.toUpperCase() as Weekday;
  }
  return CODE_BY_NAME[s.toLowerCase()] ?? null;
}

export function weekdayName(code: Weekday): WeekdayName {
  return NAME_BY_CODE[code];
}

/** Weekday code -> JS day index (0=Sun .. 6=Sat). */
export function weekdayIndex(code: Weekday): number {
  return INDEX_BY_CODE[code];
}

/** JS day index (0=Sun .. 6=Sat) -> weekday code. */
export function weekdayFromIndex(index: number): Weekday {
  return CODE_BY_INDEX[((index % 7) + 7) % 7]!;
}

/**
 * Avatar fallback initials from an actor.
 * "Dr. Alex Smith" -> "DS", "Emily" -> "EM", email-only -> first 2 chars, else "?".
 */
export function actorInitials(actor: Actor): string {
  const source = (actor.name || actor.email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

let __idCounter = 0;
/** Deterministic-ish unique id for events missing one. Stable within a session. */
export function generateId(prefix = "evt"): string {
  __idCounter += 1;
  return `${prefix}_${__idCounter.toString(36)}`;
}
