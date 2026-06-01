import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import MarketingPage from "@/app/(admin)/marketing/page";
import { resetMockService } from "@/lib/api/client";

function renderMarketingPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MarketingPage />
    </QueryClientProvider>,
  );
}

describe("MarketingPage", () => {
  beforeEach(() => {
    resetMockService();
  });

  it("показывает русские KPI, вкладки и таблицу кампаний", async () => {
    renderMarketingPage();

    expect(await screen.findByRole("heading", { level: 1, name: "Маркетинг" })).toBeInTheDocument();
    expect(screen.getByText("Всего кампаний")).toBeInTheDocument();
    expect(screen.getByText("Активные")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A/B-тесты" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сообщения" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Шаблоны" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Автоматизация" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Рефералы" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Промо-коды" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Продление D-3/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Конверсия" })).toBeInTheDocument();
  });

  it("фильтрует кампании по статусу, каналу и поиску", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });

    await user.selectOptions(screen.getByLabelText("Фильтр статуса"), "draft");
    expect(screen.getByRole("row", { name: /Возврат 14 дней/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Продление D-3/ })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Фильтр статуса"), "all");
    await user.selectOptions(screen.getByLabelText("Фильтр канала"), "sms");
    expect(screen.getByRole("row", { name: /Повтор платежа/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Годовой Family/ })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Фильтр канала"), "all");
    await user.type(screen.getByLabelText("Поиск кампании"), "family");
    expect(screen.getByRole("row", { name: /Годовой Family/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Повтор платежа/ })).not.toBeInTheDocument();
  });

  it("создает валидный черновик кампании", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });

    fireEvent.change(screen.getByLabelText("Название кампании"), {
      target: { value: "Годовой оффер" },
    });
    fireEvent.change(screen.getByLabelText("Сегмент кампании"), {
      target: { value: "Спящие 30 дней" },
    });
    fireEvent.change(screen.getByLabelText("Канал кампании"), {
      target: { value: "email" },
    });
    fireEvent.change(screen.getByLabelText("Аудитория"), {
      target: { value: "15000" },
    });
    fireEvent.change(screen.getByLabelText("Конверсия"), {
      target: { value: "6.3" },
    });
    await user.click(screen.getByRole("button", { name: "Создать черновик" }));

    expect(screen.getByText('Черновик "Годовой оффер" создан')).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /Годовой оффер/ });
    expect(within(row).getByText("Черновик")).toBeInTheDocument();
    expect(within(row).getByText("Email")).toBeInTheDocument();
    expect(within(row).getByText("6,3%")).toBeInTheDocument();
  });

  it("показывает ошибки валидации для кампании", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });

    await user.click(screen.getByRole("button", { name: "Создать черновик" }));
    expect(screen.getByText("Название должно быть не короче 3 символов")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Аудитория"));
    await user.type(screen.getByLabelText("Аудитория"), "0");
    await user.clear(screen.getByLabelText("Конверсия"));
    await user.type(screen.getByLabelText("Конверсия"), "120");
    await user.click(screen.getByRole("button", { name: "Создать черновик" }));

    expect(screen.getByText("Аудитория должна быть больше 0")).toBeInTheDocument();
    expect(screen.getByText("Конверсия не может быть выше 100")).toBeInTheDocument();
  });

  it("создает A/B-тест и выбирает победителя", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });

    await user.click(screen.getByRole("button", { name: "A/B-тесты" }));
    expect(screen.getByRole("heading", { name: "Конструктор A/B-теста" })).toBeInTheDocument();
    expect(screen.getByText("Продление D-3: короткий оффер")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Название теста"), {
      target: { value: "Тест годового оффера" },
    });
    fireEvent.change(screen.getByLabelText("Аудитория теста"), {
      target: { value: "22000" },
    });
    fireEvent.change(screen.getByLabelText("Доля варианта A"), {
      target: { value: "40" },
    });
    fireEvent.change(screen.getByLabelText("Вариант A"), {
      target: { value: "Скидка 10%" },
    });
    fireEvent.change(screen.getByLabelText("Вариант B"), {
      target: { value: "Бонусный месяц" },
    });
    await user.click(screen.getByRole("button", { name: "Создать A/B-тест" }));

    expect(screen.getByText('A/B-тест "Тест годового оффера" создан')).toBeInTheDocument();
    expect(screen.getByText("Тест годового оффера")).toBeInTheDocument();
    expect(screen.getByText("40% аудитории")).toBeInTheDocument();
    expect(screen.getByText("60% аудитории")).toBeInTheDocument();

    const experiment = screen.getByText("Тест годового оффера").closest("article");
    expect(experiment).not.toBeNull();
    await user.click(within(experiment as HTMLElement).getByRole("button", { name: "Выбрать вариант B" }));

    expect(screen.getByText("Победитель варианта B выбран")).toBeInTheDocument();
    expect(within(experiment as HTMLElement).getByText("Победитель")).toBeInTheDocument();
  });

  it("показывает ошибки валидации для A/B-теста", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });
    await user.click(screen.getByRole("button", { name: "A/B-тесты" }));

    await user.click(screen.getByRole("button", { name: "Создать A/B-тест" }));
    expect(screen.getByText("Название теста должно быть не короче 3 символов")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Аудитория теста"));
    await user.type(screen.getByLabelText("Аудитория теста"), "20");
    await user.clear(screen.getByLabelText("Доля варианта A"));
    await user.type(screen.getByLabelText("Доля варианта A"), "95");
    await user.click(screen.getByRole("button", { name: "Создать A/B-тест" }));

    expect(screen.getByText("Аудитория теста должна быть не меньше 100")).toBeInTheDocument();
    expect(screen.getByText("Доля варианта A должна быть не больше 90%")).toBeInTheDocument();
  });

  it("создаёт SMS/Push сообщение и показывает предпросмотр", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });
    await user.click(screen.getByRole("button", { name: "Сообщения" }));

    expect(screen.getByRole("heading", { name: "Конструктор SMS/Push" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Название сообщения"), {
      target: { value: "Push реактивация" },
    });
    fireEvent.change(screen.getByLabelText("Заголовок сообщения"), {
      target: { value: "Вернитесь в SubHub" },
    });
    fireEvent.change(screen.getByLabelText("Текст сообщения"), {
      target: { value: "Мы сохранили ваши подписки и подготовили персональный оффер." },
    });
    fireEvent.change(screen.getByLabelText("CTA сообщения"), {
      target: { value: "Открыть" },
    });
    await user.click(screen.getByRole("button", { name: "Создать сообщение" }));

    expect(screen.getByText('Черновик сообщения "Push реактивация" создан')).toBeInTheDocument();
    expect(screen.getAllByText("Push реактивация").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Вернитесь в SubHub").length).toBeGreaterThanOrEqual(1);
  });

  it("применяет шаблон в конструктор сообщения", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });
    await user.click(screen.getByRole("button", { name: "Шаблоны" }));

    expect(screen.getByRole("heading", { name: "Детали шаблона" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Поиск шаблона"), "платеж");
    expect(screen.getAllByText("Повтор платежа").length).toBeGreaterThanOrEqual(1);
    await user.click(screen.getByRole("button", { name: "Использовать шаблон" }));

    expect(screen.getByText('Шаблон "Повтор платежа" применён')).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Сообщения" }));
    expect(screen.getByLabelText("Заголовок сообщения")).toHaveValue("Нужна оплата");
    expect(screen.getByLabelText("CTA сообщения")).toHaveValue("Обновить карту");
  });

  it("создаёт правило автоматизации", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });
    await user.click(screen.getByRole("button", { name: "Автоматизация" }));

    expect(screen.getByRole("heading", { name: "Правило автоматизации" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Название правила"), {
      target: { value: "Возврат после ошибки платежа" },
    });
    fireEvent.change(screen.getByLabelText("Триггер автоматизации"), {
      target: { value: "payment_failed" },
    });
    fireEvent.change(screen.getByLabelText("Задержка автоматизации"), {
      target: { value: "3" },
    });
    await user.click(screen.getByRole("button", { name: "Создать правило" }));

    expect(screen.getByText('Правило "Возврат после ошибки платежа" создано')).toBeInTheDocument();
    expect(screen.getByText("Возврат после ошибки платежа")).toBeInTheDocument();
  });

  it("показывает ошибки валидации для сообщений и автоматизации", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });
    await user.click(screen.getByRole("button", { name: "Сообщения" }));
    await user.click(screen.getByRole("button", { name: "Создать сообщение" }));

    expect(screen.getByText("Название сообщения должно быть не короче 3 символов")).toBeInTheDocument();
    expect(screen.getByText("Текст сообщения должен быть не короче 12 символов")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Автоматизация" }));
    await user.clear(screen.getByLabelText("Задержка автоматизации"));
    await user.type(screen.getByLabelText("Задержка автоматизации"), "200");
    await user.click(screen.getByRole("button", { name: "Создать правило" }));

    expect(screen.getByText("Название правила должно быть не короче 3 символов")).toBeInTheDocument();
    expect(screen.getByText("Задержка не может быть больше 168 часов")).toBeInTheDocument();
  });

  it("создаёт реферальную кампанию", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });
    await user.click(screen.getByRole("button", { name: "Рефералы" }));

    expect(screen.getByRole("heading", { name: "Реферальная кампания" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Анна Морозова/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Название реферальной кампании"), {
      target: { value: "Друзья Family" },
    });
    fireEvent.change(screen.getByLabelText("Цель приглашений"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Награда рекомендателю"), {
      target: { value: "Premium 30 дней" },
    });
    fireEvent.change(screen.getByLabelText("Награда другу"), {
      target: { value: "20% на первый месяц" },
    });
    await user.click(screen.getByRole("button", { name: "Создать реферальную кампанию" }));

    expect(screen.getByText('Реферальная кампания "Друзья Family" создана')).toBeInTheDocument();
    expect(screen.getByText("Друзья Family")).toBeInTheDocument();
  });

  it("создаёт промо-код и фильтрует купоны", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });
    await user.click(screen.getByRole("button", { name: "Промо-коды" }));

    expect(screen.getByRole("heading", { name: "Новый промо-код" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Статус купона"), "scheduled");
    expect(screen.getByText("FAMILY20")).toBeInTheDocument();
    expect(screen.queryByText("FRIEND500")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Статус купона"), "all");
    fireEvent.change(screen.getByLabelText("Название купона"), {
      target: { value: "Осенний бонус" },
    });
    fireEvent.change(screen.getByLabelText("Код промо-кода"), {
      target: { value: "AUTUMN25" },
    });
    fireEvent.change(screen.getByLabelText("Размер скидки"), {
      target: { value: "25" },
    });
    await user.click(screen.getByRole("button", { name: "Создать промо-код" }));

    expect(screen.getByText('Промо-код "AUTUMN25" создан')).toBeInTheDocument();
    expect(screen.getAllByText("AUTUMN25").length).toBeGreaterThanOrEqual(1);
  });

  it("показывает ошибки валидации для рефералов и промо-кодов", async () => {
    const user = userEvent.setup();

    renderMarketingPage();
    await screen.findByRole("heading", { level: 1, name: "Маркетинг" });
    await user.click(screen.getByRole("button", { name: "Рефералы" }));
    await user.click(screen.getByRole("button", { name: "Создать реферальную кампанию" }));
    expect(screen.getByText("Название должно быть не короче 3 символов")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Промо-коды" }));
    fireEvent.change(screen.getByLabelText("Код промо-кода"), {
      target: { value: "bad code" },
    });
    await user.click(screen.getByRole("button", { name: "Создать промо-код" }));
    expect(
      screen.getByText("Код должен содержать латинские буквы, цифры, _ или -"),
    ).toBeInTheDocument();
  });
});
