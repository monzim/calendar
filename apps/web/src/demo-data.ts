import type { CalendarEvent, RoutineInput } from "@monzim/calendar";

export interface CourseMeta {
  courseCode: string;
  roomId: string;
}

/**
 * The original v1 fixture, re-expressed in the generic `RoutineInput` model:
 * faculty → `actors`, roomID → `location` + `meta`, course code → `meta`.
 */
export const routines: RoutineInput<CourseMeta>[] = [
  {
    id: "cse201",
    title: "Intro to Artificial Intelligence",
    schedule: { Monday: { start: "09:30", end: "12:00" } },
    location: "Room 101",
    color: "#0ea5e9",
    actors: [
      {
        id: "f_smith",
        name: "Dr. Alex Smith",
        email: "alex.smith@university.edu",
        avatarUrl: "https://i.pravatar.cc/150?img=15",
        role: "instructor",
      },
    ],
    meta: { courseCode: "CSE201", roomId: "101" },
  },
  {
    id: "cse202",
    title: "Machine Learning",
    schedule: {
      Thursday: { start: "12:00", end: "15:00" },
      Sunday: { start: "15:30", end: "17:30" },
    },
    location: "Room 102",
    color: "#f97316",
    actors: [
      {
        id: "f_johnson",
        name: "Dr. Emily Johnson",
        email: "emily.johnson@university.edu",
        avatarUrl: "https://i.pravatar.cc/150?img=20",
        role: "instructor",
      },
    ],
    meta: { courseCode: "CSE202", roomId: "102" },
  },
  {
    id: "cse203",
    title: "Neural Networks",
    schedule: {
      Wednesday: { start: "16:00", end: "18:00" },
      Friday: { start: "12:30", end: "14:30" },
    },
    location: "Room 103",
    color: "#8b5cf6",
    actors: [
      {
        id: "f_lee",
        name: "Dr. Michael Lee",
        email: "michael.lee@university.edu",
        avatarUrl: "https://i.pravatar.cc/150?img=25",
        role: "instructor",
      },
    ],
    meta: { courseCode: "CSE203", roomId: "103" },
  },
  {
    id: "cse204",
    title: "Deep Learning",
    // Deliberately overlaps Monday AI to showcase lane-packing.
    schedule: { Monday: { start: "10:30", end: "12:30" }, Saturday: { start: "09:00", end: "10:00" } },
    location: "Room 104",
    color: "#10b981",
    actors: [
      {
        id: "f_brown",
        name: "Dr. Sarah Brown",
        email: "sarah.brown@university.edu",
        avatarUrl: "https://i.pravatar.cc/150?img=30",
        role: "instructor",
      },
    ],
    meta: { courseCode: "CSE204", roomId: "104" },
  },
];

/** A one-off event, to show non-recurring rendering alongside routines. */
export const oneOffEvents: CalendarEvent<{ courseCode: string }>[] = [
  {
    id: "thesis_defense",
    title: "Thesis Defense",
    start: "2026-07-02T14:00:00",
    end: "2026-07-02T15:30:00",
    timezone: "Asia/Dhaka",
    location: "Room 612",
    color: "#ef4444",
    actors: [
      { id: "f_smith", name: "Dr. Alex Smith", role: "supervisor" },
      { name: "Emily Johnson", role: "examiner" },
    ],
    meta: { courseCode: "CSE499" },
  },
];
