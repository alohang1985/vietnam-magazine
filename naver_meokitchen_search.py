from playwright.sync_api import sync_playwright
import datetime

one_day_ago = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime('%Y.%m.%d')

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        url = 'https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=%ED%91%B8%EA%BE%B8%EC%98%A5&nso=p%3A1d'
        page.goto(url)

        page.wait_for_selector('div.api_subject_bx')
        posts = page.query_selector_all('div.api_subject_bx')

        results = []
        for post in posts[:10]:
            title_el = post.query_selector('a.api_txt_lines')
            title = title_el.inner_text().strip() if title_el else ''
            link = title_el.get_attribute('href') if title_el else ''
            results.append({'title': title, 'link': link})

        for r in results:
            print(r)

        input('Press Enter to exit...')
        browser.close()

if __name__ == '__main__':
    run()
