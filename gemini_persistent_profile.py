from playwright.sync_api import sync_playwright

def run():
    user_data_dir = "/Users/youngdonjang/Library/Application Support/Google/Chrome"  # Mac 크롬 기본 프로필 경로
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(user_data_dir=user_data_dir, headless=False, channel="chrome")
        page = context.new_page()
        page.goto("https://gemini.google.com/u/3/app")
        print(page.title())
        input("Press Enter to exit...")
        context.close()

if __name__ == "__main__":
    run()
