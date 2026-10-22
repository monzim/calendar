"use client";

import type { ReactNode } from "react";
import type { CalendarViewType } from "../../core/types";
import { Button } from "../primitives/button";
import { ToggleGroup, ToggleGroupItem } from "../primitives/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../primitives/dropdown-menu";
import { ChevronDown, ChevronLeft, ChevronRight, DownloadIcon, PrinterIcon } from "./icons";

const VIEW_LABELS: Record<CalendarViewType, string> = {
  today: "Today",
  day: "Day",
  week: "Week",
  month: "Month",
  agenda: "Agenda",
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
  onPrint?: () => void;
  /** Extra controls rendered before the built-in action buttons. */
  actions?: ReactNode;
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
  onPrint,
  actions,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-3 py-3 sm:px-4 print:py-2">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <Button variant="outline" size="sm" onClick={onToday} className="gcal-print-hide hidden px-3.5 sm:inline-flex">
          Today
        </Button>
        <div className="gcal-print-hide flex items-center">
          <Button variant="ghost" size="icon" onClick={onPrev} aria-label="Previous" className="rounded-full text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext} aria-label="Next" className="rounded-full text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="truncate text-base font-semibold tracking-tight tabular-nums sm:text-lg">
          {label}
        </h2>
      </div>

      <div className="gcal-print-hide flex items-center gap-2">
        {actions}
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

        {onPrint ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrint}
            aria-label="Print"
            title="Print"
            className="text-muted-foreground hover:text-foreground"
          >
            <PrinterIcon className="h-4 w-4" />
          </Button>
        ) : null}
        {onExport ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onExport}
            aria-label="Export .ics"
            title="Export .ics"
            className="text-muted-foreground hover:text-foreground"
          >
            <DownloadIcon className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
