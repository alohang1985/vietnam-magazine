from playwright.sync_api import sync_playwright
import datetime

# 하루 전 날짜 계산
one_day_ago = (datetime.datetime.now() - datetime.timedelta(days=1)).strftime('%Y.%m.%d')


def run():
    print('Starting Gemini search script...')
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        # 네이버 블로그 검색 URL (날짜 필터 등 추후 추가 조정 필요)
        url = f'https://search.naver.com/search.naver?where=post&query=%EB%A9%94%EC%98%A4%ED%82%A4%EC%B9%9C&date_from={one_day_ago}&date_to={one_day_ago}'
        print(f'Navigating to {url}')
        page.goto(url)

        print('Waiting for search results to load...')
        page.wait_for_selector('ul.list_search')
        posts = page.query_selector_all('ul.list_search li')

        results = []
        for post in posts[:10]:  # 상위 10개 추출
            title_el = post.query_selector('a.sh_blog_title')
            if not title_el:
                title_el = post.query_selector('a.api_txt_lines')
            title = title_el.inner_text().strip() if title_el else ''
            link = title_el.get_attribute('href') if title_el else ''
            results.append({'title': title, 'link': link})

        print('Search results:')
        for r in results:
            print(r)

        input('Press Enter to exit...')
        browser.close()


if __name__ == '__main__':
    run()
