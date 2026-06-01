import { SubscriptionsClient } from "@/components/subscriptions/subscriptions-client";
import { PageHeader } from "@/components/ui/admin-primitives";

export default function SubscriptionsPage() {
  return (
    <main className="space-y-6 px-4 py-6 lg:px-6">
      <PageHeader
        description="Управление тарифами, подписчиками, ручными операциями и платежными событиями до подключения FastAPI backend."
        eyebrow="Billing operations"
        title="Управление подписками"
      />
      <SubscriptionsClient />
    </main>
  );
}
