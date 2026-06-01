"use client";

import { ArrowRight, BadgeCheck, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { login, verify2fa } from "@/lib/api/auth-client";
import { authEndpoints } from "@/lib/api/auth-contracts";
import { cn } from "@/lib/utils";

type AuthStep = "credentials" | "totp";

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [step, setStep] = useState<AuthStep>("credentials");
  const [rememberDevice, setRememberDevice] = useState(true);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCredentialsReady = email.includes("@") && password.length >= 6;
  const isTotpReady = /^\d{6}$/.test(totp);
  const maskedEmail = useMemo(() => {
    const [name, domain] = email.split("@");

    if (!name || !domain) {
      return "admin@subhub.app";
    }

    return `${name.slice(0, 2)}***@${domain}`;
  }, [email]);

  async function handleCredentialsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isCredentialsReady) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await login({ email, password });

      if (response.requires_2fa && response.temp_token) {
        setTempToken(response.temp_token);
        setStep("totp");
        return;
      }

      if (response.access_token) {
        router.replace("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTotpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isTotpReady || !tempToken) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await verify2fa({ code: totp, temp_token: tempToken });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "2FA verification failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-base text-text-primary">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25"
      />
      <div aria-hidden className="absolute left-1/2 top-[-14rem] size-[34rem] -translate-x-1/2 rounded-full bg-brand-primary/14 blur-3xl" />
      <div aria-hidden className="absolute bottom-[-16rem] right-[-10rem] size-[30rem] rounded-full bg-info/12 blur-3xl" />

      <section className="relative flex min-h-screen items-center justify-center px-4 py-6">
        <div className="admin-panel w-full max-w-[30rem] p-5 md:p-6">
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <div className="flex items-center gap-3">
              <div className="admin-gradient grid size-10 place-items-center rounded-lg text-white shadow-lg shadow-brand-primary/25">
                <ShieldCheck aria-hidden className="size-5" />
              </div>
              <div>
                <p className="text-base font-bold text-white">SubHub</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-disabled">
                  Admin Console
                </p>
              </div>
            </div>
            <span className="rounded-full border border-success/25 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              Secure area
            </span>
          </div>

          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-disabled">
                {step === "credentials" ? "Step 01" : "Step 02"}
              </p>
              <h1 className="mt-2 text-2xl font-extrabold text-white">
                {step === "credentials" ? "Вход в систему" : "Подтверждение 2FA"}
              </h1>
            </div>
            <span
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-bold",
                step === "credentials"
                  ? "border-brand-primary/30 bg-brand-primary/15 text-brand-primary"
                  : "border-success/30 bg-success/10 text-success",
              )}
            >
              {step === "credentials" ? "Login" : "TOTP"}
            </span>
          </div>

          {step === "credentials" ? (
            <form className="space-y-4" onSubmit={handleCredentialsSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text-secondary">Email</span>
                <span className="admin-focus flex h-12 items-center gap-3 rounded-lg border border-white/[0.08] bg-bg-elevated px-3 focus-within:border-brand-primary/55">
                  <Mail aria-hidden className="size-4 text-text-disabled" />
                  <input
                    autoComplete="email"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-text-disabled"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@subhub.app"
                    type="email"
                    value={email}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text-secondary">Пароль</span>
                <span className="admin-focus flex h-12 items-center gap-3 rounded-lg border border-white/[0.08] bg-bg-elevated px-3 focus-within:border-brand-primary/55">
                  <KeyRound aria-hidden className="size-4 text-text-disabled" />
                  <input
                    autoComplete="current-password"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-text-disabled"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Введите пароль"
                    type="password"
                    value={password}
                  />
                </span>
              </label>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-sm">
                <span className="text-text-secondary">Запомнить это устройство</span>
                <input
                  checked={rememberDevice}
                  className="size-4 accent-brand-primary"
                  onChange={(event) => setRememberDevice(event.target.checked)}
                  type="checkbox"
                />
              </label>

              <button
                className="admin-gradient admin-focus inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold text-white shadow-lg shadow-brand-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!isCredentialsReady || isSubmitting}
                type="submit"
              >
                Продолжить
                <ArrowRight aria-hidden className="size-4" />
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleTotpSubmit}>
              <div className="rounded-lg border border-success/25 bg-success/10 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-success">
                  <BadgeCheck aria-hidden className="size-4" />
                  Пароль принят
                </div>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  Код отправлен в приложение-аутентификатор для {maskedEmail}.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text-secondary">TOTP-код</span>
                <input
                  autoComplete="one-time-code"
                  className="h-14 w-full rounded-lg border border-white/[0.08] bg-bg-elevated px-4 text-center font-mono text-2xl font-bold tracking-[0.34em] text-white outline-none transition focus:border-brand-primary/55"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setTotp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  value={totp}
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <button
                  className="admin-gradient admin-focus inline-flex h-12 items-center justify-center gap-2 rounded-lg text-sm font-bold text-white shadow-lg shadow-brand-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!isTotpReady || isSubmitting}
                  type="submit"
                >
                  Войти
                  <ArrowRight aria-hidden className="size-4" />
                </button>
                <button
                  className="admin-focus h-12 rounded-lg border border-white/[0.08] bg-bg-elevated px-4 text-sm font-semibold text-text-secondary hover:bg-bg-overlay hover:text-white"
                  onClick={() => {
                    setError(null);
                    setStep("credentials");
                  }}
                  type="button"
                >
                  Назад
                </button>
              </div>
            </form>
          )}

          {error ? (
            <div className="mt-4 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
              {error}
            </div>
          ) : null}

          <div className="mt-6 rounded-lg border border-white/[0.08] bg-black/15 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-disabled">
              Next endpoint
            </p>
            <p className="mt-2 font-mono text-xs text-brand-secondary">
              {step === "credentials" ? authEndpoints.login : authEndpoints.verify2fa}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
