from playwright.sync_api import sync_playwright
import time

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
    browser = p.chromium.launch(headless=False)
    for name, url in channels:
        page = browser.new_page()
        try:
            print(f"Visiting {name}: {url}")
            page.goto(url, timeout=60000)
            time.sleep(3)
            # try multiple selectors and scrolling
            subs = ''
            selectors = ['yt-formatted-string#subscriber-count', 'span.yt-subscription-button-subscriber-count', 'yt-formatted-string[subscribed]']
            found = False
            for sel in selectors:
                try:
                    el = page.query_selector(sel)
                    if el:
                        subs = el.inner_text().strip()
                        found = True
                        break
                except:
                    continue
            if not found:
                # scroll and wait
                page.evaluate('window.scrollBy(0, 400)')
                time.sleep(1)
                body = page.inner_text('body')
                import re
                m = re.search(r"([0-9,.]+)\s*(subscribers|구독자)", body, re.I)
                if m:
                    subs = m.group(1)
            results.append({'name':name,'url':url,'subs':subs or 'N/A'})
            print(f"{name}: {subs}")
        except Exception as e:
            results.append({'name':name,'url':url,'subs':f'ERROR: {e}'})
            print(f"{name}: ERROR: {e}")
        finally:
            page.close()
    browser.close()

import json
with open('youtube_subs_results_headful.json','w') as f:
    json.dump(results,f,ensure_ascii=False,indent=2)

print('\nSaved results to youtube_subs_results_headful.json')
