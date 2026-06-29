"use client";

export { Calendar, type CalendarProps } from "./Calendar";
export { GoogleCalendarWeekly } from "./GoogleCalendarWeekly";

// Sub-components, exposed for power users composing custom layouts.
export { CalendarHeader, type CalendarHeaderProps } from "./components/CalendarHeader";
export { TimeGrid, type TimeGridProps } from "./components/TimeGrid";
export { EventCard, type EventCardProps } from "./components/EventCard";
export { NowIndicator, type NowIndicatorProps } from "./components/NowIndicator";
export { MonthView, type MonthViewProps } from "./views/MonthView";

// Vendored primitives.
export { Avatar, AvatarImage, AvatarFallback } from "./primitives/avatar";
export { Badge, badgeVariants } from "./primitives/badge";
export { Button, buttonVariants } from "./primitives/button";
export { Card, CardContent } from "./primitives/card";
export { cn } from "./lib/cn";
