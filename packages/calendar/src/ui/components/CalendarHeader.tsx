"use client";

import type { CalendarViewType } from "../../core/types";
import { Button } from "../primitives/button";
import { ToggleGroup, ToggleGroupItem } from "../primitives/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../primitives/dropdown-menu";
import { ChevronDown, ChevronLeft, ChevronRight, DownloadIcon } from "./icons";

const VIEW_LABELS: Record<CalendarViewType, string> = {
  today: "Today",
  day: "Day",
  week: "Week",
  month: "Month",
};

export interface CalendarHeaderProps {
  label: string;
  view: CalendarViewType;
  views: CalendarViewType[];
  onViewChange: (view: CalendarViewType) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onExport?: () => void;
}

export function CalendarHeader({
  label,
  view,
  views,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onExport,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-3 py-2.5 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex items-center rounded-lg border">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous"
            className="flex h-8 w-8 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="h-5 w-px bg-border" />
          <button
            type="button"
            onClick={onNext}
            aria-label="Next"
            className="flex h-8 w-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={onToday} className="hidden sm:inline-flex">
          Today
        </Button>
        <h2 className="truncate text-sm font-semibold tracking-tight tabular-nums sm:text-base">
          {label}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Desktop: segmented control */}
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && onViewChange(v as CalendarViewType)}
          className="hidden sm:inline-flex"
        >
          {views.map((v) => (
            <ToggleGroupItem key={v} value={v} aria-label={VIEW_LABELS[v]}>
              {VIEW_LABELS[v]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/* Mobile: dropdown */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {VIEW_LABELS[view]}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {views.map((v) => (
                <DropdownMenuItem key={v} onSelect={() => onViewChange(v)}>
                  {VIEW_LABELS[v]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {onExport ? (
          <Button variant="ghost" size="icon" onClick={onExport} aria-label="Export .ics" title="Export .ics">
            <DownloadIcon className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
