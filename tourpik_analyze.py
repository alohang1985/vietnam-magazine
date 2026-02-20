from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://www.tourpik.com")
        print("Page title:", page.title())
        # 주요 섹션 텍스트 추출
        content = page.inner_text("body")
        snippet = content[:1000]  # 중요한 내용 일부만 출력
        print("Page content snippet:", snippet)
        browser.close()

if __name__ == "__main__":
    run()
