import tempfile
import shutil
from playwright.sync_api import sync_playwright

def run():
    temp_dir = tempfile.mkdtemp(prefix="chrome-profile-")
    print(f"Using temporary chrome profile at {temp_dir}")
    try:
        with sync_playwright() as p:
            context = p.chromium.launch_persistent_context(
                user_data_dir=temp_dir,
                headless=False,
                channel="chrome"
            )
            page = context.new_page()
            page.goto("https://gemini.google.com/u/3/app")
            print(page.title())
            input("Press Enter to exit...")
            context.close()
    finally:
        shutil.rmtree(temp_dir)

if __name__ == "__main__":
    run()
