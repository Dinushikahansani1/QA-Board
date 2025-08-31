from playwright.sync_api import sync_playwright, expect

def test_registration():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the login page
        page.goto("http://localhost:5173/login")

        # Click the "Register" link
        register_link = page.get_by_role("link", name="Register")
        register_link.click()

        # Fill out the registration form
        email_field = page.get_by_label("Email")
        password_field = page.get_by_label("Password")
        email_field.fill("test@example.com")
        password_field.fill("password123")

        # Click the "Create account" button
        create_account_button = page.get_by_role("button", name="Create account")
        create_account_button.click()

        # Verify that the user is redirected to the dashboard
        expect(page).to_have_url("http://localhost:5173/")
        welcome_message = page.get_by_role("heading", name="Welcome, test@example.com")
        expect(welcome_message).to_be_visible()

        # Take a screenshot of the dashboard
        page.screenshot(path="jules-scratch/verification/verification.png")

        browser.close()

if __name__ == "__main__":
    test_registration()
