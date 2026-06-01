import type { Metadata } from "next";
import { LoginClient } from "@/components/auth/login-client";

export const metadata: Metadata = {
  title: "Вход в SubHub",
  description: "Безопасный вход в админ-консоль SubHub",
};

export default function LoginPage() {
  return <LoginClient />;
}

