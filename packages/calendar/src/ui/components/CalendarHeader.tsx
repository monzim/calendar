"use client";

import type { CalendarViewType } from "../../core/types";
import { Button } from "../primitives/button";
import { cn } from "../lib/cn";
import { ChevronLeft, ChevronRight, DownloadIcon } from "./icons";

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
    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={onPrev} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onNext} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onToday}>
          Today
        </Button>
        <h2 className="ml-2 text-base font-semibold tracking-tight">{label}</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-md border p-0.5">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                v === view
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
        {onExport ? (
          <Button variant="outline" size="sm" onClick={onExport}>
            <DownloadIcon className="h-3.5 w-3.5" />
            .ics
          </Button>
        ) : null}
      </div>
    </div>
  );
}
