import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { resetMockService } from "@/lib/api/client";
import { UserProfile } from "@/components/users/user-profile";
import { UsersClient } from "@/components/users/users-client";

function renderWithQueryClient(children: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    render(
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    )
  );
}

describe("Users CRM", () => {
  beforeEach(() => {
    resetMockService();
  });

  it("renders users and filters by search", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<UsersClient />);

    await waitFor(() => expect(screen.getByText("U-00001")).toBeInTheDocument());
    await user.type(screen.getByPlaceholderText(/имя или email/i), "ilya");

    await waitFor(() => expect(screen.getByText("U-00002")).toBeInTheDocument());
    expect(screen.queryByText("U-00001")).not.toBeInTheDocument();
  });

  it("renders a user profile with support actions", async () => {
    renderWithQueryClient(<UserProfile userId="usr_anna_morozova" />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Анна Морозова" })).toBeInTheDocument(),
    );
    expect(screen.getByText("anna.morozova@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Заблокировать" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Начислить" })).toBeInTheDocument();
  });
});
