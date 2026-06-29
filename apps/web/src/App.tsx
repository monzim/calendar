import { useEffect, useMemo, useState } from "react";
import { GoogleCalendarWeekly, fromRoutine, type CalendarEvent } from "@monzim/calendar";
import { oneOffEvents, routines } from "./demo-data";

const TIME_ZONE = "Asia/Dhaka";

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return [dark, () => setDark((d) => !d)] as const;
}

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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">@monzim/calendar</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Routine-native React calendar — one event model, every view, one-click export.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleDark}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {dark ? "Light" : "Dark"} mode
          </button>
        </header>

        <GoogleCalendarWeekly events={events} timeZone={TIME_ZONE} weekStartsOn={0} />

        <footer className="text-center text-xs text-zinc-400">
          Click any event for details &amp; one-click export · drop in{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
            &lt;GoogleCalendarWeekly events=&#123;...&#125; /&gt;
          </code>
        </footer>
      </div>
    </div>
  );
}
