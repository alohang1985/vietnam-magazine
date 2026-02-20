from playwright.sync_api import sync_playwright

channels = [
    ("생활코딩","https://www.youtube.com/@coohde"),
    ("드림코딩 by 엘리","https://www.youtube.com/@DreamCoding"),
    ("노마드코더","https://www.youtube.com/@nomadcoders"),
    ("나도코딩","https://www.youtube.com/@nadocoding"),
    ("코딩애플","https://www.youtube.com/@codingapple"),
    ("김왼손","https://www.youtube.com/results?search_query=%EA%B9%80%EC%99%BC%EC%86%90"),
    ("조코딩","https://www.youtube.com/@joCoding"),
    ("코드잇","https://www.youtube.com/@codeitkr"),
    ("개발바닥","https://www.youtube.com/@devbadak"),
    ("토비의 스프링","https://www.youtube.com/user/toby")
]

results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    for name, url in channels:
        try:
            page.goto(url, timeout=30000)
            # wait for subscriber count element
            page.wait_for_selector('yt-formatted-string#subscriber-count, span.yt-subscription-button-subscriber-count', timeout=15000)
            # try common selectors
            subs = ''
            try:
                subs = page.query_selector('yt-formatted-string#subscriber-count').inner_text().strip()
            except:
                try:
                    subs = page.query_selector('span.yt-subscription-button-subscriber-count').inner_text().strip()
                except:
                    subs = ''
            if not subs:
                # fallback: find element that contains "subscribers" or '구독자'
                text = page.inner_text('body')
                # try to locate pattern
                import re
                m = re.search(r"([0-9,.]+)\s*(subscribers|구독자)", text, re.I)
                if m:
                    subs = m.group(1)
            results.append({'name':name,'url':url,'subs':subs})
            print(f"{name}: {subs} | {url}")
        except Exception as e:
            results.append({'name':name,'url':url,'subs':f'ERROR: {e}'})
            print(f"{name}: ERROR: {e}")
    browser.close()

# Save results to file
import json
with open('youtube_subs_results.json','w') as f:
    json.dump(results,f,ensure_ascii=False,indent=2)

print('\nSaved results to youtube_subs_results.json')
