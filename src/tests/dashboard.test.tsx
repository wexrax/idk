import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { MrrChart } from "@/components/dashboard/mrr-chart";

beforeAll(() => {
  class ResizeObserverMock implements ResizeObserver {
    observe(target: Element) {
      this.callback(
        [
          {
            borderBoxSize: [],
            contentBoxSize: [],
            contentRect: target.getBoundingClientRect(),
            devicePixelContentBoxSize: [],
            target,
          },
        ],
        this,
      );
    }

    unobserve() {}

    disconnect() {}

    constructor(private readonly callback: ResizeObserverCallback) {}
  }

  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    bottom: 288,
    height: 288,
    left: 0,
    right: 640,
    toJSON: () => ({}),
    top: 0,
    width: 640,
    x: 0,
    y: 0,
  });
});

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardClient />
    </QueryClientProvider>,
  );
}

describe("DashboardClient", () => {
  it("renders KPI cards and dashboard sections", async () => {
    renderDashboard();

    expect(await screen.findAllByText("MRR")).not.toHaveLength(0);
    expect(screen.getByText("Отток")).toBeInTheDocument();
    expect(screen.getByText("LTV:CAC")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Динамика MRR" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Создать рассылку" })).toHaveAttribute(
      "href",
      "/marketing#new-campaign",
    );
  });
});

describe("MrrChart", () => {
  it("renders a named SVG chart with a screen-reader data fallback", () => {
    const { container } = render(
      <MrrChart
        data={[
          { date: "2026-05-01", mrr: 120000, new_users: 8 },
          { date: "2026-05-08", mrr: 143500, new_users: 11 },
        ]}
      />,
    );

    expect(screen.getByRole("img", { name: "Динамика MRR" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Данные динамики MRR" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2026-05-01" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "8" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "2026-05-08" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "11" })).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders backend period labels that are not dates", () => {
    render(<MrrChart data={[{ date: "current", mrr: 0, new_users: 0 }]} />);

    expect(screen.getByRole("img", { name: /MRR/ })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "current" })).toBeInTheDocument();
  });
});
