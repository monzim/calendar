"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UseCalendarReturn } from "./types";

const CalendarContext = createContext<UseCalendarReturn<any> | null>(null);

export interface CalendarProviderProps {
  value: UseCalendarReturn<any>;
  children: ReactNode;
}

export function CalendarProvider({ value, children }: CalendarProviderProps) {
  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

/** Access the calendar state provided by the nearest `CalendarProvider`. */
export function useCalendarContext<TMeta = Record<string, unknown>>(): UseCalendarReturn<TMeta> {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error("useCalendarContext must be used within a <CalendarProvider>");
  }
  return ctx as UseCalendarReturn<TMeta>;
}
