const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial", timeout: 480000 });

async function stabilizeUi(page) {
  await page.addStyleTag({
    content: `
      #viewport,
      #viewport canvas,
      #statusToast {
        visibility: hidden !important;
      }

      .viewport-wrap {
        background: #12171f !important;
      }

      *,
      *::before,
      *::after {
        transition: none !important;
        animation: none !important;
      }
    `
  });
}

async function expectSnapshot(page, locator, name) {
  await locator.evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "center" });
  });

  const box = await locator.boundingBox();
  expect(box).not.toBeNull();

  const screenshot = await page.screenshot({
    clip: {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height
    },
    animations: "disabled",
    caret: "hide"
  });

  expect(screenshot).toMatchSnapshot(name, { maxDiffPixels: 2000 });
}

test("ui layout baselines", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#drawerToggle");
  await page.waitForTimeout(300);
  await stabilizeUi(page);
  await expectSnapshot(page, page.locator(".viewport-wrap"), "default-layout.png");
  await page.getByRole("button", { name: "Controls" }).click();
  await expect(page.locator("#immersiveDrawer")).toHaveClass(/show/);
  await expectSnapshot(page, page.locator("#immersiveDrawer"), "drawer-layout.png");

  await page.getByRole("switch").click();
  await page.locator('[data-setting="posterType"][data-value="balloon"]').click();
  await page.locator('[data-setting="lightingPreset"][data-value="warmRoom"]').click();
  await page.locator("#distanceRange").evaluate((input) => {
    input.value = "6.5";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(150);
  await expectSnapshot(page, page.locator("#immersiveDrawer"), "drawer-updated-state.png");

  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.locator("#immersiveDrawer")).not.toHaveClass(/show/);

  await page.locator('[aria-label="Increase left sphere"]').click();
  await page.locator('[aria-label="Increase left cylinder"]').click();
  await page.locator("#axisDialLeft").focus();
  await page.keyboard.press("ArrowRight");
  await expectSnapshot(page, page.locator(".viewport-wrap"), "hud-adjusted-state.png");

  await page.getByRole("button", { name: "Reset" }).click();
  await expectSnapshot(page, page.locator(".viewport-wrap"), "reset-state.png");

  await page.getByRole("button", { name: "Help" }).click();
  await expect(page.locator("#shortcutOverlay")).toBeVisible();
  await expectSnapshot(page, page.locator("#shortcutOverlay .modal-dialog"), "quick-controls-layout.png");

  await page.getByRole("button", { name: "Close quick controls" }).click();
  await expect(page.locator("#shortcutOverlay")).not.toBeVisible();

  await page.getByRole("button", { name: "Help" }).click();
  await expect(page.locator("#shortcutOverlay")).toBeVisible();
  await page.locator("#shortcutOverlay").click({ position: { x: 12, y: 12 } });
  await expect(page.locator("#shortcutOverlay")).not.toBeVisible();

  await page.keyboard.press("?");
  await expect(page.locator("#shortcutOverlay")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#shortcutOverlay")).not.toBeVisible();
});

test("desktop shell stays contained at narrower widths", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#drawerToggle");
  await page.waitForTimeout(300);
  await stabilizeUi(page);

  const selectors = [".command-bar", "#hudLeftCard", "#hudRightCard", ".status-dock"];
  for (const selector of selectors) {
    const box = await page.locator(selector).boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(1280);
    expect(box.y + box.height).toBeLessThanOrEqual(800);
  }

  await page.getByRole("button", { name: "Controls" }).click();
  const drawerBox = await page.locator("#immersiveDrawer").boundingBox();
  expect(drawerBox).not.toBeNull();
  expect(drawerBox.width).toBeLessThanOrEqual(392);
  expect(drawerBox.height).toBeLessThanOrEqual(800);
});
