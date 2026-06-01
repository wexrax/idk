import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SubscriptionsClient } from "@/components/subscriptions/subscriptions-client";

function renderWithQueryClient(children: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  );
}

describe("SubscriptionsClient", () => {
  it("renders tariff rows from the mock API as a workspace", async () => {
    renderWithQueryClient(<SubscriptionsClient />);

    await waitFor(() => expect(screen.getByRole("row", { name: /Plus/ })).toBeInTheDocument());

    expect(screen.getByRole("heading", { name: "Тарифы и подписки" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Новый тариф" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Family/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Legacy 2025/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Цена" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Подписчики" })).toBeInTheDocument();
  });

  it("filters archived tariffs", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<SubscriptionsClient />);

    await waitFor(() => expect(screen.getByRole("row", { name: /Ultimate/ })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Архивные" }));

    expect(screen.getByRole("row", { name: /Legacy 2025/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Plus/ })).not.toBeInTheDocument();
  });

  it("selects, duplicates, and previews a tariff action", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<SubscriptionsClient />);

    await waitFor(() => expect(screen.getByRole("row", { name: /Family/ })).toBeInTheDocument());
    await user.click(screen.getByRole("row", { name: /Family/ }));
    expect(screen.getByRole("heading", { name: "Family" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Дублировать" }));
    expect(screen.getByRole("row", { name: /Family Copy/ })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Операция"), "freeze");
    await user.click(screen.getByRole("button", { name: "Собрать preview операции" }));

    const preview = screen.getByTestId("subscription-operation-preview");
    expect(within(preview).getByText("freeze")).toBeInTheDocument();
    expect(within(preview).getByText("Family Copy")).toBeInTheDocument();
  });

  it("filters transactions, exports reports, and tests payment gateways", async () => {
    const user = userEvent.setup();

    renderWithQueryClient(<SubscriptionsClient />);

    await waitFor(() => expect(screen.getByRole("row", { name: /Plus/ })).toBeInTheDocument());

    expect(screen.getByRole("heading", { name: "Транзакции и финансы" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /txn-1001/ })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Статус транзакции"), "failed");
    expect(screen.getByRole("row", { name: /txn-1002/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /txn-1001/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Отчеты" }));
    await user.click(screen.getByRole("button", { name: "Экспорт PDF" }));
    expect(screen.getByText("PDF export готов: MRR по периодам")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Шлюзы" }));
    await user.click(screen.getByRole("button", { name: "Тест Stripe" }));
    expect(screen.getByText("Тест Stripe отправлен")).toBeInTheDocument();
  });
});
