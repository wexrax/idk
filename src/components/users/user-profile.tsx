"use client";

import { useQuery } from "@tanstack/react-query";
import { ChurnRiskBadge, UserStatusBadge } from "@/components/ui/status-badge";
import { getUser } from "@/lib/api/client";
import { formatCurrencyRub, formatPercent } from "@/lib/utils";
import { UserActions } from "./user-actions";

export function UserProfile({ userId }: { userId: string }) {
  const user = useQuery({
    queryFn: () => getUser(userId),
    queryKey: ["user", userId],
  });

  if (user.isPending) {
    return <p className="text-sm text-text-secondary">Загрузка карточки...</p>;
  }

  if (!user.data) {
    return <p className="text-sm text-danger">Пользователь не найден</p>;
  }

  const profile = user.data.data;

  return (
    <div className="space-y-4">
      <section className="admin-panel p-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <h1 className="text-[22px] font-bold tracking-normal text-white">{profile.name}</h1>
            <p className="text-text-secondary">{profile.email}</p>
          </div>
          <div className="flex gap-2">
            <UserStatusBadge status={profile.status} />
            <ChurnRiskBadge risk={profile.churn_risk} />
          </div>
        </div>
        <dl className="mt-6 grid gap-4 md:grid-cols-4">
          <div>
            <dt className="text-sm text-text-secondary">MRR</dt>
            <dd>{formatCurrencyRub(profile.mrr)}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Баллы</dt>
            <dd>{profile.points_balance}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Отток</dt>
            <dd>{formatPercent(profile.churn_probability)}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Страна</dt>
            <dd>{profile.country}</dd>
          </div>
        </dl>
      </section>
      <UserActions userId={userId} />
    </div>
  );
}
