import os, requests, time, json, datetime, subprocess

# Try to get API key from macOS Keychain
try:
    api_key = subprocess.run(["security","find-generic-password","-a", os.getenv('USER'), "-s", "YT_API_KEY", "-w"], capture_output=True, text=True).stdout.strip()
except Exception:
    api_key = None

if not api_key:
    api_key = os.environ.get('YT_API_KEY')

if not api_key:
    raise SystemExit('YT_API_KEY not found in Keychain or ENV')

# Parameters
regionCode = 'US'  # global trending via regionCode omitted; YouTube trending endpoint uses regionCode; we'll fetch multiple regions not supported here. Use '' to fetch most popular globally via no region? Use US as proxy.
published_after = (datetime.datetime.utcnow() - datetime.timedelta(days=30))

# Get mostPopular videos via videos.list?chart=mostPopular
videos_url = 'https://www.googleapis.com/youtube/v3/videos'
params = {
    'part': 'snippet,statistics',
    'chart': 'mostPopular',
    'maxResults': 50,
    'regionCode': 'US',
    'key': api_key
}

r = requests.get(videos_url, params=params, timeout=10)
r.raise_for_status()
items = r.json().get('items', [])

candidates = []
for it in items:
    try:
        publishedAt = it['snippet'].get('publishedAt')
        published_dt = datetime.datetime.fromisoformat(publishedAt.replace('Z','+00:00'))
        if published_dt < published_after:
            continue
        viewCount = int(it.get('statistics', {}).get('viewCount', 0))
        channelId = it['snippet'].get('channelId')
        videoId = it['id']
        # get channel stats
        ch_url = 'https://www.googleapis.com/youtube/v3/channels'
        ch_params = {'part':'statistics','id':channelId,'key':api_key}
        ch_r = requests.get(ch_url, params=ch_params, timeout=10)
        ch_r.raise_for_status()
        ch_items = ch_r.json().get('items', [])
        if not ch_items:
            continue
        subs = int(ch_items[0]['statistics'].get('subscriberCount', 0) or 0)
        if subs < viewCount / 10:
            candidates.append({
                'videoId': videoId,
                'title': it['snippet'].get('title'),
                'channelTitle': it['snippet'].get('channelTitle'),
                'publishedAt': publishedAt,
                'viewCount': viewCount,
                'subscriberCount': subs,
                'url': f'https://www.youtube.com/watch?v={videoId}'
            })
        time.sleep(0.1)
    except Exception as e:
        continue

# sort by viewCount desc and take top 10
THRESHOLD_FACTOR = 5  # condition: subscriber * 5 < viewCount
candidates = [c for c in candidates if c['subscriberCount'] * THRESHOLD_FACTOR < c['viewCount']]
candidates.sort(key=lambda x: x['viewCount'], reverse=True)
top10 = candidates[:10]

out_path = os.path.join(os.path.dirname(__file__), 'trending_sub_ratio_top10.json')
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(top10, f, ensure_ascii=False, indent=2)

for i,v in enumerate(top10,1):
    print(f"{i}. {v['title']}")
    print(f"   채널: {v['channelTitle']} | 조회수: {v['viewCount']} | 구독자: {v['subscriberCount']} | 업로드: {v['publishedAt']}")
    print(f"   링크: {v['url']}")
    print()

print('Saved', out_path)
