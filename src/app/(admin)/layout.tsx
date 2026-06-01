import { AdminShell } from "@/components/admin/admin-shell";
import { AppProviders } from "@/lib/query-client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AdminShell>{children}</AdminShell>
    </AppProviders>
  );
}
