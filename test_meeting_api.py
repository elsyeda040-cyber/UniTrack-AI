import urllib.request, json, sys, os

BASE_URL = os.getenv('API_URL', 'http://127.0.0.1:8000')
sys.stdout.reconfigure(encoding='utf-8')

PASS = "✅ PASS"
FAIL = "❌ FAIL"

def req(path, method='GET', data=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json'}
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return True, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        try: return False, f"HTTP {e.code}: {e.read().decode()}"
        except: return False, f"HTTP {e.code}"
    except Exception as e:
        return False, str(e)

results = []

def test(name, success, res, check=None):
    ok = success and (check(res) if check else True)
    status = PASS if ok else FAIL
    detail = ""
    if success and isinstance(res, dict): detail = str(res)[:120]
    elif success and isinstance(res, list): detail = f"[{len(res)} items] " + str(res[0])[:80] if res else "[]"
    else: detail = str(res)[:120]
    print(f"{status}  {name}")
    print(f"     → {detail}\n")
    results.append((name, ok))

print("=" * 60)
print("  🎥 Meeting Assistant - Backend API Tests")
print("=" * 60 + "\n")

# ── 1. GET Chat Messages ──
ok, res = req('/teams/team-001/messages')
test("GET /teams/team-001/messages (Chat History)", ok, res, lambda r: isinstance(r, list))

# ── 2. POST Send Chat Message ──
ok, res = req('/teams/team-001/messages', 'POST', {
    "sender_id": "stu-001",
    "text": "Testing meeting chat from API test script 🧪",
    "type": "text"
})
test("POST /teams/team-001/messages (Send Chat)", ok, res, lambda r: r.get('id') is not None)

# ── 3. POST Chat Summary (AI) ──
ok, res = req('/teams/team-001/chat-summary', 'POST')
test("POST /teams/team-001/chat-summary (AI Chat Summary)", ok, res, lambda r: 'summary' in r)

# ── 4. GET Meetings ──
ok, res = req('/teams/team-001/meetings')
test("GET /teams/team-001/meetings (Meeting History)", ok, res, lambda r: isinstance(r, list))

# ── 5. POST Create Meeting + AI Summary ──
ok, res = req('/teams/team-001/meetings', 'POST', {
    "team_id": "team-001",
    "title": "Sprint Review Meeting",
    "date": "2026-04-15T10:00:00",
    "transcript": "Ahmed: I finished the UI design for the login page. Sara: The backend API is ready. The team agreed to test the full flow next session.",
    "summary": "",
    "action_items": ""
})
test("POST /teams/team-001/meetings (Create Meeting + AI Summary)", ok, res, lambda r: r.get('id') is not None)

# ── 6. GET Notifications (used after sending message) ──
ok, res = req('/users/stu-001/notifications')
test("GET /users/stu-001/notifications (Post-Chat Notifications)", ok, res, lambda r: isinstance(r, list))

# ── 7. POST Clear Chat Notifications ──
ok, res = req('/users/stu-001/notifications/clear-chat', 'POST')
test("POST /users/stu-001/notifications/clear-chat (Clear Chat Notifs)", ok, res, lambda r: r.get('status') == 'success')

# ── 8. GET Team Files (Attachments panel in meeting) ──
ok, res = req('/teams/team-001/files')
test("GET /teams/team-001/files (Meeting Attachments)", ok, res, lambda r: isinstance(r, list))

# ── 9. GET Participants = Users of team ──
ok, res = req('/teams/team-001/tasks')
test("GET /teams/team-001/tasks (Task Context for Meeting)", ok, res, lambda r: isinstance(r, list))

# ── 10. AI Chat (Copilot) ──
ok, res = req('/ai/chat', 'POST', {
    "message": "Summarize the key points from our meeting about the AI Library System project.",
    "context": "You are an AI Meeting Copilot for a university project management app."
})
test("POST /ai/chat (AI Copilot in Meeting)", ok, res, lambda r: 'response' in r)

# ── Summary ──
print("=" * 60)
total = len(results)
passed = sum(1 for _, ok in results if ok)
print(f"\n📊 Results: {passed}/{total} tests passed")
if passed == total:
    print("🎉 All meeting backend APIs are working correctly!\n")
else:
    print("\n⚠️  Failed tests:")
    for name, ok in results:
        if not ok:
            print(f"   ❌ {name}")
print("=" * 60)
