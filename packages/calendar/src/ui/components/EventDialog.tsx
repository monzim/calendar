"use client";

import type { ReactNode } from "react";
import { format } from "date-fns";
import { actorInitials } from "../../core/helpers";
import { downloadICS } from "../../core/ics";
import { toDisplay } from "../../core/timezone";
import { toGoogleCalendarUrl, toOutlookUrl } from "../../core/urls";
import type { CalendarEvent, EventOccurrence, TimeZone } from "../../core/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../primitives/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "../primitives/avatar";
import { Button } from "../primitives/button";
import { eventStyle } from "../lib/eventStyle";
import { CalendarIcon, ClockIcon, DownloadIcon, ExternalLink, MapPin } from "./icons";

export interface EventDialogProps {
  occurrence: EventOccurrence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeZone?: TimeZone;
  /** Extra section rendered under the built-in details (course code, notes, links…). */
  renderDetails?: (occurrence: EventOccurrence<any>) => ReactNode;
  /** Replace the whole dialog body. The dialog shell (overlay, close button, a11y title) stays. */
  renderContent?: (occurrence: EventOccurrence<any>, helpers: { close: () => void }) => ReactNode;
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

function openUrl(url: string) {
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
}

export function EventDialog({
  occurrence,
  open,
  onOpenChange,
  timeZone,
  renderDetails,
  renderContent,
}: EventDialogProps) {
  const event = occurrence?.event as CalendarEvent | undefined;

  if (renderContent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent style={eventStyle(event?.color)}>
          <DialogTitle className="sr-only">{event?.title ?? "Event"}</DialogTitle>
          {occurrence ? renderContent(occurrence, { close: () => onOpenChange(false) }) : null}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={eventStyle(event?.color)} className="overflow-hidden pt-6">
        {occurrence && event ? (
          <>
            {/* Color band tying the dialog to the event block it opened from */}
            <span aria-hidden className="gcal-event-dot absolute inset-x-0 top-0 h-1.5" />
            <DialogHeader>
              <span className="flex items-start gap-3">
                <span aria-hidden className="gcal-event-dot mt-1 h-3.5 w-3.5 shrink-0 rounded" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <DialogTitle className="text-lg">{event.title}</DialogTitle>
                  {event.calendarId ? (
                    <DialogDescription>{event.calendarId}</DialogDescription>
                  ) : null}
                </span>
              </span>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <Row icon={<CalendarIcon className="h-4 w-4" />}>
                {format(toDisplay(occurrence.start, timeZone), "EEEE, MMMM d, yyyy")}
              </Row>
              <Row icon={<ClockIcon className="h-4 w-4" />}>
                {occurrence.allDay
                  ? "All day"
                  : `${format(toDisplay(occurrence.start, timeZone), "h:mm a")} – ${format(
                      toDisplay(occurrence.end, timeZone),
                      "h:mm a",
                    )}`}
                {occurrence.isRecurring ? (
                  <span className="gcal-event ml-2 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium">
                    Repeats
                  </span>
                ) : null}
              </Row>
              {event.location ? (
                <Row icon={<MapPin className="h-4 w-4" />}>{event.location}</Row>
              ) : null}
              {event.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
              ) : null}

              {renderDetails ? <div className="min-w-0">{renderDetails(occurrence)}</div> : null}

              {event.actors?.length ? (
                <div className="flex flex-col gap-2.5 border-t pt-4">
                  {event.actors.map((actor, i) => (
                    <div key={actor.id ?? actor.email ?? i} className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        {actor.avatarUrl ? <AvatarImage src={actor.avatarUrl} alt={actor.name ?? ""} /> : null}
                        <AvatarFallback>{actorInitials(actor)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium leading-tight">
                          {actor.name ?? actor.email ?? "Unknown"}
                        </div>
                        {actor.role ? (
                          <div className="truncate text-xs text-muted-foreground">{actor.role}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <DialogFooter className="-mx-5 -mb-5 mt-1 items-center border-t bg-muted/40 px-5 py-3 sm:justify-between">
              <span className="hidden text-xs font-medium text-muted-foreground sm:inline">Add to calendar</span>
              <span className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="ghost" size="sm" onClick={() => openUrl(toGoogleCalendarUrl(event))}>
                <ExternalLink className="h-3.5 w-3.5" />
                Google
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openUrl(toOutlookUrl(event))}>
                <ExternalLink className="h-3.5 w-3.5" />
                Outlook
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadICS([event], `${event.title}.ics`)}>
                <DownloadIcon className="h-3.5 w-3.5" />
                .ics
              </Button>
              </span>
            </DialogFooter>
          </>
        ) : (
          <DialogHeader>
            <DialogTitle>Event</DialogTitle>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}
