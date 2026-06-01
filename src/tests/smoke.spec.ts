import { expect, type APIRequestContext, type Page, test } from "@playwright/test";

async function setInputValue(page: Page, selector: string, value: string) {
  await page.locator(selector).evaluate(
    (element, nextValue) => {
      const input = element as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;

      setter?.call(input, nextValue);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    value,
  );
}

async function seedLiveToken(
  page: Page,
  request: APIRequestContext,
  apiBaseUrl: string,
  email: string,
  password: string,
) {
  const response = await request.post(`${apiBaseUrl}/api/v1/auth/login`, {
    data: { email, password },
  });

  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as { access_token?: string };
  expect(payload.access_token).toBeTruthy();
  const token = payload.access_token as string;

  await page.goto("/login");
  await page.evaluate((accessToken) => {
    window.localStorage.setItem("subhub.admin.access_token", accessToken);
  }, token);
}

test("admin routes render with authenticated API access", async ({ page, request }, testInfo) => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace("0.0.0.0", "127.0.0.1");
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  const isLiveApi = Boolean(apiBaseUrl && adminEmail && adminPassword);

  await page.goto("/login");

  if (
    isLiveApi &&
    adminEmail &&
    adminPassword &&
    apiBaseUrl &&
    testInfo.project.name === "desktop-chrome"
  ) {
    await setInputValue(page, 'input[type="email"]', adminEmail);
    await setInputValue(page, 'input[type="password"]', adminPassword);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10_000 });
  } else if (isLiveApi && adminEmail && adminPassword && apiBaseUrl) {
    await seedLiveToken(page, request, apiBaseUrl, adminEmail, adminPassword);
  } else {
    await page.evaluate(() => {
      window.localStorage.setItem("subhub.admin.access_token", "e2e-test-token");
    });
  }

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("MRR").first()).toBeVisible();
  await expect(page.getByText("LTV:CAC")).toBeVisible();
  await expect(page.getByRole("img", { name: /MRR/ })).toBeVisible();

  await page.goto("/users");
  await expect(page).toHaveURL(/\/users$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();

  await page.goto("/subscriptions");
  await expect(page).toHaveURL(/\/subscriptions$/);
  await expect(page.getByRole("table").first()).toBeVisible();

  if (!isLiveApi) {
    await expect(page.getByText("Plus")).toBeVisible();
    await expect(page.getByText("Ultimate")).toBeVisible();
  }
});
