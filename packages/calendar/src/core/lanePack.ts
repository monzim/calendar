import type { EventOccurrence } from "./types";

export interface PackedOccurrence<TMeta = Record<string, unknown>> {
  occurrence: EventOccurrence<TMeta>;
  /** Zero-based column index within the overlap cluster. */
  lane: number;
  /** Total columns in this occurrence's overlap cluster. */
  laneCount: number;
}

/**
 * Lane-pack overlapping occurrences so they render side by side.
 *
 * Occurrences are grouped into maximal overlap clusters; within a cluster each
 * is greedily assigned the first free column, and every member shares the
 * cluster's column count (so width = 1 / laneCount). Fixes v1's overlap bug.
 */
export function lanePack<TMeta = Record<string, unknown>>(
  occurrences: EventOccurrence<TMeta>[],
): PackedOccurrence<TMeta>[] {
  const sorted = [...occurrences].sort((a, b) => {
    const ds = a.start.getTime() - b.start.getTime();
    return ds !== 0 ? ds : b.end.getTime() - a.end.getTime();
  });

  const result: PackedOccurrence<TMeta>[] = [];
  let cluster: PackedOccurrence<TMeta>[] = [];
  let clusterEnd = -Infinity;
  // Each lane tracks the end time of its last placed occurrence.
  let laneEnds: number[] = [];

  const flush = () => {
    const laneCount = laneEnds.length || 1;
    for (const item of cluster) item.laneCount = laneCount;
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
    clusterEnd = -Infinity;
  };

  for (const occ of sorted) {
    const start = occ.start.getTime();
    const end = occ.end.getTime();

    // New cluster when this occurrence starts at/after everything so far ends.
    if (start >= clusterEnd && cluster.length > 0) flush();

    // First lane whose previous occurrence has ended.
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }

    cluster.push({ occurrence: occ, lane, laneCount: 1 });
    clusterEnd = Math.max(clusterEnd, end);
  }
  if (cluster.length > 0) flush();

  return result;
}
