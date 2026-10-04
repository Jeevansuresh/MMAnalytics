import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "MManalytics | Mad Monkey AI",
  description:
    "Campus growth, engagement, and retention. A frontend analytics preview.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
