const PRINT_HOST = "gcal-print-host";
const PRINT_MODE = "gcal-print-mode";
// Usable height of a landscape page (smaller of A4 / US Letter) inside the 10mm
// margins, in CSS px.
const PAGE_HEIGHT_PX = 718;
// Shrink to one page only when the overflow is modest; long agendas paginate.
const MIN_FIT_SCALE = 0.6;

/**
 * Print just one calendar. A static snapshot of `element` is mounted in its own
 * host under <body>, always in the light theme; the `@media print` rules in
 * styles.css hide everything else, unclip the scroll containers and print it on
 * a landscape page with event colors kept, shrunk to one page when it's close.
 * Cleaned up after the print dialog closes. No-op outside the browser.
 */
export function printCalendar(element: HTMLElement | null): void {
  if (!element || typeof window === "undefined") return;
  const html = document.documentElement;

  const host = document.createElement("div");
  host.className = PRINT_HOST;
  const snapshot = element.cloneNode(true) as HTMLElement;
  // Paper is white: the host sits outside any `.dark` ancestor, and a root-level
  // `.dark` is dropped, so the light tokens apply.
  snapshot.classList.remove("dark");
  // Approximate the printed height: the screen height minus top-level rows that
  // print hides (the legend). Then zoom down to fit one page when it's close.
  let printedHeight = element.scrollHeight;
  for (const child of Array.from(element.children)) {
    if (child.classList.contains("gcal-print-hide")) printedHeight -= (child as HTMLElement).offsetHeight;
  }
  const fit = PAGE_HEIGHT_PX / printedHeight;
  if (fit < 1 && fit >= MIN_FIT_SCALE) snapshot.style.zoom = fit.toFixed(3);
  host.appendChild(snapshot);
  document.body.appendChild(host);
  html.classList.add(PRINT_MODE);

  const cleanup = () => {
    host.remove();
    html.classList.remove(PRINT_MODE);
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}
