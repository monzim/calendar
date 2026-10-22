"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { addDays, format } from "date-fns";
import { downloadICS } from "../core/ics";
import { toDisplay } from "../core/timezone";
import type {
  CalendarEvent,
  CalendarViewType,
  DayBucket,
  EventOccurrence,
  PositionedOccurrence,
  TimeZone,
} from "../core/types";
import type { GroupBy } from "../core/filter";
import {
  AI_PROVIDERS,
  DEFAULT_EVENT_AI_INSTRUCTIONS,
  buildAIPrompt,
  daysToMarkdown,
  eventToMarkdown,
  type AIProvider,
} from "../core/ai";
import type { ICSFeed } from "../core/feeds";
import { useCalendar } from "../react/useCalendar";
import { useEventFilter } from "../react/useEventFilter";
import { useICSFeed, type UseICSFeedOptions } from "../react/useICSFeed";
import { useNow } from "../react/useNow";
import type { UseCalendarOptions } from "../react/types";
import { AskAIMenu } from "./components/AskAIMenu";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarLegend } from "./components/CalendarLegend";
import { TimeGrid } from "./components/TimeGrid";
import { EventDialog, type EventDialogProps } from "./components/EventDialog";
import { AgendaView } from "./views/AgendaView";
import { MonthView } from "./views/MonthView";
import { cn } from "./lib/cn";
import { printCalendar } from "./lib/print";
import type { EventContentRenderer } from "./lib/render";

/** Options for the "Ask AI" menu. */
export interface CalendarAIOptions {
  /** Chat apps to offer. Default ChatGPT + Claude. Pass `[]` for copy-only. */
  providers?: AIProvider[];
  /** Instructions placed before the schedule. */
  instructions?: string;
  /** Instructions placed before a single event (dialog menu). */
  eventInstructions?: string;
  /** Include event descriptions in the prompt. Default true. */
  includeDescriptions?: boolean;
  /** Include people's names/roles (never emails). Default true. */
  includePeople?: boolean;
}

const DEFAULT_AI_PROVIDERS: AIProvider[] = [AI_PROVIDERS.chatgpt, AI_PROVIDERS.claude];

export interface CalendarProps<TMeta = Record<string, unknown>>
  extends UseCalendarOptions<TMeta> {
  className?: string;
  /** Which views to offer in the toggle. Default: today / day / week / month / agenda. */
  views?: CalendarViewType[];
  /** Show the current-time line in day/today/week. Default true. */
  nowIndicator?: boolean;
  /** Show the ".ics" export button. Default true. */
  showExport?: boolean;
  exportFilename?: string;
  /** Show the print button (prints only this calendar, landscape). Default true. */
  showPrint?: boolean;
  onEventClick?: (occurrence: PositionedOccurrence | EventOccurrence) => void;

  /**
   * Show a toggleable legend that filters events. `true` groups by `calendarId`;
   * pass `"actor"` to group by person, or a function for custom keys (memoize it).
   */
  legend?: boolean | GroupBy<TMeta>;
  /** Initially hidden legend groups (uncontrolled). */
  defaultHiddenGroups?: string[];
  /** Hidden legend groups (controlled). Pair with `onHiddenGroupsChange`. */
  hiddenGroups?: string[];
  onHiddenGroupsChange?: (hidden: string[]) => void;

  /** Remote `.ics` feeds merged into `events` (fetched client-side). */
  feeds?: string | ICSFeed | Array<string | ICSFeed>;
  /** Refresh interval / custom fetch (CORS proxy) for `feeds`. */
  feedOptions?: UseICSFeedOptions;

  /** Replace the content of every event block / chip / row; wrappers stay. */
  renderEventContent?: EventContentRenderer<TMeta>;
  /** Extra section in the built-in event dialog. */
  renderEventDetails?: (occurrence: EventOccurrence<TMeta>) => ReactNode;
  /** Replace the built-in event dialog body entirely. */
  renderEventDialog?: (occurrence: EventOccurrence<TMeta>, helpers: { close: () => void }) => ReactNode;
  /** Extra controls in the header, before the print / export buttons. */
  headerActions?: ReactNode;

  /**
   * "Ask AI" menus in the header (the visible range) and the event dialog: copy
   * as Markdown, or open ChatGPT / Claude prefilled. Off by default because using
   * it sends calendar data to a third party; ids, URLs and emails are never included.
   */
  ai?: boolean | CalendarAIOptions;
}

const DEFAULT_VIEWS: CalendarViewType[] = ["today", "day", "week", "month", "agenda"];

function rangeLabel(
  view: CalendarViewType,
  start: Date,
  end: Date,
  current: Date,
  tz?: TimeZone,
): string {
  if (view === "month") return format(toDisplay(current, tz), "MMMM yyyy");
  if (view === "day" || view === "today") {
    return format(toDisplay(current, tz), "EEE, MMM d, yyyy");
  }
  const first = toDisplay(start, tz);
  const last = toDisplay(addDays(end, -1), tz);
  return `${format(first, "MMM d")} – ${format(last, "MMM d, yyyy")}`;
}

