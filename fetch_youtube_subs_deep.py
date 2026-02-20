from playwright.sync_api import sync_playwright
import json, re, time

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
            time.sleep(2)
            # Try direct selector
            subs = ''
            try:
                el = page.query_selector('yt-formatted-string#subscriber-count')
                if el:
                    subs = el.inner_text().strip()
            except:
                pass
            if not subs:
                # Try alternative span
                try:
                    el = page.query_selector('span.yt-subscription-button-subscriber-count')
                    if el:
                        subs = el.inner_text().strip()
                except:
                    pass
            if not subs:
                # Try to locate in ytInitialData script
                body = page.content()
                m = re.search(r'"subscriberCountText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"', body)
                if m:
                    subs = m.group(1)
            if not subs:
                # Fallback regex search in visible text
                txt = page.inner_text('body')
                m = re.search(r"([0-9,.]+)\s*(subscribers|구독자)", txt, re.I)
                if m:
                    subs = m.group(1)
            if not subs:
                # Save screenshot for debugging
                fname = f"debug_{name.replace(' ','_')}.png"
                page.screenshot(path=fname, full_page=False)
                print(f"Saved screenshot {fname}")
            results.append({'name':name,'url':url,'subs':subs or 'N/A'})
            print(f"{name}: {subs or 'N/A'}")
        except Exception as e:
            results.append({'name':name,'url':url,'subs':f'ERROR: {e}'})
            print(f"{name}: ERROR: {e}")
        finally:
            page.close()
    browser.close()

with open('youtube_subs_results_deep.json','w') as f:
    json.dump(results,f,ensure_ascii=False,indent=2)

print('Saved results to youtube_subs_results_deep.json')
