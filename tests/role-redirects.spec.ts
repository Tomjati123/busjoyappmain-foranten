import { expect, test } from "@playwright/test";

const roleCases = [
  { role: "staff", startPath: "/login", expectedPath: "/staff" },
  { role: "staff", startPath: "/admin", expectedPath: "/staff" },
  { role: "admin", startPath: "/login", expectedPath: "/admin" },
  { role: "admin", startPath: "/staff", expectedPath: "/admin" },
  { role: "passenger", startPath: "/admin", expectedPath: "/passenger" },
];

for (const { role, startPath, expectedPath } of roleCases) {
  test(`${role} visiting ${startPath} redirects to ${expectedPath}`, async ({ page }) => {
    await page.goto("/");
    await page.evaluate((currentRole) => {
      window.localStorage.setItem("token", "test-token");
      window.localStorage.setItem(
        "user",
        JSON.stringify({ id: 1, email: `${currentRole}@example.com`, role: currentRole })
      );
    }, role);

    await page.goto(startPath);
    await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
  });
}