export function Calendar<TMeta = Record<string, unknown>>(props: CalendarProps<TMeta>) {
  const {
    className,
    views = DEFAULT_VIEWS,
    nowIndicator = true,
    showExport = true,
    exportFilename = "calendar.ics",
    showPrint = true,
    onEventClick,
    legend = false,
    defaultHiddenGroups,
    hiddenGroups,
    onHiddenGroupsChange,
    feeds,
    feedOptions,
    renderEventContent,
    renderEventDetails,
    renderEventDialog,
    headerActions,
    ai = false,
    ...calendarOptions
  } = props;

  const rootRef = useRef<HTMLDivElement>(null);
  const feed = useICSFeed(feeds, feedOptions);
  const allEvents = useMemo<CalendarEvent<TMeta>[]>(
    () =>
      feed.events.length
        ? [...calendarOptions.events, ...(feed.events as CalendarEvent<TMeta>[])]
        : calendarOptions.events,
    [calendarOptions.events, feed.events],
  );

  const groupBy: GroupBy<TMeta> = legend === true || legend === false ? "calendar" : legend;
  const filter = useEventFilter<TMeta>(allEvents, {
    by: groupBy,
    defaultHidden: defaultHiddenGroups,
    hidden: hiddenGroups,
    onHiddenChange: onHiddenGroupsChange,
  });
  const visibleEvents = legend === false ? allEvents : filter.events;

  const cal = useCalendar<TMeta>({ ...calendarOptions, events: visibleEvents });
  const now = useNow();

  const label = useMemo(
    () => rangeLabel(cal.view, cal.visibleRange.start, cal.visibleRange.end, cal.currentDate, cal.timeZone),
    [cal.view, cal.visibleRange, cal.currentDate, cal.timeZone],
  );

  const handleExport = showExport
    ? () => downloadICS(visibleEvents as CalendarEvent[], exportFilename)
    : undefined;
  const handlePrint = showPrint ? () => printCalendar(rootRef.current) : undefined;

  const aiOptions: CalendarAIOptions | null = ai === false ? null : ai === true ? {} : ai;
  const aiProviders = aiOptions?.providers ?? DEFAULT_AI_PROVIDERS;
  const markdownOptions = {
    timeZone: cal.timeZone,
    now,
    includeDescriptions: aiOptions?.includeDescriptions,
    includePeople: aiOptions?.includePeople,
  };
  const aiMenu = aiOptions ? (
    <AskAIMenu
      providers={aiProviders}
      getPrompt={() =>
        buildAIPrompt(daysToMarkdown(cal.days as DayBucket[], markdownOptions), {
          instructions: aiOptions.instructions,
        })
      }
    />
  ) : null;
  const eventAIPrompt = aiOptions
    ? (occ: EventOccurrence) =>
        buildAIPrompt(eventToMarkdown(occ, markdownOptions), {
          instructions: aiOptions.eventInstructions ?? DEFAULT_EVENT_AI_INSTRUCTIONS,
        })
    : undefined;

  // Built-in details dialog. A consumer `onEventClick` overrides it entirely.
  const [selected, setSelected] = useState<EventOccurrence | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const handleEventClick = onEventClick
    ? (onEventClick as (occ: EventOccurrence) => void)
    : (occ: EventOccurrence) => {
        setSelected(occ);
        setDialogOpen(true);
      };

  return (
    <div
      ref={rootRef}
      className={cn(
        "gcal-root flex w-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      <CalendarHeader
        label={label}
        view={cal.view}
        views={views}
        onViewChange={cal.setView}
        onPrev={cal.goPrev}
        onNext={cal.goNext}
        onToday={cal.goToday}
        onExport={handleExport}
        onPrint={handlePrint}
        actions={
          headerActions || aiMenu ? (
            <>
              {headerActions}
              {aiMenu}
            </>
          ) : undefined
        }
      />

      {legend !== false ? (
        <CalendarLegend
          groups={filter.groups}
          isHidden={filter.isHidden}
          onToggle={filter.toggle}
          onSolo={filter.solo}
          onShowAll={filter.showAll}
        />
      ) : null}

      {cal.view === "agenda" ? (
        <AgendaView
          days={cal.days as DayBucket[]}
          timeZone={cal.timeZone}
          now={now}
          onEventClick={handleEventClick}
          renderEventContent={renderEventContent as EventContentRenderer<any> | undefined}
        />
      ) : cal.view === "month" ? (
        <MonthView
          days={cal.days as DayBucket[]}
          monthDate={cal.currentDate}
          timeZone={cal.timeZone}
          now={now}
          onEventClick={handleEventClick}
          renderEventContent={renderEventContent as EventContentRenderer<any> | undefined}
        />
      ) : (
        <TimeGrid
          days={cal.days as DayBucket[]}
          grid={cal.grid}
          timeZone={cal.timeZone}
          now={now}
          nowIndicator={nowIndicator}
          onEventClick={handleEventClick}
          renderEventContent={renderEventContent as EventContentRenderer<any> | undefined}
        />
      )}

      {onEventClick ? null : (
        <EventDialog
          occurrence={selected}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          timeZone={cal.timeZone}
          renderDetails={renderEventDetails as EventDialogProps["renderDetails"]}
          renderContent={renderEventDialog as EventDialogProps["renderContent"]}
          aiPrompt={eventAIPrompt}
          aiProviders={aiProviders}
        />
      )}
    </div>
  );
}
