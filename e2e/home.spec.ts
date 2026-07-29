import { expect, test } from "@playwright/test";

test("landing is a single CTA: brand + domain + score desire", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: "SEO Copilot" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /faites trouver votre entreprise/i,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Votre domaine")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /voir mon score/i }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /connexion/i })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /inclus aujourd/i }),
  ).toHaveCount(0);
});

test("demo audit shows score and issue cards", async ({ page }) => {
  await page.goto("/audits/demo");

  await expect(
    page.getByRole("heading", { name: /votre score/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /commencez par ici/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/description google à rédiger/i).first(),
  ).toBeVisible();
});

test("full audit flow on example.com", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("Votre domaine")).toBeVisible();

  await page.getByLabel("Votre domaine").fill("https://example.com/foo");

  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/audits") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: /voir mon score/i }).click();
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
    page.getByRole("heading", { name: /votre score/i }),
  ).toBeVisible({ timeout: 90_000 });

  await expect(page.getByText("example.com").first()).toBeVisible();
  await expect(page.getByLabel(/score \d+ sur 100/i)).toBeVisible();
});
