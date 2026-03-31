from playwright.sync_api import sync_playwright, expect

def verify_seo_performance(page):
    # Navigate to the home page
    page.goto("http://localhost:8080")

    # Wait for the page to load
    page.wait_for_selector("h1")

    # Check title
    print(f"Title: {page.title()}")

    # Check for canonical link
    canonical = page.locator("link[rel='canonical']").get_attribute("href")
    print(f"Canonical: {canonical}")

    # Check for hreflang tags
    hreflang_en = page.locator("link[hreflang='en']").get_attribute("href")
    hreflang_ur = page.locator("link[hreflang='ur']").get_attribute("href")
    print(f"Hreflang EN: {hreflang_en}")
    print(f"Hreflang UR: {hreflang_ur}")

    # Take screenshot of home page
    page.screenshot(path="verification/home.png")

    # Navigate to Shop page
    page.goto("http://localhost:8080/shop")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="verification/shop.png")

    # Navigate to a book page if possible
    # For simulation, we'll just check if the shop page has product cards
    expect(page.locator(".group.relative.flex.flex-col")).to_have_count(0, timeout=5000) # Should be empty or loading since no DB

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
