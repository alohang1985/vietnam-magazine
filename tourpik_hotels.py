from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto("https://www.tourpik.com")

        # 페이지 로드 충분한 대기
        page.wait_for_selector("ul.hotel-list > li", timeout=10000)

        hotels = []
        for hotel_el in page.query_selector_all("ul.hotel-list > li"):
            name_el = hotel_el.query_selector("h5.hotel-name")
            price_el = hotel_el.query_selector("span.price")
            discount_el = hotel_el.query_selector("span.discount")
            link_el = hotel_el.query_selector("a")

            name = name_el.inner_text().strip() if name_el else ""
            price = price_el.inner_text().strip() if price_el else ""
            discount = discount_el.inner_text().strip() if discount_el else ""
            link = link_el.get_attribute("href").strip() if link_el else ""

            hotels.append({
                "name": name,
                "price": price,
                "discount": discount,
                "link": link
            })

        for h in hotels:
            print(h)

        browser.close()

if __name__ == "__main__":
    run()
