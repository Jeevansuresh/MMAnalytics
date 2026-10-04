import Link from "next/link";
export default function NotFound() {
  return (
    <main className="message-state" id="main-content">
      <h1>That page isn’t in this workspace.</h1>
      <Link href="/overview" className="text-link">
        Return to overview →
      </Link>
    </main>
  );
}
