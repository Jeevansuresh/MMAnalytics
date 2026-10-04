// Frozen preview clock keeps screenshots and period comparisons reproducible.
export const PREVIEW_END = "2026-10-04";
export function presetRange(days: number) {
  const start = new Date(`${PREVIEW_END}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { from: start.toISOString().slice(0, 10), to: PREVIEW_END };
}
