import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginClient } from "@/components/auth/login-client";
import { authEndpoints } from "@/lib/api/auth-contracts";

const { mockedReplace } = vi.hoisted(() => ({
  mockedReplace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockedReplace,
  }),
}));

describe("LoginClient", () => {
  beforeEach(() => {
    mockedReplace.mockClear();
    const tokenStore = new Map<string, string>();

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

  it("renders the compact credentials screen with the login endpoint contract", () => {
    render(<LoginClient />);

    expect(screen.getByRole("textbox", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByText("SubHub")).toBeInTheDocument();
    expect(screen.getByText(authEndpoints.login)).toBeInTheDocument();
  });

  it("moves to the TOTP step after valid credentials", async () => {
    const user = userEvent.setup();

    render(<LoginClient />);

    const passwordInput = document.querySelector<HTMLInputElement>('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();

    await user.type(passwordInput!, "strong-password");
    fireEvent.submit(passwordInput!.closest("form")!);

    expect(await screen.findByLabelText(/TOTP/i)).toBeInTheDocument();
    expect(screen.getAllByText(authEndpoints.verify2fa)).not.toHaveLength(0);
  });

  it("stores the mock token and redirects to dashboard after TOTP", async () => {
    const user = userEvent.setup();

    render(<LoginClient />);

    const passwordInput = document.querySelector<HTMLInputElement>('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();

    await user.type(passwordInput!, "strong-password");
    fireEvent.submit(passwordInput!.closest("form")!);
    await user.type(await screen.findByLabelText(/TOTP/i), "123456");
    fireEvent.submit(screen.getByLabelText(/TOTP/i).closest("form")!);

    await waitFor(() => {
      expect(mockedReplace).toHaveBeenCalledWith("/dashboard");
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "subhub.admin.access_token",
        expect.stringContaining("mock_access_"),
      );
    });
  });
});
