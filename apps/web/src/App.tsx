import { useEffect, useMemo, useState } from "react";
import { GoogleCalendarWeekly, fromRoutine, type CalendarEvent } from "@monzim/calendar";
import { oneOffEvents, routines } from "./demo-data";

const TIME_ZONE = "Asia/Dhaka";
const INSTALL = "npm i @monzim/calendar";

function useDarkMode() {
  const [dark, setDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return [dark, () => setDark((d) => !d)] as const;
}

function Logo() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-amber-950 shadow-sm">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
        <rect x="3.5" y="5" width="17" height="15" rx="3" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
        <path d="M8 14h3" />
      </svg>
    </span>
  );
}

function ThemeIcon({ dark }: { dark: boolean }) {
  return dark ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

function InstallPill() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(INSTALL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="group inline-flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-[0.8125rem] shadow-xs transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <span className="text-zinc-400">$</span>
      <span>{INSTALL}</span>
      <span className="font-sans text-xs text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

const FEATURES = [
  { title: "Routine-native", body: "Weekly schedules in, recurring events out — timetables, shifts, clinic hours." },
  { title: "Every view", body: "Today, day, week and month from one event model, with overlap packing." },
  { title: "One-click export", body: "Google, Outlook and .ics for a single event or the whole calendar." },
];

export function App() {
  const [dark, toggleDark] = useDarkMode();

  const events = useMemo<CalendarEvent[]>(
    () =>
      [
        ...fromRoutine(routines, { timeZone: TIME_ZONE, baseDate: "2026-01-04T00:00:00+06:00" }),
        ...oneOffEvents,
      ] as unknown as CalendarEvent[],
    [],
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 sm:py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="font-semibold tracking-tight">@monzim/calendar</span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="https://github.com/monzim/calendar"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              GitHub
            </a>
            <button
              type="button"
              onClick={toggleDark}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <ThemeIcon dark={dark} />
            </button>
          </div>
        </nav>

        <header className="flex flex-col gap-4">
          <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            A React calendar built around routines.
          </h1>
          <p className="max-w-2xl text-pretty text-zinc-600 dark:text-zinc-400">
            One event model, every view, correct recurrence and timezones — with one-click export to Google,
            Apple and Outlook. Drops into any shadcn / Tailwind app, or works standalone.
          </p>
          <div>
            <InstallPill />
          </div>
        </header>

        <GoogleCalendarWeekly events={events} timeZone={TIME_ZONE} weekStartsOn={0} />

        <section className="grid gap-3 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <h3 className="text-sm font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{f.body}</p>
            </div>
          ))}
        </section>

        <footer className="border-t border-zinc-200 pt-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Click any event for details &amp; export · MIT licensed
        </footer>
      </div>
    </div>
  );
}
