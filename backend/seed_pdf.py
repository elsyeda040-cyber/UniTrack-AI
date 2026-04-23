import sqlite3
import re
import hashlib
import unicodedata
import os

# Connect to the database
db_path = os.path.join(os.getcwd(), 'unitrack.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get existing users and teams to avoid duplicates
cur.execute("SELECT id, name FROM users")
existing_users = {row[0]: row[1] for row in cur.fetchall()}
cur.execute("SELECT id FROM teams")
existing_teams = set(row[0] for row in cur.fetchall())

# Helper function for deterministic IDs
def hash_id(role, name):
    return f"{role}_{hashlib.md5(name.encode('utf-8')).hexdigest()[:8]}"

arabic_to_english = {
    'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's',
    'ض': 'd', 'ط': 't', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y',
    'ة': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ى': 'a', 'ئ': 'e', 'ؤ': 'o'
}

def transliterate(word):
    word = unicodedata.normalize('NFKC', word)
    res = []
    for char in word:
        if char in arabic_to_english:
            res.append(arabic_to_english[char])
        elif char.isalpha() and char.isascii():
            res.append(char)
    return "".join(res)

def fix_reversed_arabic(text):
    if not text: return text
    # Basic check: if it starts with a number and seems reversed
    # For UniTrack, we mainly care about names and titles
    return text # The PDF extraction seems to have correct order for most text now, but if it's reversed we can add logic here

# Load and Normalize text
raw_text = open(r'd:\Unit Tiack AI\extracted_pdf.txt', encoding='utf-8').read()
text = unicodedata.normalize('NFKC', raw_text)

# Split by project marker
# We look for 'NUM : المشروع رقم' or 'المشروع رقم NUM :'
project_blocks = re.split(r'\d+\s*:\s*المشروع\s+رقم|المشروع\s+رقم\s*\d+\s*:', text)
if len(project_blocks) > 0 and not project_blocks[0].strip():
    project_blocks = project_blocks[1:]

# Find all project numbers to map them to blocks
project_nums = re.findall(r'(\d+)\s*:\s*المشروع\s+رقم|المشروع\s+رقم\s*(\d+)\s*:', text)
project_nums = [int(m[0] or m[1]) for m in project_nums]

projects = []
for i, block in enumerate(project_blocks):
    if i >= len(project_nums): break
    num = project_nums[i]
    lines = [l.strip() for l in block.split('\n') if l.strip()]
    
    project = {
        'id': f"T-{num:03d}",
        'num': num,
        'title': f"Project {num}",
        'professor': 'Unknown',
        'assistant': 'Unknown',
        'students': []
    }
    
    for line in lines:
        if 'عنوان' in line and ':' in line:
            project['title'] = line.split(':', 1)[1].strip()
        elif 'المشرف الرئيسي' in line or 'المشرف الرئيسى' in line:
            if ':' in line:
                project['professor'] = line.split(':', 1)[1].strip()
        elif 'المساعدون المشرفون' in line or 'المشرفون المساعدون' in line:
            if ':' in line:
                project['assistant'] = line.split(':', 1)[1].strip()
        
        # Student line: Digit ID Name
        # Example: '1 2202820 حجاج احمد حجاج ابراهيم'
        student_match = re.match(r'^(\d+)\s+(\d{7,8})\s+(.+)$', line)
        if student_match:
            project['students'].append({
                'code': student_match.group(2),
                'name': student_match.group(3).strip()
            })
            
    projects.append(project)

print(f"Parsed {len(projects)} projects.")

# Extract Professors and Assistants
prof_emails_cache = {}
professors = {}
assistants = {}

for p in projects:
    prof_name = p['professor']
    ast_name = p['assistant']
    
    if prof_name not in professors:
        # Transliterate the last word of the reversed raw prof name (which is the first name)
        words = [w for w in prof_name.split() if w and '/' not in w]
        if words:
            first_name_arabic = words[-1]
            eng_name = transliterate(first_name_arabic)
            if not eng_name:
                eng_name = f"doctor{len(professors)+1}"
            email = f"{eng_name}@dhic.edu.eg".lower()
            
            counter = 1
            while email in prof_emails_cache.values():
                email = f"{eng_name}{counter}@dhic.edu.eg".lower()
                counter += 1
            prof_emails_cache[first_name_arabic] = email
        else:
            email = f"prof_{len(professors)+1}@dhic.edu.eg"
        professors[prof_name] = email

    if ast_name not in assistants:
        assistants[ast_name] = f"ast_{len(assistants)+1}@dhic.edu.eg"

# Insert users
users_to_insert = []
# Professors
for name, email in professors.items():
    uid = hash_id('prof', name)
    if uid not in existing_users:
        users_to_insert.append((uid, name, email, 'professor', 'password', '', 100))
# Assistants
for name, email in assistants.items():
    uid = hash_id('ast', name)
    if uid not in existing_users:
        users_to_insert.append((uid, name, email, 'assistant', 'password', '', 100))

# Students
for p in projects:
    for s in p['students']:
        uid = f"s_{s['code']}"
        email = f"s{s['code']}@dhic.edu.eg"
        if uid not in existing_users:
            users_to_insert.append((uid, s['name'], email, 'student', 'password', '', 100))
            existing_users[uid] = s['name']

cur.executemany("""
    INSERT OR REPLACE INTO users (id, name, email, role, hashed_password, avatar, credits)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", users_to_insert)

# Insert teams
for p in projects:
    prof_id = hash_id('prof', p['professor'])
    ast_id = hash_id('ast', p['assistant'])
    
    cur.execute("""
        INSERT OR REPLACE INTO teams (id, name, project_title, progress, color, emoji, professor_id, assistant_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (p['id'], f"Team {p['num']}", p['title'], 0, '#3b82f6', '🚀', prof_id, ast_id))
    
    # Link students
    cur.execute("DELETE FROM team_students WHERE team_id = ?", (p['id'],))
    for s in p['students']:
        cur.execute("INSERT INTO team_students (team_id, student_id) VALUES (?, ?)", (p['id'], f"s_{s['code']}"))

conn.commit()
conn.close()
print(f"Successfully seeded {len(projects)} projects.")
