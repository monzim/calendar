import type { RecurrenceRule } from "./types";
import { toInstant } from "./timezone";

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

function untilStamp(until: string): string {
  const d = toInstant(until);
  return (
    `${pad(d.getUTCFullYear(), 4)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Serialize a RecurrenceRule (or pass through a raw rule string) to RRULE body. */
export function ruleToRRULEString(rule: RecurrenceRule | string): string {
  if (typeof rule === "string") {
    return rule.startsWith("RRULE:") ? rule.slice(6) : rule;
  }
  const parts: string[] = [`FREQ=${rule.freq.toUpperCase()}`];
  if (rule.interval && rule.interval !== 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.byWeekday?.length) parts.push(`BYDAY=${rule.byWeekday.join(",")}`);
  if (rule.byMonthday?.length) parts.push(`BYMONTHDAY=${rule.byMonthday.join(",")}`);
  if (rule.count != null) parts.push(`COUNT=${rule.count}`);
  if (rule.until != null) parts.push(`UNTIL=${untilStamp(rule.until)}`);
  return parts.join(";");
}
