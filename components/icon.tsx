import type { CSSProperties } from "react";
export type IconName =
  | "overview"
  | "campuses"
  | "growth"
  | "sparks"
  | "retention"
  | "arrow"
  | "sun"
  | "moon"
  | "calendar"
  | "chevron"
  | "logout"
  | "info"
  | "retry"
  | "filter"
  | "users"
  | "close";
const paths: Record<IconName, string> = {
  overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  campuses:
    "M3 21h18 M5 21V8l7-5 7 5v13 M9 21v-5h6v5 M8 10h1 M15 10h1 M8 13h1 M15 13h1",
  growth: "M3 17l6-6 4 4 8-11 M15 4h6v6 M3 21h18",
  sparks: "M13 2L4 14h7l-1 8 10-13h-7z",
  retention: "M3 12a9 9 0 1 0 3-6 M3 3v5h5 M12 7v5l3 2",
  arrow: "M6 18L18 6 M6 6h12v12",
  sun: "M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1.5 1.5 M17.5 17.5L19 19 M5 19l1.5-1.5 M17.5 6.5L19 5 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10",
  calendar: "M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16",
  chevron: "M7 10l5 5 5-5",
  logout: "M9 3H4v18h5 M14 8l5 4-5 4 M8 12h11",
  info: "M12 16v-4 M12 8h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  retry: "M3 11a9 9 0 1 1 2 7 M3 4v7h7",
  filter: "M3 5h18L14 13v6l-4 2v-8z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.9",
  close: "M6 6l12 12 M6 18L18 6",
};
export function Icon({
  name,
  size = 18,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 18V6l5 7 4-7 4 7 5-7v12"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          d="M9 18h6"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
