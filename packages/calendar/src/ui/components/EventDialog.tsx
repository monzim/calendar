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
import { CalendarIcon, ClockIcon, DownloadIcon, ExternalLink, MapPin } from "./icons";

export interface EventDialogProps {
  occurrence: EventOccurrence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeZone?: TimeZone;
}

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

function openUrl(url: string) {
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
}

export function EventDialog({ occurrence, open, onOpenChange, timeZone }: EventDialogProps) {
  const event = occurrence?.event as CalendarEvent | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {occurrence && event ? (
          <>
            <DialogHeader>
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
                  style={event.color ? { backgroundColor: event.color } : undefined}
                />
                <DialogTitle>{event.title}</DialogTitle>
              </span>
              {event.calendarId ? (
                <DialogDescription>{event.calendarId}</DialogDescription>
              ) : null}
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
                  <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground">
                    repeats
                  </span>
                ) : null}
              </Row>
              {event.location ? (
                <Row icon={<MapPin className="h-4 w-4" />}>{event.location}</Row>
              ) : null}
              {event.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
              ) : null}

              {event.actors?.length ? (
                <div className="flex flex-col gap-2 border-t pt-3">
                  {event.actors.map((actor, i) => (
                    <div key={actor.id ?? actor.email ?? i} className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
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

            <DialogFooter className="border-t pt-3">
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
