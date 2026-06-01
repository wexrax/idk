import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import SmartAnalyticsPage from "@/app/(admin)/smart-analytics/page";

function renderSmartAnalyticsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SmartAnalyticsPage />
    </QueryClientProvider>,
  );
}

describe("SmartAnalyticsPage", () => {
  it("renders fetched what-if builder, ML churn prediction, and scenario table", async () => {
    renderSmartAnalyticsPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Умная аналитика" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What-if сценарий" })).toBeInTheDocument();
    expect(screen.getByText("ML-прогноз оттока")).toBeInTheDocument();
    expect(screen.getByText("91% уверенность")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Сценарий" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Прогноз MRR" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Premium \+8%/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Риск оттока" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Автоматизации" })).toBeInTheDocument();
  });

  it("calculates a pricing scenario", async () => {
    const user = userEvent.setup();

    renderSmartAnalyticsPage();
    await screen.findByRole("heading", { level: 1, name: "Умная аналитика" });

    await user.clear(screen.getByLabelText("Изменение цены, %"));
    await user.type(screen.getByLabelText("Изменение цены, %"), "12");
    await user.clear(screen.getByLabelText("Дельта оттока, п.п."));
    await user.type(screen.getByLabelText("Дельта оттока, п.п."), "0.6");
    await user.selectOptions(screen.getByLabelText("Тариф"), "Family");
    await user.click(screen.getByLabelText("Рассчитать сценарий"));

    expect(screen.getByText("Сценарий Family +12% рассчитан")).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Family \+12%/ })).toBeInTheDocument();
  });

  it("shows validation errors for out-of-range scenario inputs", async () => {
    const user = userEvent.setup();

    renderSmartAnalyticsPage();
    await screen.findByRole("heading", { level: 1, name: "Умная аналитика" });

    await user.clear(screen.getByLabelText("Изменение цены, %"));
    await user.type(screen.getByLabelText("Изменение цены, %"), "120");
    await user.clear(screen.getByLabelText("Дельта оттока, п.п."));
    await user.type(screen.getByLabelText("Дельта оттока, п.п."), "8");
    await user.click(screen.getByLabelText("Рассчитать сценарий"));

    expect(screen.getByText("Изменение цены не может превышать 100%")).toBeInTheDocument();
    expect(screen.getByText("Дельта оттока не может превышать 5 п.п.")).toBeInTheDocument();
  });

  it("opens ML churn-risk detail and launches automation preview", async () => {
    const user = userEvent.setup();

    renderSmartAnalyticsPage();
    await screen.findByRole("heading", { level: 1, name: "Умная аналитика" });

    await user.click(screen.getByRole("button", { name: "Риск оттока" }));
    await user.click(screen.getByRole("row", { name: /Premium без годового плана/ }));

    const riskPanel = screen.getByTestId("risk-detail-panel");
    expect(within(riskPanel).getByText("Premium без годового плана")).toBeInTheDocument();
    expect(within(riskPanel).getByText("Вероятность оттока")).toBeInTheDocument();
    expect(within(riskPanel).getByText("82%")).toBeInTheDocument();
    expect(within(riskPanel).getByText("91%")).toBeInTheDocument();
    expect(within(riskPanel).getByText("ежемесячное продление")).toBeInTheDocument();
    expect(
      within(riskPanel).getByText("Рекомендуемое действие: предложить годовую скидку"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Автоматизации" }));
    await user.click(screen.getByRole("button", { name: "Запустить превью" }));

    expect(screen.getByText("Превью Автоматизация возврата готово")).toBeInTheDocument();
  });
});
