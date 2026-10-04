import { AppProvider } from "@/components/app-provider";
import { DashboardShell } from "@/components/dashboard-shell";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <DashboardShell>{children}</DashboardShell>
    </AppProvider>
  );
}
