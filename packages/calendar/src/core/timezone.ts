import { TZDate } from "@date-fns/tz";
import type { ISODateTime, TimeZone } from "./types";

/** True when an ISO string carries an explicit offset ("Z" or "±HH:MM"). */
function hasOffset(iso: string): boolean {
  return /([zZ]|[+-]\d{2}:?\d{2})$/.test(iso.trim());
}

const FLOATING_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/;

/**
 * Coerce a model datetime (`ISODateTime | Date`) into an absolute instant.
 *
 * - A `Date` is already an instant — returned as-is.
 * - An ISO string WITH an offset (`...Z`, `...+06:00`) is an instant.
 * - A "floating" ISO string (no offset) is interpreted in `timezone` when given,
 *   otherwise in the runtime-local zone (standard `new Date(string)` behaviour).
 */
export function toInstant(value: ISODateTime | Date, timezone?: TimeZone): Date {
  if (value instanceof Date) return value;

  if (!hasOffset(value) && timezone) {
    const m = FLOATING_RE.exec(value.trim());
    if (m) {
      const [, y, mo, d, h, mi, s] = m;
      return new TZDate(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(h ?? 0),
        Number(mi ?? 0),
        Number(s ?? 0),
        timezone,
      );
    }
  }
  return new Date(value);
}

/**
 * Reinterpret an absolute instant as a wall-clock in `displayZone`. The returned
 * value's local getters (`getHours`, `getDate`, `getDay`...) reflect that zone.
 * With no zone, returns the instant unchanged (runtime-local zone applies).
 */
export function toDisplay(instant: Date, displayZone?: TimeZone): Date {
  return displayZone ? new TZDate(instant.getTime(), displayZone) : instant;
}

/** Minutes elapsed since local midnight, in the display zone. */
export function minutesSinceMidnight(instant: Date, displayZone?: TimeZone): number {
  const d = toDisplay(instant, displayZone);
  return d.getHours() * 60 + d.getMinutes();
}
