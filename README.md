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
| `defaultView` | `"week"` | `week` · `day` · `today` · `month` · `agenda` |
| `views` | all five | which views the header toggle offers |
| `agendaDays` | `14` | days listed by the agenda view (and the step for ‹ ›) |
| `weekStartsOn` | `0` | 0 = Sunday … 6 = Saturday |
| `visibleDays` | all 7 | subset of weekday indices (work-week, e.g. `[1,2,3,4,5]`) |
| `grid` | `{ dayStartHour: 8, dayEndHour: 18, pxPerHour: 60 }` | visible hour window + row height |
| `timeZone` | runtime | IANA zone for display + bucketing |
| `nowIndicator` | `true` | current-time line in day/week |
| `onEventClick` | — | `(occurrence) => void` |
| `showExport` | `true` | `.ics` download button (exports what's visible) |
| `showPrint` | `true` | print button — see [Printing](#printing) |
| `legend` | `false` | filter chips — see [Legend & filtering](#legend--filtering) |
| `feeds` | — | remote `.ics` subscriptions — see [Remote feeds](#remote-ics-feeds) |
| `renderEventContent` / `renderEventDetails` / `renderEventDialog` / `headerActions` | — | see [Custom rendering](#custom-rendering) |
| `ai` | `false` | "Ask AI" menus — see [Ask AI](#ask-ai) |

Overlapping events lane-pack automatically; the now-indicator is hydration-safe (it
only appears after mount), so the component is SSR-safe on Next / Remix / TanStack Start.

The **agenda** view is a chronological list grouped by day (empty days skipped) — the
best default on phones and for "what's next" panels.

## Legend & filtering

Turn on `legend` to get a row of toggleable chips. Click toggles a group; Alt-click (or
double-click) shows only that group; "Show all" resets. An event in several groups stays
visible while any of them is on; events in no group are never hidden.

```tsx
<Calendar events={events} legend />                 // by calendarId
<Calendar events={events} legend="actor" />         // by person (avatar chips)
<Calendar events={events} legend={byCourse} />      // custom: (event) => key | key[] | null

// Controlled, e.g. to persist in the URL:
<Calendar events={events} legend hiddenGroups={hidden} onHiddenGroupsChange={setHidden} />
```

Define a custom `legend` function outside the component (or `useMemo` it) so it keeps a
stable identity. Headless: `useEventFilter(events, { by })` returns `{ groups, events,
toggle, solo, showAll, … }`, and `groupEvents` / `filterEvents` are pure core helpers.

## Remote .ics feeds

Subscribe to calendars published as iCalendar feeds; their events merge with `events`,
pick up the legend, and refresh on an interval.

```tsx
<Calendar
  events={events}
  feeds={[
    "https://example.com/holidays.ics",
    { url: "webcal://example.com/team.ics", calendarId: "Team", color: "#0ea5e9" },
  ]}
  feedOptions={{ refreshInterval: 15 * 60_000 }}
  legend
/>
```

Feeds are fetched in the browser after mount. **Most public feeds (Google, Outlook) send
no CORS headers**, so route them through your own endpoint with `feedOptions.fetch`
(e.g. `(url, init) => fetch("/api/ics?url=" + encodeURIComponent(String(url)), init)`).
A feed that fails is reported in `useICSFeed(...).errors` without dropping the others.
Server-side, call `fetchICS(feed)` directly. The parser handles `VALARM` blocks, moved
instances (`RECURRENCE-ID`), missing `DTEND`, quoted and non-IANA `TZID`s, and `COLOR`.

## Custom rendering

Keep the layout, swap the visuals:

```tsx
<Calendar<CourseMeta>
  events={events}
  // Inside every block / chip / row. The wrapper keeps positioning, tint and clicks.
  renderEventContent={(occ, { surface, height }) =>
    surface === "grid" && (height ?? 0) < 40
      ? <b>{occ.event.meta?.courseCode}</b>
      : <span>{occ.event.title} · {occ.event.meta?.courseCode}</span>}
  // An extra section in the built-in dialog…
  renderEventDetails={(occ) => <CourseBadge code={occ.event.meta?.courseCode} />}
  // …or replace the dialog body entirely.
  renderEventDialog={(occ, { close }) => <MyEventPanel occurrence={occ} onDone={close} />}
  headerActions={<Button size="sm">Add class</Button>}
/>
```

`surface` is `"grid"` (timed block in day/week), `"allDay"`, `"month"` or `"agenda"`.

## Printing

The print button prints **only the calendar** — not the rest of your page — on a
landscape page, in the light theme, with event colors kept. Navigation, view switcher
and legend are left out, a week that slightly overflows is shrunk onto one page, and the
agenda paginates without splitting a day. Trigger it yourself with
`printCalendar(element)` from `@monzim/calendar/ui`.

## Ask AI

`ai` adds an **Ask AI** menu to the header (for the visible range) and to the event
dialog (for one event): **Copy for AI** puts a clean Markdown schedule on the clipboard,
and **Open in ChatGPT / Claude** starts a new chat prefilled with it — handy for "when am
I free on Tuesday?", "do any classes clash?", or "plan my study week".

```tsx
<Calendar events={events} ai />

<Calendar
  events={events}
  ai={{
    providers: [AI_PROVIDERS.claude],             // default: ChatGPT + Claude; [] = copy only
    instructions: "You are my study planner.",     // replaces the default preamble
    includeDescriptions: false,                    // default true
  }}
/>
```

It's **off by default** because using it sends calendar data to a third party. The
Markdown carries only what's on screen — titles, times, places, people's names and roles —
never ids, URLs, emails or avatar links. Prompts too long for a URL are copied instead,
and the chat opens with a note to paste. Bring your own chat app with any
`{ id, label, url: (prompt) => string }`. The pieces are exported for custom UIs:
`scheduleToMarkdown`, `daysToMarkdown`, `eventToMarkdown`, `buildAIPrompt`,
`AI_PROVIDERS` (core) and `AskAIMenu`, `copyText` (ui).

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

The docs are published for agents at
[`/llms.txt`](https://monzim.github.io/calendar/llms.txt) (index) and
[`/llms-full.txt`](https://monzim.github.io/calendar/llms-full.txt) (this README), and the
demo has **Copy guide for AI / Open in ChatGPT / Open in Claude** buttons.

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
   (`fromRoutine`, `toICS`, `parseICS`, `fetchICS`, `toGoogleCalendarUrl`, `toOutlookUrl`, `downloadICS`).
9. Clicking an event opens a built-in details dialog (with Google/Outlook/.ics actions).
   Pass `onEventClick` only to override that behaviour; prefer `renderEventDetails` /
   `renderEventDialog` / `renderEventContent` to customise what's shown.
10. **Filtering** = `legend` prop (`true` → by `calendarId`, `"actor"`, or a key function).
    **Subscriptions** = `feeds` prop (needs a CORS proxy via `feedOptions.fetch` for most
    public feeds). **Lists** = `defaultView="agenda"`. **Print** = built-in button.
    **AI handoff** = `ai` prop (opt-in; menus to copy as Markdown / open ChatGPT or Claude).

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
import { useCalendar, useEventFilter, useICSFeed } from "@monzim/calendar/react"; // headless hooks
import { Calendar, TimeGrid, AgendaView, CalendarLegend, printCalendar } from "@monzim/calendar/ui"; // the skin
```

## Theming

Tokens are scoped CSS variables under `.gcal-root`. Override any `--gcal-*` to retheme;
Tailwind v4 users can map them into their own `@theme`. Dark mode follows a `.dark`
class on an ancestor. Event colors (`event.color`, any CSS color) feed a single
`--gcal-event` variable from which the fill, accent bar and text are mixed, so they stay
legible in both themes; tune the mix with `--gcal-event-fill` / `--gcal-event-ink`.

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
