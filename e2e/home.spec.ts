import { expect, test } from "@playwright/test";

test("landing shows brand hero and domain field", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: "SEO Copilot" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /comprenez et corrigez votre seo/i,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Domaine à auditer")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /lancer l'audit/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /inclus aujourd/i })).toBeVisible();
});

test("demo audit shows score and issue cards", async ({ page }) => {
  await page.goto("/audits/demo");

  await expect(
    page.getByRole("heading", { name: /votre score seo/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /3 actions prioritaires/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/meta description manquante/i).first(),
  ).toBeVisible();
});

test("full audit flow on example.com", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("Domaine à auditer")).toBeVisible();

  await page.getByLabel("Domaine à auditer").fill("example.com");

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/audits") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /lancer l'audit/i }).click();
  const created = await createResponse;
  expect(created.status()).toBe(202);
  const body = (await created.json()) as { data: { auditId: string } };
  expect(body.data.auditId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );

  await expect(page).toHaveURL(new RegExp(`/audits/${body.data.auditId}`), {
    timeout: 15_000,
  });

  await expect(
    page.getByRole("heading", { name: /votre score seo/i }),
  ).toBeVisible({ timeout: 90_000 });

  await expect(page.getByText("example.com").first()).toBeVisible();
  await expect(page.getByLabel(/score \d+ sur 100/i)).toBeVisible();
});
