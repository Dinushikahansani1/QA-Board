import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # --- 1. Registration ---
    page.goto("http://localhost:5173/register")
    page.get_by_label("Username").fill("testuser")
    page.get_by_label("Email").fill("test@example.com")
    page.get_by_label("Password").fill("password123")
    page.get_by_role("button", name="Register").click()
    # Wait for successful registration navigation
    expect(page).to_have_url(re.compile(r"/journeys$"))
    print("Registration successful.")

    # --- 2. Import Journey ---
    page.goto("http://localhost:5173/journeys/import")

    journey_name = "Selector Fix Test"
    journey_code = """
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://example.com');
  await page.getByRole('button', { name: 'Submit' }).first().click();
  await expect(page.locator('.success-message')).toBeVisible();
});
"""

    page.get_by_label("Journey Name").fill(journey_name)
    # The code editor is a div, not a standard input. We need to fill it carefully.
    page.locator('.cm-content').fill(journey_code)

    page.get_by_role("button", name="Import Journey").click()
    # Wait for import to finish and redirect
    expect(page).to_have_url(re.compile(r"/journeys$"))
    print("Journey import successful.")

    # --- 3. Navigate to Editor ---
    # Find the journey we just created and click its edit button
    journey_row = page.get_by_role("row", name=re.compile(journey_name))
    # The edit button is a link with an aria-label
    edit_button = journey_row.get_by_label("Edit Journey")
    edit_button.click()

    # Wait for the editor to load
    expect(page).to_have_url(re.compile(r"/journeys/edit/"))
    expect(page.get_by_role("heading", name="Edit Journey")).to_be_visible()
    print("Navigated to journey editor.")

    # --- 4. Screenshot ---
    # The selector field should now display the formatted text
    selector_field = page.get_by_label("Selector")

    # We expect the value to be the formatted string
    expect(selector_field.nth(0)).to_have_value("getByRole('button', {\"name\":\"Submit\"}).first()")
    expect(selector_field.nth(1)).to_have_value(".success-message")

    print("Selector formatting is correct. Taking screenshot...")

    page.screenshot(path="jules-scratch/verification/verification.png")
    print("Screenshot saved to jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
