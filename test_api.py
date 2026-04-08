import urllib.request, json, sys, time, os

# Config
# Try local first, fallback to production if explicitly asked
BASE_URL = os.getenv('API_URL', 'http://127.0.0.1:8000')
sys.stdout.reconfigure(encoding='utf-8')

def make_request(path, method='GET', data=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json'}
    body = json.dumps(data).encode() if data else None
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return True, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try:
            return False, f"HTTP {e.code}: {e.read().decode()}"
        except:
            return False, f"HTTP {e.code}"
    except Exception as e:
        return False, str(e)

def format_res(res):
    if isinstance(res, dict):
        return json.dumps(res, ensure_ascii=False)[:100] + "..."
    return str(res)

def run_tests():
    print(f"🚀 Starting API Integration Tests for {BASE_URL}\n")
    
    # 1. Test Chat
    print("Test 1: AI Chat...")
    success, res = make_request('/ai/chat', 'POST', {'message': 'أهلاً، ما هو تاريخ اليوم؟'})
    print(f"  Result: {'✅' if success else '❌'} {res.get('response') if success and isinstance(res, dict) else format_res(res)}")

    # 2. Test Login
    print("\nTest 2: Student Login...")
    success, res = make_request('/auth/login', 'POST', {'email': 'ahmed@university.edu', 'password': 'password123'})
    print(f"  Result: {'✅' if success else '❌'} {f'User ID: {res.get('id')}' if success and isinstance(res, dict) else format_res(res)}")

    # 3. Test Team Tasks
    print("\nTest 3: Fetch Team Tasks...")
    success, res = make_request('/teams/team-001/tasks')
    print(f"  Result: {'✅' if success else '❌'} {f'Found {len(res)} tasks' if success and isinstance(res, list) else format_res(res)}")

    # 4. Test Scratchpad (GET)
    print("\nTest 4: Get Scratchpad...")
    success, res = make_request('/teams/team-001/scratchpad')
    print(f"  Result: {'✅' if success else '❌'} {f'Content length: {len(res.get('content', ''))}' if success and isinstance(res, dict) else format_res(res)}")

    # 5. Test Scratchpad (UPDATE)
    print("\nTest 5: Update Scratchpad...")
    test_content = f"Test updated at {time.strftime('%H:%M:%S')}"
    success, res = make_request('/teams/team-001/scratchpad', 'POST', {'team_id': 'team-001', 'content': test_content})
    print(f"  Result: {'✅' if success else '❌'} {f'Updated content: {res.get('content')}' if success and isinstance(res, dict) else format_res(res)}")

    # 6. Test AI Insights
    print("\nTest 6: Team AI Insights...")
    success, res = make_request('/teams/team-001/insights', 'POST')
    print(f"  Result: {'✅' if success else '❌'} {f'Health Score: {res.get('health_score')}' if success and isinstance(res, dict) else format_res(res)}")

    # 7. Test Syllabus Scraper
    print("\nTest 7: Syllabus Scraper...")
    success, res = make_request('/ai/scrape-syllabus', 'POST', {'message': 'كورس عن تطوير الويب باستخدام React و Python FastAPI.'})
    print(f"  Result: {'✅' if success else '❌'} {f'Resources found: {len(res.get('resources', []))}' if success and isinstance(res, dict) else format_res(res)}")

    # 8. Test Meeting Assistant
    print("\nTest 8: Meeting Assistant...")
    success, res = make_request('/teams/team-001/meetings', 'POST', {
        'team_id': 'team-001',
        'title': 'Project Sync #1',
        'transcript': 'Student A: I will finish the login. Student B: I will work on the database.'
    })
    print(f"  Result: {'✅' if success else '❌'} {f'Summary: {res.get('summary')}' if success else format_res(res)}")

    # 9. Test AI Auto-Documentation
    print("\nTest 9: AI Auto-Documentation...")
    success, res = make_request('/teams/team-001/generate-docs', 'POST')
    print(f"  Result: {'✅' if success else '❌'} {f'Doc: {res.get('title')}' if success else format_res(res)}")

    # 10. Test Career Navigator
    print("\nTest 10: Career Navigator...")
    success, res = make_request('/users/stu-001/analyze-career', 'POST')
    print(f"  Result: {'✅' if success else '❌'} {f'Career paths: {res.get('career_paths')}' if success else format_res(res)}")

    # 11. Test Help Market
    print("\nTest 11: Help Market...")
    success, res = make_request('/help-requests', 'POST', {
        'team_id': 'team-001',
        'user_id': 'stu-001',
        'title': 'Need help with SQLAlchemy',
        'description': 'Getting a 500 error on many-to-many relationship.',
        'bounty': 20
    })
    print(f"  Result: {'✅' if success else '❌'} {f'Posted: {res.get('title')}' if success else format_res(res)}")

    # 12. Test Smart Whiteboard
    print("\nTest 12: Smart Whiteboard...")
    success, res = make_request('/teams/team-001/whiteboard', 'POST', {
        'team_id': 'team-001',
        'data': 'data:image/png;base64,ivborw0kggo...'
    })
    print(f"  Result: {'✅' if success else '❌'} {f'Updated at: {res.get('last_updated')}' if success else format_res(res)}")

    # 13. Test Risk Assessment
    print("\nTest 13: Risk Assessment...")
    success, res = make_request('/teams/team-001/risk-assessment')
    print(f"  Result: {'✅' if success else '❌'} {f'Risk: {res.get('risk_level')}' if success and isinstance(res, dict) else format_res(res)}")

    # 14. Test Presentation Review
    print("\nTest 14: Presentation Coach Review...")
    success, res = make_request('/presentations/review', 'POST', {
        'user_id': 'stu-001',
        'team_id': 'team-001',
        'title': 'Final Presentation Draft',
        'score': 88,
        'review_json': '{"tone": "Confident", "speed": "Good"}'
    })
    print(f"  Result: {'✅' if success else '❌'} {f'Score: {res.get('score')}' if success else format_res(res)}")

    # 15. Test Code Mentor
    print("\nTest 15: AI Code Mentor...")
    success, res = make_request('/ai/code-review', 'POST', {
        'code': 'function add(a, b) { return a + b; }',
        'language': 'javascript'
    })
    print(f"  Result: {'✅' if success else '❌'} {f'AI Score: {res.get('score')}' if success else format_res(res)}")

    # 16. Test Risk Simulation
    print("\nTest 16: Project Risk Simulation...")
    success, res = make_request('/teams/team-001/simulate-risk', 'POST', {
        'team_id': 'team-001',
        'hypothetical_delays': [{'task_id': 'T1', 'delay_days': 12}]
    })
    print(f"  Result: {'✅' if success else '❌'} {f'Simulated Risk: {res.get('projected_risk')}' if success else format_res(res)}")

    # 17. Test Skill Matrix
    print("\nTest 17: Skill-Matrix Heatmap...")
    success, res = make_request('/teams/team-001/skill-matrix')
    print(f"  Result: {'✅' if success else '❌'} {f'Members: {len(res.get('matrix', []))}' if success else format_res(res)}")

    # 18. Test Voice Command
    print("\nTest 18: Smart Voice Command...")
    success, res = make_request('/ai/voice-command', 'POST', {'message': 'أنشئ مهمة جديدة لتصميم الشعار'})
    print(f"  Result: {'✅' if success else '❌'} {f'Status: {res.get('status')}' if success else format_res(res)}")

    print("\n✨ All Integration Tests Completed!")

if __name__ == "__main__":
    run_tests()
