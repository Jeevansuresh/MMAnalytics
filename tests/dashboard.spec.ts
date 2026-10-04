import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const screens = ["overview", "campuses", "growth", "sparks", "retention"];
for (const screen of screens) {
  test(`${screen}: screenshot, filters, and all data states`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/${screen}`);
    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      screen[0].toUpperCase() + screen.slice(1),
    );
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await mkdir("docs/screenshots", { recursive: true });
    await page.screenshot({
      path: `docs/screenshots/${screen}-${testInfo.project.name}.png`,
      fullPage: false,
      animations: "disabled",
    });
    await page.screenshot({
      path: `docs/screenshots/${screen}-${testInfo.project.name}-full.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.getByLabel("Date range", { exact: true }).selectOption("7");
    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    await page.getByLabel("Campus filter").selectOption("jain");
    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    await page.getByLabel("Preview data state").selectOption("loading");
    await expect(
      page.getByRole("status", { name: "Loading dashboard" }),
    ).toBeVisible();
    await page.getByLabel("Preview data state").selectOption("empty");
    await expect(
      page.getByRole("heading", { name: "No activity in this window" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Reset filters" }).click();
    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    await page.getByLabel("Preview data state").selectOption("error");
    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "We couldn’t load your metrics",
    );
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByTestId("dashboard-ready")).toBeVisible();
    expect(errors).toEqual([]);
  });
}
test("login accepts empty input, themes work, and roles gate campus data", async ({
  page,
}, testInfo) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Open dashboard" }).click();
  await expect(page).toHaveURL(/overview/);
  await expect(page.getByTestId("dashboard-ready")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({
    path: `docs/screenshots/overview-light-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel("Preview role").selectOption("campus_lead");
  await expect(page.getByTestId("dashboard-ready")).toBeVisible();
  await expect(page.getByLabel("Campus filter")).toBeDisabled();
  await expect(page.getByLabel("Campus filter").locator("option")).toHaveCount(
    1,
  );
  await expect(page.getByLabel("Campus filter")).toHaveValue("christ");
  await expect(page.getByText("Jain University", { exact: true })).toHaveCount(
    0,
  );
  await page.getByLabel("Preview role").selectOption("admin");
  await expect(page.getByTestId("dashboard-ready")).toBeVisible();
  await page.getByRole("button", { name: "Manage users" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByLabel("Account label").fill("Campus team preview");
  await page.getByRole("button", { name: "Add preview user" }).click();
  await expect(
    page.getByText("Campus team preview", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Disable", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("button", { name: "Enable", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close user management" }).click();
});
test("custom date validation and no data outside the fixture window", async ({
  page,
}) => {
  await page.goto("/overview");
  await expect(page.getByTestId("dashboard-ready")).toBeVisible();
  await page.getByLabel("Date range", { exact: true }).selectOption("custom");
  await page.getByLabel("From date").fill("2025-01-28");
  await page.getByLabel("To date").fill("2025-01-01");
  await page.getByRole("button", { name: "Apply dates" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Choose a range",
  );
  await page.getByLabel("From date").fill("2025-01-01");
  await page.getByLabel("To date").fill("2025-01-28");
  await page.getByRole("button", { name: "Apply dates" }).click();
  await expect(
    page.getByRole("heading", { name: "No activity in this window" }),
  ).toBeVisible();
});
