import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyRub(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    currency: "RUB",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}
