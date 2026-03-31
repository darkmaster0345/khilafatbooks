from playwright.sync_api import sync_playwright

def verify_seo_performance(page):
    # Navigate to the home page
    page.goto("http://localhost:8080", wait_until="networkidle")

    # Take screenshot of home page
    page.screenshot(path="verification/home.png")

    # Print the HTML head to check meta tags
    head_content = page.evaluate("document.head.innerHTML")
    with open("verification/head.txt", "w") as f:
        f.write(head_content)

    print("Verification complete.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_seo_performance(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
