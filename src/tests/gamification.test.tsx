import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import GamificationPage from "@/app/(admin)/gamification/page";
import { resetMockService } from "@/lib/api/client";

function renderGamificationPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <GamificationPage />
    </QueryClientProvider>,
  );
}

describe("GamificationPage", () => {
  beforeEach(() => {
    resetMockService();
  });

  it("показывает русские точки входа для лояльности, достижений и магазина", async () => {
    renderGamificationPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "Геймификация" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Начисление баллов" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Достижения" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Магазин наград" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отзывы" })).toBeInTheDocument();
  });

  it("начисляет баллы лояльности и добавляет событие в историю", async () => {
    const user = userEvent.setup();

    renderGamificationPage();

    await screen.findByRole("heading", { level: 1, name: "Геймификация" });
    await user.clear(screen.getByLabelText("Пользователь"));
    await user.type(screen.getByLabelText("Пользователь"), "Олег Волков");
    await user.clear(screen.getByLabelText("Количество баллов"));
    await user.type(screen.getByLabelText("Количество баллов"), "250");
    await user.clear(screen.getByLabelText("Комментарий"));
    await user.type(screen.getByLabelText("Комментарий"), "Бонус за продление подписки");
    await user.click(screen.getByRole("button", { name: "Начислить баллы" }));

    expect(screen.getByText("250 баллов начислено пользователю Олег Волков")).toBeInTheDocument();
    const eventRow = screen.getByRole("row", { name: /Олег Волков/ });
    expect(eventRow).toBeInTheDocument();
    expect(within(eventRow).getByText("Бонус за продление подписки")).toBeInTheDocument();
  });

  it("создаёт достижение с условием и наградой", async () => {
    const user = userEvent.setup();

    renderGamificationPage();

    await screen.findByRole("heading", { level: 1, name: "Геймификация" });
    await user.click(screen.getByRole("button", { name: "Достижения" }));
    await user.clear(screen.getByLabelText("Название достижения"));
    await user.type(screen.getByLabelText("Название достижения"), "7 дней активности");
    await user.clear(screen.getByLabelText("Количество условий"));
    await user.type(screen.getByLabelText("Количество условий"), "7");
    await user.selectOptions(screen.getByLabelText("Тип награды"), "badge");
    await user.click(screen.getByRole("button", { name: "Сохранить достижение" }));

    expect(screen.getByRole("row", { name: /7 дней активности/ })).toBeInTheDocument();
    expect(screen.getByText('Достижение "7 дней активности" сохранено')).toBeInTheDocument();
  });

  it("показывает ошибки валидации для баллов, достижений и ответа", async () => {
    const user = userEvent.setup();

    renderGamificationPage();

    await screen.findByRole("heading", { level: 1, name: "Геймификация" });
    await user.clear(screen.getByLabelText("Количество баллов"));
    await user.type(screen.getByLabelText("Количество баллов"), "0");
    await user.click(screen.getByRole("button", { name: "Начислить баллы" }));
    expect(screen.getByText("Начислите минимум 1 балл")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Достижения" }));
    await user.clear(screen.getByLabelText("Название достижения"));
    await user.type(screen.getByLabelText("Название достижения"), "Но");
    await user.click(screen.getByRole("button", { name: "Сохранить достижение" }));
    expect(screen.getByText("Название должно быть не короче 3 символов")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Отзывы" }));
    await user.click(screen.getByRole("row", { name: /Платеж не прошел/ }));
    await user.type(screen.getByLabelText("Ответ компании"), "Коротко");
    await user.click(screen.getByRole("button", { name: "Отправить ответ" }));
    expect(screen.getByText("Ответ должен быть не короче 10 символов")).toBeInTheDocument();
  });

  it("списывает награду в магазине и отвечает на отзыв", async () => {
    const user = userEvent.setup();

    renderGamificationPage();

    await screen.findByRole("heading", { level: 1, name: "Геймификация" });
    await user.click(screen.getByRole("button", { name: "Магазин наград" }));
    await user.selectOptions(screen.getByLabelText("Категория наград"), "Доступ");
    await user.click(screen.getByRole("button", { name: "Списать Premium 30 дней" }));
    expect(screen.getByText('Награда "Premium 30 дней" списана, остаток уменьшен')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Отзывы" }));
    await user.click(screen.getByRole("row", { name: /Платеж не прошел/ }));
    await user.type(
      screen.getByLabelText("Ответ компании"),
      "Проверим платеж и вернемся с решением.",
    );
    await user.click(screen.getByRole("button", { name: "Отправить ответ" }));

    const reviewPanel = screen.getByTestId("review-response-panel");
    expect(within(reviewPanel).getByText("Статус: Закрыт")).toBeInTheDocument();
    expect(
      within(reviewPanel).getByText("Проверим платеж и вернемся с решением.", {
        selector: "p.text-success",
      }),
    ).toBeInTheDocument();
  });
});
