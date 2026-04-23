import json
import os

def generate_seeding():
    source_path = 'projects_seeding.json'
    if not os.path.exists(source_path):
        print(f"Source file {source_path} not found.")
        return

    with open(source_path, 'r', encoding='utf-8') as f:
        projects = json.load(f)

    users = []
    teams = []
    team_students = []

    user_map = {} # email -> user_id to avoid duplicates
    
    # Add a default admin
    admin_email = "admin@unitrack.edu"
    admin_id = "admin_001"
    users.append({
        "id": admin_id,
        "name": "Admin User",
        "email": admin_email,
        "role": "admin",
        "hashed_password": "password"
    })
    user_map[admin_email] = admin_id

    team_id_counter = 1

    for proj in projects:
        # 1. Process Professor
        doctor = proj.get('doctor')
        if not doctor: continue
        
        doc_email = doctor['email'].lower()
        if doc_email not in user_map:
            doc_id = f"prof_{len(user_map) + 1}"
            users.append({
                "id": doc_id,
                "name": doctor['name'],
                "email": doc_email,
                "role": "professor",
                "hashed_password": "password"
            })
            user_map[doc_email] = doc_id
        
        prof_id = user_map[doc_email]

        # 2. Process Team
        t_id = f"team_{team_id_counter:03d}"
        teams.append({
            "id": t_id,
            "name": f"Team {proj['project_id']}",
            "project_title": proj['title'],
            "progress": 0,
            "color": "#3b82f6",
            "emoji": "🚀",
            "professor_id": prof_id,
            "assistant_id": None
        })
        team_id_counter += 1

        # 3. Process Students
        students = proj.get('students', [])
        for std in students:
            # Ignore assistants if any (though role should be 'student' here)
            if std.get('role') != 'student': continue
            
            std_email = std['email'].lower()
            if std_email not in user_map:
                std_id = f"std_{std['code']}"
                users.append({
                    "id": std_id,
                    "name": std['name'],
                    "email": std_email,
                    "role": "student",
                    "hashed_password": "password"
                })
                user_map[std_email] = std_id
            
            current_std_id = user_map[std_email]
            team_students.append({
                "team_id": t_id,
                "student_id": current_std_id
            })

    output = {
        "users": users,
        "teams": teams,
        "team_students": team_students
    }

    with open('final_seeding.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=4)
    
    print(f"Generated final_seeding.json with {len(users)} users and {len(teams)} teams.")

if __name__ == "__main__":
    generate_seeding()
