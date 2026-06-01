import type { ChurnRisk, UserStatus } from "@/lib/api/contracts";
import { StatusChip } from "./admin-primitives";

const userStatusLabel: Record<UserStatus, string> = {
  active: "Активен",
  blocked: "Заблокирован",
  frozen: "Заморожен",
  trial: "Trial",
};

const churnRiskLabel: Record<ChurnRisk, string> = {
  high: "Высокий",
  low: "Низкий",
  medium: "Средний",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const tone =
    status === "active" ? "success" : status === "blocked" ? "danger" : "muted";

  return <StatusChip tone={tone}>{userStatusLabel[status]}</StatusChip>;
}

export function ChurnRiskBadge({ risk }: { risk: ChurnRisk }) {
  const tone = risk === "high" ? "danger" : risk === "medium" ? "warning" : "success";

  return <StatusChip tone={tone}>{churnRiskLabel[risk]}</StatusChip>;
}
