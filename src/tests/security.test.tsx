import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import SecurityPage from "@/app/(admin)/security/page";
import { resetMockService } from "@/lib/api/client";

function renderSecurityPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SecurityPage />
    </QueryClientProvider>,
  );
}

describe("SecurityPage", () => {
  beforeEach(() => {
    resetMockService();
  });

  it("показывает русские метрики, роли и матрицу разрешений", async () => {
    renderSecurityPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Безопасность" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Назначение роли" })).toBeInTheDocument();
    expect(screen.getAllByText("Владелец").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Политики безопасности")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Пользователь" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Роль" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Журнал аудита" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2FA/MFA" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Политики" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сессии" })).toBeInTheDocument();
  });

  it("создает валидное назначение роли", async () => {
    const user = userEvent.setup();

    renderSecurityPage();
    await screen.findByRole("heading", { level: 1, name: "Безопасность" });

    fireEvent.change(screen.getByLabelText("Пользователь"), {
      target: { value: "Ольга Аналитик" },
    });
    await user.selectOptions(screen.getByLabelText("Роль"), "analyst");
    fireEvent.change(screen.getByLabelText("Причина доступа"), {
      target: { value: "Проверка отчетов" },
    });
    await user.click(screen.getByRole("button", { name: "Сохранить роль" }));

    expect(
      await screen.findByText('Роль "Аналитик" для Ольга Аналитик назначена'),
    ).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /Ольга Аналитик/ });
    expect(within(row).getByText("Аналитик")).toBeInTheDocument();
    expect(within(row).getByText("Проверка отчетов")).toBeInTheDocument();
    expect(within(row).getByText("Активно")).toBeInTheDocument();
  });

  it("показывает ошибки валидации назначения роли", async () => {
    const user = userEvent.setup();

    renderSecurityPage();
    await screen.findByRole("heading", { level: 1, name: "Безопасность" });

    fireEvent.change(screen.getByLabelText("Пользователь"), {
      target: { value: "QA" },
    });
    fireEvent.change(screen.getByLabelText("Причина доступа"), {
      target: { value: "Тест" },
    });
    await user.click(screen.getByRole("button", { name: "Сохранить роль" }));

    expect(screen.getByText("Имя пользователя должно быть не короче 3 символов")).toBeInTheDocument();
    expect(screen.getByText("Причина должна быть не короче 5 символов")).toBeInTheDocument();
  });

  it("открывает аудит и завершает рискованную сессию", async () => {
    const user = userEvent.setup();

    renderSecurityPage();
    await screen.findByRole("heading", { level: 1, name: "Безопасность" });

    await user.click(screen.getByRole("button", { name: "Журнал аудита" }));
    await user.selectOptions(screen.getByLabelText("Фильтр риска"), "medium");
    expect(screen.getByRole("row", { name: /RBAC обновлен/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Подозрительная сессия закрыта/ })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Фильтр риска"), "all");
    await user.type(screen.getByLabelText("Поиск по аудиту"), "подозрительная");
    expect(screen.getByRole("row", { name: /Подозрительная сессия закрыта/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /RBAC обновлен/ })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Поиск по аудиту"));
    await user.click(screen.getByRole("row", { name: /RBAC обновлен/ }));

    const auditPanel = screen.getByTestId("audit-detail-panel");
    expect(within(auditPanel).getByRole("heading", { name: "RBAC обновлен" })).toBeInTheDocument();
    expect(within(auditPanel).getByText("Доказательство: role_matrix_v4")).toBeInTheDocument();
    expect(
      within(auditPanel).getByText("Проверена матрица ролей и подтвержден доступ лида поддержки."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Описание изменения"), {
      target: { value: "Добавлен комментарий к проверке роли" },
    });
    await user.click(screen.getByRole("button", { name: "Добавить запись истории" }));
    expect(screen.getByText("Запись истории добавлена")).toBeInTheDocument();
    expect(screen.getByText("Добавлен комментарий к проверке роли")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Сессии" }));
    await user.selectOptions(screen.getByLabelText("Риск сессии"), "high");
    expect(screen.getAllByText("iPhone 15 Pro").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("MacBook Pro")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Риск сессии"), "all");
    await user.type(screen.getByLabelText("Поиск по сессиям"), "vpn");
    expect(screen.getAllByText("Windows Desktop").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("iPhone 15 Pro")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Поиск по сессиям"));
    await user.click(screen.getAllByText("iPhone 15 Pro")[0]);
    expect(screen.getByText("История сессии")).toBeInTheDocument();
    expect(screen.getByText("Сессия отмечена как рискованная")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Причина завершения"), {
      target: { value: "Подтверждён риск входа из новой страны" },
    });
    await user.click(screen.getByRole("button", { name: "Завершить сессию" }));

    expect(screen.getByText("Сессия iPhone 15 Pro завершена")).toBeInTheDocument();
    expect(screen.getByText("Подтверждён риск входа из новой страны")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Статус сессии"), "terminated");
    expect(screen.getAllByText("iPhone 15 Pro").length).toBeGreaterThanOrEqual(1);
  });

  it("показывает ошибки валидации истории изменений", async () => {
    const user = userEvent.setup();

    renderSecurityPage();
    await screen.findByRole("heading", { level: 1, name: "Безопасность" });
    await user.click(screen.getByRole("button", { name: "Журнал аудита" }));
    await user.click(screen.getByRole("button", { name: "Добавить запись истории" }));

    expect(screen.getByText("Описание должно быть не короче 8 символов")).toBeInTheDocument();
  });

  it("показывает ошибку валидации причины завершения сессии", async () => {
    const user = userEvent.setup();

    renderSecurityPage();
    await screen.findByRole("heading", { level: 1, name: "Безопасность" });
    await user.click(screen.getByRole("button", { name: "Сессии" }));
    await user.click(screen.getByRole("button", { name: "Завершить сессию" }));

    expect(screen.getByText("Причина должна быть не короче 8 символов")).toBeInTheDocument();
  });

  it("управляет 2FA/MFA, фильтрами и политикой", async () => {
    const user = userEvent.setup();

    renderSecurityPage();
    await screen.findByRole("heading", { level: 1, name: "Безопасность" });
    await user.click(screen.getByRole("button", { name: "2FA/MFA" }));

    expect(screen.getByText("Покрытие 2FA")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Управление 2FA/MFA" })).toBeInTheDocument();
    expect(screen.getAllByText("Елена Админ").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Рекомендация: Оставить аппаратный ключ как основной фактор.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Статус 2FA"), "disabled");
    expect(screen.getAllByText("Финансовый менеджер").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Елена Админ")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Статус 2FA"), "all");
    await user.type(screen.getByLabelText("Поиск по 2FA"), "поддержка");
    expect(screen.getAllByText("Иван Поддержка").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Финансовый менеджер")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Поиск по 2FA"));
    fireEvent.change(screen.getByLabelText("Минимальное покрытие MFA"), {
      target: { value: "97" },
    });
    fireEvent.change(screen.getByLabelText("Льготный период MFA"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Резервные коды MFA"), {
      target: { value: "12" },
    });
    await user.click(screen.getByRole("button", { name: "Сохранить политику MFA" }));

    expect(screen.getByText("Политика 2FA/MFA обновлена")).toBeInTheDocument();
    expect(screen.getByLabelText("Минимальное покрытие MFA")).toHaveValue("97");
  });

  it("показывает ошибку валидации политики MFA", async () => {
    const user = userEvent.setup();

    renderSecurityPage();
    await screen.findByRole("heading", { level: 1, name: "Безопасность" });
    await user.click(screen.getByRole("button", { name: "2FA/MFA" }));
    fireEvent.change(screen.getByLabelText("Минимальное покрытие MFA"), {
      target: { value: "70" },
    });
    await user.click(screen.getByRole("button", { name: "Сохранить политику MFA" }));

    expect(screen.getByText("Покрытие должно быть не ниже 80%")).toBeInTheDocument();
  });

  it("управляет rate limiting и security headers", async () => {
    const user = userEvent.setup();

    renderSecurityPage();
    await screen.findByRole("heading", { level: 1, name: "Безопасность" });
    await user.click(screen.getByRole("button", { name: "Политики" }));

    expect(screen.getByRole("heading", { name: "API rate limiting" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Заголовки безопасности" })).toBeInTheDocument();
    expect(screen.getAllByText("Content-Security-Policy").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Рекомендация: Добавить report-uri для staging и production окружений.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Риск лимита"), "high");
    expect(screen.getByRole("row", { name: /Авторизация/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Пользователи/ })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Риск лимита"), "all");
    await user.type(screen.getByLabelText("Поиск по лимитам"), "экспорт");
    expect(screen.getByRole("row", { name: /Экспорт отчётов/ })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Авторизация/ })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Поиск по лимитам"));
    await user.click(screen.getByRole("row", { name: /Авторизация/ }));
    fireEvent.change(screen.getByLabelText("Лимит запросов"), {
      target: { value: "90" },
    });
    fireEvent.change(screen.getByLabelText("Окно лимита"), {
      target: { value: "60" },
    });
    fireEvent.change(screen.getByLabelText("Burst лимита"), {
      target: { value: "30" },
    });
    fireEvent.change(screen.getByLabelText("Причина изменения лимита"), {
      target: { value: "Усиление защиты входа" },
    });
    await user.click(screen.getByRole("button", { name: "Сохранить лимит" }));

    expect(
      screen.getByText('Правило "Авторизация" отправлено на проверку: Усиление защиты входа'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Лимит запросов")).toHaveValue("90");
  });

  it("показывает ошибку валидации rate limit", async () => {
    const user = userEvent.setup();

    renderSecurityPage();
    await screen.findByRole("heading", { level: 1, name: "Безопасность" });
    await user.click(screen.getByRole("button", { name: "Политики" }));
    fireEvent.change(screen.getByLabelText("Лимит запросов"), {
      target: { value: "5" },
    });
    await user.click(screen.getByRole("button", { name: "Сохранить лимит" }));

    expect(screen.getByText("Лимит должен быть не меньше 10 запросов")).toBeInTheDocument();
    expect(screen.getByText("Причина должна быть не короче 8 символов")).toBeInTheDocument();
  });
});
