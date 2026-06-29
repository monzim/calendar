# @monzim/calendar

A **routine-native**, headless-first React calendar. One generic event model feeds
every view — **week / day / today / month** — with correct recurrence, overlap
lane-packing, timezones, and one-click export to Google / Apple / Outlook.

Unlike event-instance calendars, this one is built around **routines** (a thing that
repeats every Monday 09:30) — university timetables, gym schedules, shift rosters,
clinic hours — while still handling one-off events. Styled with Tailwind tokens, it
drops straight into a modern shadcn app, and ships a self-contained stylesheet so it
works **without** your Tailwind config too.

**[▶ Live demo](https://monzim.github.io/calendar/)** · [GitHub](https://github.com/monzim/calendar) · MIT

> Successor to the original `GoogleCalendarWeekly` weekly-routine component — now
> generic, multi-view, recurrence-aware, and publishable. (`<GoogleCalendarWeekly>`
> lives on as a week-first preset of `<Calendar>`.)

## Install

```bash
npm i @monzim/calendar
# peer deps: react >=18.3, react-dom >=18.3
```

## Quick start — one import does everything

```tsx
import { GoogleCalendarWeekly, fromRoutine } from "@monzim/calendar";
import "@monzim/calendar/styles.css";

const events = fromRoutine([
  {
    title: "Machine Learning",
    schedule: {
      Thursday: { start: "12:00", end: "15:00" },
      Sunday: { start: "15:30", end: "17:30" },
    },
    location: "Room 102",
    actors: [{ name: "Dr. Emily Johnson", avatarUrl: "https://i.pravatar.cc/150?img=20" }],
  },
], { timeZone: "Asia/Dhaka" });

export default function App() {
  return <GoogleCalendarWeekly events={events} timeZone="Asia/Dhaka" />;
}
```

`<GoogleCalendarWeekly>` is a week-first preset of `<Calendar>`. Use `<Calendar>`
directly to start on any view.

## Data model

One model powers every view. A **routine is just an event with a recurrence rule.**

- `CalendarEvent<TMeta>` — the canonical event (concrete datetimes, maps 1:1 to
  iCalendar). Add a `recurrence` rule to make it a routine; attach `actors`,
  `location`, `color`, and typed `meta`.
- `RoutineInput<TMeta>` — ergonomic, date-free weekly input (`schedule` keyed by
  weekday name or code). `fromRoutine()` expands it into recurring `CalendarEvent`s.
- `Actor` — a person on an event (instructor / organizer / attendee); every field
  optional, drives avatars and color-coding.

```ts
import type { CalendarEvent } from "@monzim/calendar";

const event: CalendarEvent<{ courseCode: string }> = {
  title: "Thesis Defense",
  start: "2026-07-02T14:00:00+06:00",
  end: "2026-07-02T15:30:00+06:00",
  location: "Room 612",
  actors: [{ name: "Dr. Alex Smith", role: "supervisor" }],
  meta: { courseCode: "CSE499" },
};
```

## Views & props

All views are on by default; switch via the header toggle or `defaultView`.

| Prop | Default | Description |
| --- | --- | --- |
| `events` | — | `CalendarEvent[]` to render |
| `defaultView` | `"week"` | `week` · `day` · `today` · `month` |
| `weekStartsOn` | `0` | 0 = Sunday … 6 = Saturday |
| `visibleDays` | all 7 | subset of weekday indices (work-week, e.g. `[1,2,3,4,5]`) |
| `grid` | `{ dayStartHour: 8, dayEndHour: 18, pxPerHour: 60 }` | visible hour window + row height |
| `timeZone` | runtime | IANA zone for display + bucketing |
| `nowIndicator` | `true` | current-time line in day/week |
| `onEventClick` | — | `(occurrence) => void` |
| `showExport` | `true` | `.ics` download button |

Overlapping events lane-pack automatically; the now-indicator is hydration-safe (it
only appears after mount), so the component is SSR-safe on Next / Remix / TanStack Start.

## Export & import

```ts
import {
  toICS, downloadICS, parseICS,
  toGoogleCalendarUrl, toOutlookUrl,
} from "@monzim/calendar";

downloadICS(events, "my-routine.ics");      // RFC-5545, RRULE + EXDATE
const url = toGoogleCalendarUrl(events[0]);  // pre-filled Google composer
const back = parseICS(icsText);              // round-trips toICS()
```

Apple Calendar has no URL scheme — the `.ics` download opens directly into it on
macOS/iOS. Outlook's URL scheme has no reliable recurrence; use `.ics` for routines.

## Using with AI coding agents

Copy-paste rules for an LLM assistant integrating this package:

1. **Package**: `@monzim/calendar`. Install it; peers are `react`/`react-dom` (>=18.3).
2. **Always import the stylesheet once** at app entry: `import "@monzim/calendar/styles.css";`
   — without it the calendar is unstyled.
3. **One import does everything**: `import { GoogleCalendarWeekly } from "@monzim/calendar"`.
   `<GoogleCalendarWeekly>` = `<Calendar defaultView="week">`. Use `<Calendar>` for other
   default views. Pass `events: CalendarEvent[]`.
4. **Two input shapes**, pick by use case:
   - **One-off / dated events** → build `CalendarEvent` objects directly
     (`{ title, start, end }`, ISO strings or `Date`; add `recurrence` to repeat).
   - **Weekly routines / timetables** → build `RoutineInput` (`{ title, schedule: { Monday: { start: "09:00", end: "10:30" } } }`)
     and convert with `fromRoutine(routines, { timeZone })`. Weekday keys accept
     `"Monday"` or `"MO"`.
5. **Timezones**: pass `timeZone="Area/City"` (IANA) on the component AND to `fromRoutine`
   so display and recurrence agree. Omit only if everything is in the runtime-local zone.
6. **People** go in `actors: [{ name, email?, avatarUrl?, role? }]`. **Domain data** goes in
   typed `meta` (e.g. `CalendarEvent<{ courseCode: string }>`).
7. **SSR / Next.js**: safe to render on the server; the now-indicator appears only after
   mount (no hydration mismatch). The component is a client component.
8. **Don't** hand-roll recurrence, overlap, ICS, or timezones — use the provided helpers
   (`fromRoutine`, `toICS`, `parseICS`, `toGoogleCalendarUrl`, `toOutlookUrl`, `downloadICS`).
9. Clicking an event opens a built-in details dialog (with Google/Outlook/.ics actions).
   Pass `onEventClick` only to override that behaviour.

Minimal, complete, working example:

```tsx
import { GoogleCalendarWeekly, fromRoutine, type CalendarEvent } from "@monzim/calendar";
import "@monzim/calendar/styles.css";

const events: CalendarEvent[] = fromRoutine(
  [
    {
      title: "Machine Learning",
      schedule: { Monday: { start: "09:30", end: "12:00" }, Wednesday: { start: "10:30", end: "12:30" } },
      location: "Room 102",
      actors: [{ name: "Dr. Emily Johnson" }],
    },
  ],
  { timeZone: "Asia/Dhaka" },
);

export default function Schedule() {
  return <GoogleCalendarWeekly events={events} timeZone="Asia/Dhaka" weekStartsOn={0} />;
}
```

## Layered entries (power users)

The package is layered internally and tree-shakeable:

```ts
import { expandRecurrence, lanePack, buildView } from "@monzim/calendar/core";  // pure TS engine
import { useCalendar, useNow } from "@monzim/calendar/react";                    // headless hooks
import { Calendar, TimeGrid, EventCard } from "@monzim/calendar/ui";             // the skin
```

## Theming

Tokens are scoped CSS variables under `.gcal-root`. Override any `--gcal-*` to retheme;
Tailwind v4 users can map them into their own `@theme`. Dark mode follows a `.dark`
class on an ancestor.

## Development

```bash
git clone https://github.com/monzim/calendar.git
cd calendar
pnpm install
pnpm dev          # run the demo (apps/web)
pnpm test         # engine + hydration tests
pnpm --filter @monzim/calendar build
```

Monorepo: `packages/calendar` (the library) + `apps/web` (the demo, deployed to
GitHub Pages at <https://monzim.github.io/calendar/>).

## License

MIT © Azraf Al Monzim
