"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { blockUser, grantPoints } from "@/lib/api/client";

export function UserActions({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("Нарушение правил сервиса");
  const [amount, setAmount] = useState(100);

  const block = useMutation({
    mutationFn: () => blockUser(userId, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user", userId] }),
  });
  const grant = useMutation({
    mutationFn: () => grantPoints(userId, { amount, comment: "Компенсация от поддержки" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user", userId] }),
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <form
        className="admin-panel p-4"
        onSubmit={(event) => {
          event.preventDefault();
          block.mutate();
        }}
      >
        <label className="text-sm text-text-secondary" htmlFor="block-reason">
          Причина блокировки
        </label>
        <input
          className="mt-2 h-10 w-full admin-panel-elevated px-3 text-sm outline-none"
          id="block-reason"
          onChange={(event) => setReason(event.target.value)}
          value={reason}
        />
        <button
          className="mt-3 h-10 rounded-md bg-danger px-4 text-sm text-white disabled:opacity-60"
          disabled={block.isPending}
          type="submit"
        >
          Заблокировать
        </button>
      </form>
      <form
        className="admin-panel p-4"
        onSubmit={(event) => {
          event.preventDefault();
          grant.mutate();
        }}
      >
        <label className="text-sm text-text-secondary" htmlFor="grant-points">
          Начислить баллы
        </label>
        <input
          className="mt-2 h-10 w-full admin-panel-elevated px-3 text-sm outline-none"
          id="grant-points"
          min={1}
          onChange={(event) => setAmount(Number(event.target.value))}
          type="number"
          value={amount}
        />
        <button
          className="mt-3 h-10 rounded-md bg-brand-primary px-4 text-sm text-white disabled:opacity-60"
          disabled={grant.isPending}
          type="submit"
        >
          Начислить
        </button>
      </form>
    </div>
  );
}
