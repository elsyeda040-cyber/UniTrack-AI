import urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')
req = urllib.request.Request('https://unitrack-backend-production-6cb0.up.railway.app/ai/chat', data=json.dumps({'message':'ما هو الوقت وتاريخ اليوم؟'}).encode(), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as r: 
        print('SUCCESS:', r.read().decode())
except Exception as e:
    print('ERROR:', e.read().decode() if hasattr(e, 'read') else str(e))
