import os, requests, time, json, datetime

API_KEY = os.environ.get('YT_API_KEY')
if not API_KEY:
    raise SystemExit('환경변수 YT_API_KEY 를 설정하세요.')

# 검색 키워드 (한국어 포함 변형)
queries = ['OpenClaw', '오픈클로', '오픈 클로', '클로드봇', '몰트봇']

# 최근 5일 ISO timestamp
five_days_ago = (datetime.datetime.utcnow() - datetime.timedelta(days=5)).isoformat("T") + "Z"

search_url = 'https://www.googleapis.com/youtube/v3/search'
videos_url = 'https://www.googleapis.com/youtube/v3/videos'

found_video_ids = set()
video_items = []

for q in queries:
    params = {
        'part': 'snippet',
        'q': q,
        'type': 'video',
        'publishedAfter': five_days_ago,
        'regionCode': 'KR',
        'relevanceLanguage': 'ko',
        'maxResults': 50,
        'key': API_KEY
    }
    r = requests.get(search_url, params=params, timeout=10)
    r.raise_for_status()
    items = r.json().get('items', [])
    for it in items:
        vid = it['id']['videoId']
        if vid not in found_video_ids:
            found_video_ids.add(vid)
            video_items.append({'videoId': vid, 'snippet': it['snippet']})
    time.sleep(0.1)

if not video_items:
    print('최근 5일 내 대상 키워드로 올라온 동영상이 없습니다.')
    raise SystemExit(0)

# Batch video statistics (split into chunks of 50)
video_list = list(found_video_ids)
stats = []
for i in range(0, len(video_list), 50):
    chunk = video_list[i:i+50]
    params = {
        'part': 'snippet,statistics',
        'id': ','.join(chunk),
        'key': API_KEY
    }
    r = requests.get(videos_url, params=params, timeout=10)
    r.raise_for_status()
    for it in r.json().get('items', []):
        # Only keep Korean-language titles/descriptions heuristically
        title = it['snippet'].get('title','')
        desc = it['snippet'].get('description','')
        channelTitle = it['snippet'].get('channelTitle')
        publishedAt = it['snippet'].get('publishedAt')
        stats.append({
            'videoId': it['id'],
            'title': title,
            'description': desc,
            'channelTitle': channelTitle,
            'publishedAt': publishedAt,
            'viewCount': int(it.get('statistics', {}).get('viewCount', 0)),
            'likeCount': int(it.get('statistics', {}).get('likeCount', 0) or 0),
            'commentCount': int(it.get('statistics', {}).get('commentCount', 0) or 0),
            'url': f'https://www.youtube.com/watch?v={it["id"]}'
        })
    time.sleep(0.1)

# Filter to videos in Korean title/description or channel (simple heuristic)
def is_korean(text):
    # check for presence of Hangul
    return any('\uAC00' <= ch <= '\uD7A3' for ch in text)

filtered = [v for v in stats if is_korean(v['title']) or is_korean(v['description'])]
if not filtered:
    filtered = stats  # fallback

# Sort by viewCount desc and take top 10
filtered.sort(key=lambda x: x['viewCount'], reverse=True)
top10 = filtered[:10]

out_path = os.path.join(os.path.dirname(__file__), 'openclaw_recent_top10.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(top10, f, ensure_ascii=False, indent=2)

# Print concise table
for i, v in enumerate(top10, 1):
    print(f"{i}. {v['title']}")
    print(f"   채널: {v['channelTitle']} | 조회수: {v['viewCount']} | 업로드: {v['publishedAt']}")
    print(f"   링크: {v['url']}")
    print()

print('Saved', out_path)
