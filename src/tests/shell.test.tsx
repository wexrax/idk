import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as testingRender, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminShell } from "@/components/admin/admin-shell";
import { resetMockService } from "@/lib/api/client";

let mockedPathname = "/dashboard";
const { mockedLogout, mockedReplace } = vi.hoisted(() => ({
  mockedLogout: vi.fn(),
  mockedReplace: vi.fn(),
}));
const mockedGetAdminProfile = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => mockedPathname,
  useRouter: () => ({
    replace: mockedReplace,
  }),
}));

vi.mock("@/lib/api/auth-client", () => ({
  getAdminProfile: mockedGetAdminProfile,
  logout: mockedLogout,
}));

function render(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return testingRender(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("AdminShell", () => {
  beforeEach(() => {
    resetMockService();
    mockedPathname = "/dashboard";
    mockedLogout.mockResolvedValue({ success: true });
    mockedGetAdminProfile.mockResolvedValue({
      avatar_url: null,
      email: "admin@subhub.app",
      id: "mock-admin",
      mfa_enabled: true,
      name: "SubHub Admin",
      permissions: ["dashboard:read", "billing:write", "security:read"],
      role: "super_admin",
    });
    mockedGetAdminProfile.mockClear();
    mockedLogout.mockClear();
    mockedReplace.mockClear();
    const tokenStore = new Map<string, string>([["subhub.admin.access_token", "test-token"]]);

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn((key: string) => tokenStore.get(key) ?? null),
        removeItem: vi.fn((key: string) => {
          tokenStore.delete(key);
        }),
        setItem: vi.fn((key: string, value: string) => {
          tokenStore.set(key, value);
        }),
      },
    });
  });

  it("redirects to login and hides admin content without an access token", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        removeItem: vi.fn(),
        setItem: vi.fn(),
      },
    });

    render(
      <AdminShell>
        <main>Private dashboard content</main>
      </AdminShell>,
    );

    expect(screen.queryByText("Private dashboard content")).not.toBeInTheDocument();
    expect(mockedReplace).toHaveBeenCalledWith("/login");
  });

  it("renders admin navigation, search, and children", () => {
    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    expect(screen.getByRole("link", { name: /дашборд/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /пользователи/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/поиск/i)).toBeInTheDocument();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });

  it("shows the current subscription count instead of a hardcoded badge", async () => {
    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    const subscriptionsLink = await screen.findByRole("link", { name: /Подписки3/ });
    expect(within(subscriptionsLink).getByText("3")).toBeInTheDocument();
  });

  it("collapses and expands the desktop sidebar while keeping navigation accessible", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    await user.click(screen.getByRole("button", { name: "Свернуть сайдбар" }));

    expect(screen.getByRole("button", { name: "Развернуть сайдбар" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /дашборд/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /пользователи/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Развернуть сайдбар" }));

    expect(screen.getByRole("button", { name: "Свернуть сайдбар" })).toBeInTheDocument();
  });

  it("marks the active desktop navigation item", () => {
    mockedPathname = "/analytics";

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    expect(screen.getByRole("link", { name: /^аналитика$/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks the active mobile navigation item", async () => {
    const user = userEvent.setup();
    mockedPathname = "/analytics";

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    await user.click(screen.getByRole("button", { name: "Открыть меню" }));

    const analyticsLinks = screen.getAllByRole("link", { name: /^аналитика$/i });
    expect(analyticsLinks.at(-1)).toHaveAttribute("aria-current", "page");
  });

  it("filters modules and quick actions from global search", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    await user.type(screen.getByLabelText("Поиск"), "аналитика");

    expect(screen.getByRole("link", { name: /модуль аналитика/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /модуль умная аналитика/i })).toBeInTheDocument();
    expect(screen.getByText("Быстрые действия")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Очистить поиск" }));

    expect(screen.queryByText("Быстрые действия")).not.toBeInTheDocument();
  });

  it("shows an empty search state", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    await user.type(screen.getByLabelText("Поиск"), "zzzz");

    expect(screen.getByText("Ничего не найдено")).toBeInTheDocument();
  });

  it("opens notifications and marks a single event as read", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    await user.click(
      await screen.findByRole("button", { name: "Оповещения, 3 непрочитанных" }),
    );

    expect(screen.getByRole("heading", { name: "Оповещения" })).toBeInTheDocument();
    expect(screen.getByText("Повторный платёж не прошёл")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Отметить Повторный платёж не прошёл прочитанным" }));

    expect(screen.getByRole("button", { name: "Оповещения, 2 непрочитанных" })).toBeInTheDocument();
  });

  it("opens the admin profile menu and logs out", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    await user.click(screen.getByRole("button", { name: "Профиль администратора" }));

    expect(screen.getByRole("heading", { name: "SubHub Admin" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Настройки профиля" })).toHaveAttribute(
      "href",
      "/settings",
    );

    await user.click(screen.getByRole("button", { name: "Выйти" }));

    expect(mockedLogout).toHaveBeenCalledTimes(1);
    expect(mockedReplace).toHaveBeenCalledWith("/login");
  });

  it("marks all notifications as read", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    await user.click(
      await screen.findByRole("button", { name: "Оповещения, 3 непрочитанных" }),
    );
    await user.click(screen.getByRole("button", { name: "Прочитать все" }));

    expect(screen.getByRole("button", { name: "Оповещения, нет непрочитанных" })).toBeInTheDocument();
    expect(screen.getByText("Нет непрочитанных событий")).toBeInTheDocument();
  });

  it("filters notifications and hides read events", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    await user.click(
      await screen.findByRole("button", { name: "Оповещения, 3 непрочитанных" }),
    );

    expect(screen.getByText("Интеграция восстановлена")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Непрочитанные" }));

    expect(screen.getByText("Повторный платёж не прошёл")).toBeInTheDocument();
    expect(screen.queryByText("Интеграция восстановлена")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Отметить Повторный платёж не прошёл прочитанным" }));

    expect(screen.queryByText("Повторный платёж не прошёл")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Все" }));
    await user.click(screen.getByRole("button", { name: "Скрыть прочитанные" }));

    expect(screen.queryByText("Повторный платёж не прошёл")).not.toBeInTheDocument();
    expect(screen.queryByText("Интеграция восстановлена")).not.toBeInTheDocument();
  });

  it("filters navigation and search by selected role", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    expect(screen.getByRole("link", { name: /маркетинг/i })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Роль"), "support");

    expect(screen.getByRole("link", { name: /пользователи/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /маркетинг/i })).not.toBeInTheDocument();
    expect(screen.getByText("Доступно: 3")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Поиск"), "маркетинг");

    expect(screen.getByText("Ничего не найдено")).toBeInTheDocument();
  });

  it("changes role from the mobile navigation drawer", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    await user.click(screen.getByRole("button", { name: "Открыть меню" }));
    await user.selectOptions(screen.getByLabelText("Роль в меню"), "marketer");

    expect(screen.getAllByRole("link", { name: /маркетинг/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /геймификация/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /пользователи/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Доступно: 3").length).toBeGreaterThan(0);
  });

  it("switches admin environment and updates the safety banner", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    expect(screen.getByText("Среда: Продакшен")).toBeInTheDocument();
    expect(screen.getByText("Продакшен: подключение к API запланировано; сейчас используется контрактный mock-сервис.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Среда админки"), "Sandbox");

    expect(screen.getByText("Среда: Песочница")).toBeInTheDocument();
    expect(screen.getByText("Песочница: можно безопасно проверять сценарии и тестовые данные.")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Среда админки"), "Production");

    expect(screen.getByText("Среда: Продакшен")).toBeInTheDocument();
  });

  it("changes environment from the mobile navigation drawer", async () => {
    const user = userEvent.setup();

    render(
      <AdminShell>
        <main>Dashboard content</main>
      </AdminShell>,
    );

    await user.click(screen.getByRole("button", { name: "Открыть меню" }));
    await user.selectOptions(screen.getByLabelText("Среда в меню"), "Sandbox");

    expect(screen.getByText("Песочница: можно безопасно проверять сценарии и тестовые данные.")).toBeInTheDocument();
  });
});
