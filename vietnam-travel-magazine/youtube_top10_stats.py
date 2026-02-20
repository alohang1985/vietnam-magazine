import os, requests, json, time

API_KEY = os.environ.get("YT_API_KEY")
if not API_KEY:
    raise SystemExit("환경변수 YT_API_KEY 를 설정하세요.")

# Top10 채널 검색어 리스트 (필요하면 수정하세요)
channel_queries = [
  "생활코딩","드림코딩","노마드코더","나도코딩","코딩애플",
  "김왼손","조코딩","코드잇","개발바닥","토비의 스프링"
]

def get_channel_id_by_query(q):
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {"part":"snippet","q":q,"type":"channel","key":API_KEY,"maxResults":1}
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    items = r.json().get("items", [])
    if not items:
        return None
    return items[0]["snippet"]["channelId"]

def get_stats_for_channel_id(cid):
    url = "https://www.googleapis.com/youtube/v3/channels"
    params = {"part":"statistics,snippet","id":cid,"key":API_KEY}
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    items = r.json().get("items", [])
    if not items:
        return None
    it = items[0]
    return {
        "channelId": cid,
        "title": it["snippet"].get("title"),
        "subs": it["statistics"].get("subscriberCount"),
        "views": it["statistics"].get("viewCount"),
        "videoCount": it["statistics"].get("videoCount"),
        "url": f"https://www.youtube.com/channel/{cid}"
    }

results = []
for q in channel_queries:
    try:
        cid = get_channel_id_by_query(q)
        time.sleep(0.2)
        if not cid:
            results.append({"query": q, "error": "채널ID 못찾음"})
            continue
        stats = get_stats_for_channel_id(cid)
        if not stats:
            results.append({"query": q, "channelId": cid, "error": "통계 없음"})
            continue
        results.append({"query": q, **stats})
    except Exception as e:
        results.append({"query": q, "error": str(e)})

# 결과 저장 및 출력
out_path = os.path.join(os.path.dirname(__file__), "youtube_top10_stats.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

for r in results:
    print(r)
print(f"Saved {out_path}")
