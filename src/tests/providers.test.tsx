import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "@/lib/query-client";

describe("AppProviders", () => {
  it("keeps application children visible after client render", () => {
    render(
      <AppProviders>
        <main>Visible application content</main>
      </AppProviders>,
    );

    expect(screen.getByText("Visible application content")).toBeInTheDocument();
  });
});
