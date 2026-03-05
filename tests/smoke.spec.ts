import { expect, test } from "@playwright/test";

test("homepage rendert hoofdsecties", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("#site-header")).toBeVisible();
  await expect(page.locator("#contact")).toBeVisible();
});

test("navigatie-anchor werkt naar boekingen", async ({ page }) => {
  await page.goto("/#boekingen");
  await expect(page).toHaveURL(/#boekingen/);
  await expect(page.locator("#boekingen")).toBeVisible();
});

test("contact endpoint accepteert valide payload", async ({ request, baseURL }) => {
  const response = await request.post(`${baseURL}/api/contact`, {
    headers: {
      Origin: baseURL ?? "http://localhost:3000",
      "Content-Type": "application/json"
    },
    data: {
      subject: "Boekingsaanvraag",
      name: "Smoke Test",
      email: "smoke@example.com",
      phone: "+31600000000",
      message: "Dit is een geautomatiseerde smoke test.",
      company_website: ""
    }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.ok).toBeTruthy();
});

test("admin login + editor endpoint", async ({ page, request, baseURL }) => {
  const email = process.env.ADMIN_SMOKE_EMAIL;
  const password = process.env.ADMIN_SMOKE_PASSWORD;
  test.skip(!email || !password, "ADMIN_SMOKE_EMAIL / ADMIN_SMOKE_PASSWORD ontbreken.");

  await page.goto("/admin/login");
  await page.getByLabel("E-mailadres").fill(email ?? "");
  await page.getByLabel("Wachtwoord").fill(password ?? "");
  await page.getByRole("button", { name: /Inloggen/i }).click();
  await expect(page).toHaveURL(/\/admin(\/backend)?$/);

  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  const response = await request.get(`${baseURL}/api/content/admin/editor-full`, {
    headers: {
      cookie: cookieHeader
    }
  });

  expect(response.status()).toBe(200);
});
