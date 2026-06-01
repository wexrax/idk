import { beforeEach, describe, expect, it } from "vitest";
import {
  blockUser,
  getDashboardKpis,
  getGamificationWorkspace,
  getMarketingWorkspace,
  getTariffs,
  getUser,
  getUsers,
  grantPoints,
  resetMockService,
} from "@/lib/api/client";

describe("mock API contract", () => {
  beforeEach(() => {
    resetMockService();
  });

  it("returns FastAPI-shaped dashboard KPI data", async () => {
    const kpis = await getDashboardKpis();

    expect(kpis.data.mrr.currency).toBe("RUB");
    expect(kpis.data.mrr.trend).toBe("up");
    expect(kpis.data.active_users.value).toBeGreaterThan(0);
    expect(kpis.data.churn_rate.value).toBeGreaterThanOrEqual(0);
  });

  it("searches and paginates users deterministically", async () => {
    const anna = await getUsers({ page: 1, per_page: 25, search: "anna" });
    const ilya = await getUsers({ page: 1, per_page: 25, search: "ilya" });
    const firstPage = await getUsers({ page: 1, per_page: 25 });

    expect(anna.data.items).toHaveLength(1);
    expect(anna.data.items[0]?.id).toBe("usr_anna_morozova");
    expect(ilya.data.items[0]?.id).toBe("usr_ilya_sokolov");
    expect(firstPage.data.items.length).toBeGreaterThan(1);
    expect(firstPage.data.page).toBe(1);
    expect(firstPage.data.per_page).toBe(25);
    expect(firstPage.data.total).toBeGreaterThan(1);
  });

  it("filters users by status and churn risk", async () => {
    const users = await getUsers({
      page: 1,
      per_page: 25,
      risk: "high",
      status: "trial",
    });

    expect(users.data.items.length).toBeGreaterThan(0);
    expect(users.data.items.every((user) => user.status === "trial")).toBe(true);
    expect(users.data.items.every((user) => user.churn_risk === "high")).toBe(true);
  });

  it("includes users registered on a registered_to date-only day", async () => {
    const users = await getUsers({
      page: 1,
      per_page: 25,
      registered_from: "2026-05-11",
      registered_to: "2026-05-11",
    });

    expect(users.data.items.map((user) => user.id)).toContain("usr_ilya_sokolov");
  });

  it("returns cloned dashboard data across responses", async () => {
    const first = await getDashboardKpis();
    first.data.active_users.value = -1;

    const second = await getDashboardKpis();

    expect(second.data.active_users.value).toBeGreaterThan(0);
  });

  it("mutates user status and points in the mock adapter", async () => {
    const users = await getUsers({ page: 1, per_page: 25, search: "anna" });
    const first = users.data.items[0];

    expect(first).toBeDefined();

    await blockUser(first.id, {
      reason: "Quality check block reason",
    });
    await grantPoints(first.id, {
      amount: 100,
      comment: "Support compensation",
    });

    const profile = await getUser(first.id);
    expect(profile.data.status).toBe("blocked");
    expect(profile.data.block_reason).toBe("Quality check block reason");
    expect(profile.data.points_balance).toBeGreaterThanOrEqual(100);
  });

  it("resets mutated user status and points", async () => {
    const initial = await getUser("usr_anna_morozova");

    await blockUser(initial.data.id, {
      reason: "Quality check block reason",
    });
    await grantPoints(initial.data.id, {
      amount: 100,
      comment: "Support compensation",
    });

    resetMockService();

    const restored = await getUser(initial.data.id);
    expect(restored.data.status).toBe(initial.data.status);
    expect(restored.data.points_balance).toBe(initial.data.points_balance);
    expect(restored.data.block_reason).toBe(initial.data.block_reason);
  });

  it("rejects invalid pagination values", async () => {
    await expect(getUsers({ page: 0, per_page: 25 })).rejects.toMatchObject({
      code: "UNPROCESSABLE_ENTITY",
      details: { page: expect.any(Array) },
      status: 422,
    });
    await expect(getUsers({ page: 1, per_page: 10 })).rejects.toMatchObject({
      code: "UNPROCESSABLE_ENTITY",
      details: { per_page: expect.any(Array) },
      status: 422,
    });
  });

  it("rejects short block reasons", async () => {
    const users = await getUsers({ page: 1, per_page: 25, search: "ilya" });

    await expect(blockUser(users.data.items[0]!.id, { reason: "bad" })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      status: 422,
    });
  });

  it("returns full user profile details", async () => {
    const profile = await getUser("usr_anna_morozova");

    expect(profile.data.id).toBe("usr_anna_morozova");
    expect(profile.data.devices[0]?.platform).toBe("ios");
    expect(profile.data.subscriptions[0]?.service.name).toBe("Netflix");
  });

  it("returns tariffs for the subscriptions slice", async () => {
    const tariffs = await getTariffs();

    expect(tariffs.data[0]?.currency).toBe("RUB");
    expect(tariffs.data.map((tariff) => tariff.name)).toContain("Plus");
    expect(tariffs.data.every((tariff) => tariff.status)).toBe(true);
  });

  it("returns cloned gamification loyalty data", async () => {
    const first = await getGamificationWorkspace();
    first.data.loyalty_events[0]!.amount = -999;
    first.data.loyalty_summary.points_balance = -1;

    const second = await getGamificationWorkspace();

    expect(second.data.loyalty_summary.points_balance).toBeGreaterThan(0);
    expect(second.data.loyalty_tiers.map((tier) => tier.name)).toContain("Плюс");
    expect(second.data.loyalty_events[0]?.amount).toBeGreaterThan(0);
    expect(second.data.rewards.map((reward) => reward.name)).toContain("Premium 30 дней");
  });

  it("returns cloned marketing referral and promo data", async () => {
    const first = await getMarketingWorkspace();
    first.data.referral_summary.active_advocates = -1;
    first.data.promo_coupons[0]!.used_count = -20;

    const second = await getMarketingWorkspace();

    expect(second.data.referral_summary.active_advocates).toBeGreaterThan(0);
    expect(second.data.referral_tiers.map((tier) => tier.name)).toContain("Активный амбассадор");
    expect(second.data.referral_events[0]?.advocate).toBe("Анна Морозова");
    expect(second.data.promo_coupons.map((coupon) => coupon.code)).toContain("FRIEND500");
    expect(second.data.promo_coupons[0]?.used_count).toBeGreaterThanOrEqual(0);
  });
});
