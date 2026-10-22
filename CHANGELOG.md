# Changelog

All notable changes to `@monzim/calendar`. This project follows
[Semantic Versioning](https://semver.org/).

## 1.0.0 — 2026-10-22

First public release: a routine-native, headless-first React calendar.

### Views and engine

- One event model (`CalendarEvent`) for every view: **today, day, week, month and
  agenda** (a day-grouped list; `agendaDays` sets its span).
- Weekly routines in (`fromRoutine` / `RoutineInput`), recurring events out — RRULE
  recurrence with exceptions, IANA timezones, overlap lane-packing.
- SSR-safe: the now-line appears only after mount, so there's no hydration mismatch.
- Headless entries: `@monzim/calendar/core` (pure engine), `/react` (hooks), `/ui`
  (the styled skin), plus a batteries-included root entry.

### Features

- **Legend & filtering** — `legend` prop groups by `calendarId`, person or a custom
  key; toggle, Alt-click to solo, show all; controlled or uncontrolled. Headless
  `useEventFilter`, `groupEvents`, `filterEvents`.
- **Remote `.ics` feeds** — `feeds` prop, `useICSFeed`, `fetchICS`; refresh interval,
  custom fetch for CORS proxies, per-feed errors. Feed URLs (which can be secret) never
  appear in event ids or error messages.
- **Import / export** — `toICS`, `downloadICS`, `parseICS` (handles `VALARM`,
  `RECURRENCE-ID`, missing `DTEND`, quoted and non-IANA `TZID`s, `COLOR`), Google and
  Outlook links.
- **Printing** — prints only the calendar on a landscape page in the light theme with
  event colors; a week fits one page, agenda days never split.
- **Ask AI** (opt-in `ai` prop) — open the visible range or one event in ChatGPT or
  Claude with the schedule in the link (compacted to fit; no copy-paste), or copy it as
  Markdown. Prompts never include ids, URLs, emails or avatar links.
- **Custom rendering** — `renderEventContent`, `renderEventDetails`,
  `renderEventDialog`, `headerActions`.

### Design

- Tinted event blocks with an accent bar, mixed from one `--gcal-event` color so any
  hex reads in light and dark mode; Google-style cascading overlaps.
- Refined header, month view, event dialog and dark theme; scoped `--gcal-*` tokens
  for theming.

### Docs

- README covers every prop and feature, with rules for AI coding agents.
- `llms.txt` and `llms-full.txt` published with the demo at
  <https://monzim.github.io/calendar/>.
