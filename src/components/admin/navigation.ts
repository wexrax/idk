import {
  BarChart3,
  Bell,
  CreditCard,
  Gauge,
  Gift,
  Lock,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AdminRole = "admin" | "analyst" | "finance" | "marketer" | "support";

type AdminNavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  roles: AdminRole[];
};

export const adminNavigation: AdminNavigationItem[] = [
  {
    href: "/dashboard",
    icon: Gauge,
    label: "Дашборд",
    roles: ["admin", "finance", "support", "analyst"],
  },
  {
    href: "/users",
    icon: Users,
    label: "Пользователи",
    roles: ["admin", "support"],
  },
  {
    href: "/subscriptions",
    icon: CreditCard,
    label: "Подписки",
    roles: ["admin", "finance", "support"],
  },
  {
    href: "/marketing",
    icon: Bell,
    label: "Маркетинг",
    roles: ["admin", "marketer"],
  },
  {
    href: "/gamification",
    icon: Gift,
    label: "Геймификация",
    roles: ["admin", "marketer"],
  },
  {
    href: "/analytics",
    icon: BarChart3,
    label: "Аналитика",
    roles: ["admin", "marketer", "analyst"],
  },
  {
    href: "/smart-analytics",
    icon: Sparkles,
    label: "Умная аналитика",
    roles: ["admin", "analyst"],
  },
  {
    href: "/security",
    icon: Lock,
    label: "Безопасность",
    roles: ["admin"],
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Настройки",
    roles: ["admin"],
  },
];
