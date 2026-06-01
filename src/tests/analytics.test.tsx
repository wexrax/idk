import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import AnalyticsPage from "@/app/(admin)/analytics/page";

function renderAnalyticsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AnalyticsPage />
    </QueryClientProvider>,
  );
}

describe("AnalyticsPage", () => {
  it("показывает русские KPI, вкладки и таблицу отчетов", async () => {
    renderAnalyticsPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Аналитика" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Конструктор отчета" })).toBeInTheDocument();
    expect(screen.getAllByText("RUB 12.8M")).toHaveLength(2);
    expect(screen.getByRole("columnheader", { name: "Отчет" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Отток" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Когорты" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Экспорт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Расписание" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Дашборды" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /MRR по тарифам/ })).toBeInTheDocument();
  });

  it("создает отчет с выбранным периодом и сегментом", async () => {
    const user = userEvent.setup();

    renderAnalyticsPage();

    await screen.findByRole("heading", { level: 1, name: "Аналитика" });
    await user.selectOptions(screen.getByLabelText("Период"), "90 дней");
    await user.selectOptions(screen.getByLabelText("Сегмент"), "family");
    await user.selectOptions(screen.getByLabelText("Тип отчета"), "Revenue");
    await user.click(screen.getByRole("button", { name: "Собрать отчет" }));

    expect(
      screen.getByText('Отчет "Выручка" по сегменту "Family" за период "90 дней" готов'),
    ).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Выручка - Family/ })).toBeInTheDocument();
  });

  it("показывает валидацию для короткого пользовательского сегмента", async () => {
    const user = userEvent.setup();

    renderAnalyticsPage();

    await screen.findByRole("heading", { level: 1, name: "Аналитика" });
    await user.selectOptions(screen.getByLabelText("Сегмент"), "custom");
    fireEvent.change(screen.getByLabelText("Свой сегмент"), {
      target: { value: "AB" },
    });
    await user.click(screen.getByRole("button", { name: "Собрать отчет" }));

    expect(screen.getByText("Сегмент должен быть не короче 3 символов")).toBeInTheDocument();
  });

  it("открывает детализацию когорты", async () => {
    const user = userEvent.setup();

    renderAnalyticsPage();

    await screen.findByRole("heading", { level: 1, name: "Аналитика" });
    await user.click(screen.getByRole("button", { name: "Когорты" }));
    await user.click(screen.getByRole("row", { name: /Мартовская когорта/ }));

    const cohortPanel = screen.getByTestId("cohort-detail-panel");
    expect(within(cohortPanel).getByText("Мартовская когорта")).toBeInTheDocument();
    expect(
      within(cohortPanel).getByText("Рекомендация: Усилить видимость годового оффера"),
    ).toBeInTheDocument();
  });

  it("ставит CSV, PDF и Excel экспорт в очередь", async () => {
    const user = userEvent.setup();

    renderAnalyticsPage();

    await screen.findByRole("heading", { level: 1, name: "Аналитика" });
    await user.click(screen.getByRole("button", { name: "Экспорт" }));

    await user.click(screen.getByRole("button", { name: "Подготовить CSV" }));
    expect(screen.getByText("Экспорт CSV поставлен в очередь")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Подготовить PDF" }));
    expect(screen.getByText("Экспорт PDF поставлен в очередь")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Подготовить Excel" }));
    expect(screen.getByText("Экспорт Excel поставлен в очередь")).toBeInTheDocument();
    expect(screen.getAllByText("В очереди").length).toBeGreaterThanOrEqual(3);
  });

  it("показывает расписания и создает новую почтовую отправку", async () => {
    const user = userEvent.setup();

    renderAnalyticsPage();

    await screen.findByRole("heading", { level: 1, name: "Аналитика" });
    await user.click(screen.getByRole("button", { name: "Расписание" }));

    expect(screen.getByRole("heading", { name: "Расписание почтовых отчетов" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Еженедельная сводка удержания/ })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Название расписания"), {
      target: { value: "Ежедневный отчет по выручке" },
    });
    fireEvent.change(screen.getByLabelText("Почта получателя"), {
      target: { value: "revenue@subhub.local" },
    });
    await user.selectOptions(screen.getByLabelText("Частота"), "daily");
    await user.selectOptions(screen.getByLabelText("Формат расписания"), "CSV");
    await user.click(screen.getByRole("button", { name: "Создать расписание" }));

    expect(screen.getByText('Расписание "Ежедневный отчет по выручке" создано')).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /Ежедневный отчет по выручке/ });
    expect(within(row).getByText("revenue@subhub.local")).toBeInTheDocument();
    expect(within(row).getByText("Ежедневно")).toBeInTheDocument();
    expect(within(row).getByText("CSV")).toBeInTheDocument();
  });

  it("показывает ошибки валидации расписания", async () => {
    const user = userEvent.setup();

    renderAnalyticsPage();

    await screen.findByRole("heading", { level: 1, name: "Аналитика" });
    await user.click(screen.getByRole("button", { name: "Расписание" }));
    fireEvent.change(screen.getByLabelText("Почта получателя"), {
      target: { value: "bad-mail" },
    });
    await user.click(screen.getByRole("button", { name: "Создать расписание" }));

    expect(screen.getByText("Название расписания должно быть не короче 3 символов")).toBeInTheDocument();
    expect(screen.getByText("Укажите корректную почту")).toBeInTheDocument();
  });

  it("показывает дашборды и создает новый дашборд", async () => {
    const user = userEvent.setup();

    renderAnalyticsPage();

    await screen.findByRole("heading", { level: 1, name: "Аналитика" });
    await user.click(screen.getByRole("button", { name: "Дашборды" }));

    expect(screen.getByRole("heading", { name: "Конструктор дашборда" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Дашборд выручки/ })).toBeInTheDocument();
    expect(screen.getByText("Месячная выручка")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Название дашборда"), {
      target: { value: "Операционный дашборд" },
    });
    fireEvent.change(screen.getByLabelText("Владелец дашборда"), {
      target: { value: "Операции" },
    });
    await user.selectOptions(screen.getByLabelText("Шаблон дашборда"), "operations");
    await user.selectOptions(screen.getByLabelText("Период дашборда"), "90 дней");
    await user.click(screen.getByRole("button", { name: "Создать дашборд" }));

    expect(screen.getByText('Дашборд "Операционный дашборд" создан')).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /Операционный дашборд/ });
    expect(within(row).getByText("Операции")).toBeInTheDocument();
    expect(within(row).getByText("Операционный")).toBeInTheDocument();
    expect(screen.getByText("Очередь задач")).toBeInTheDocument();
  });

  it("показывает ошибки валидации дашборда", async () => {
    const user = userEvent.setup();

    renderAnalyticsPage();

    await screen.findByRole("heading", { level: 1, name: "Аналитика" });
    await user.click(screen.getByRole("button", { name: "Дашборды" }));
    fireEvent.change(screen.getByLabelText("Владелец дашборда"), {
      target: { value: "A" },
    });
    await user.click(screen.getByRole("button", { name: "Создать дашборд" }));

    expect(screen.getByText("Название дашборда должно быть не короче 3 символов")).toBeInTheDocument();
    expect(screen.getByText("Владелец должен быть не короче 2 символов")).toBeInTheDocument();
  });
});
