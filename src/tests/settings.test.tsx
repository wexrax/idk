import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import SettingsPage from "@/app/(admin)/settings/page";

function renderSettingsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SettingsPage />
    </QueryClientProvider>,
  );
}

describe("SettingsPage", () => {
  it("renders fetched general settings, metrics, and configuration table", async () => {
    renderSettingsPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Настройки" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Системные настройки" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Раздел" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Значение" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Валюта отчётов.*RUB/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Интеграции" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Оповещения" })).toBeInTheDocument();
  });

  it("publishes validated general settings", async () => {
    const user = userEvent.setup();

    renderSettingsPage();

    await screen.findByRole("heading", { level: 1, name: "Настройки" });
    await user.selectOptions(screen.getByLabelText("Среда"), "Production");
    await user.selectOptions(screen.getByLabelText("Валюта отчётов"), "USD");
    await user.clear(screen.getByLabelText("SLA поддержки, часы"));
    await user.type(screen.getByLabelText("SLA поддержки, часы"), "6");
    await user.click(screen.getByRole("button", { name: "Сохранить настройки" }));

    expect(
      await screen.findByText("Настройки Продакшен - USD опубликованы"),
    ).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /SLA поддержки.*6 ч\./ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Валюта отчётов.*USD.*Опубликовано/ })).toBeInTheDocument();
  });

  it("shows validation for invalid support SLA and alert threshold", async () => {
    const user = userEvent.setup();

    renderSettingsPage();

    await screen.findByRole("heading", { level: 1, name: "Настройки" });
    await user.clear(screen.getByLabelText("SLA поддержки, часы"));
    await user.type(screen.getByLabelText("SLA поддержки, часы"), "0");
    await user.click(screen.getByRole("button", { name: "Сохранить настройки" }));
    expect(screen.getByText("SLA поддержки должен быть не меньше 1 часа")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Оповещения" }));
    await user.clear(screen.getByLabelText("Аномалия оттока, %"));
    await user.type(screen.getByLabelText("Аномалия оттока, %"), "120");
    await user.click(screen.getByRole("button", { name: "Обновить порог" }));
    expect(screen.getByText("Порог оттока не может превышать 100%")).toBeInTheDocument();
  });

  it("checks an integration and updates alert threshold", async () => {
    const user = userEvent.setup();

    renderSettingsPage();

    await screen.findByRole("heading", { level: 1, name: "Настройки" });
    await user.click(screen.getByRole("button", { name: "Интеграции" }));
    await user.click(screen.getByRole("button", { name: "Проверить интеграцию Stripe" }));
    expect(screen.getByText("Stripe проверена: задержка webhook 180 ms")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Оповещения" }));
    await user.clear(screen.getByLabelText("Аномалия оттока, %"));
    await user.type(screen.getByLabelText("Аномалия оттока, %"), "5.8");
    await user.click(screen.getByRole("button", { name: "Обновить порог" }));

    expect(screen.getByText("Порог аномалии оттока обновлён до 5.8%")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Аномалия оттока.*5.8%/ })).toBeInTheDocument();
  });
});
