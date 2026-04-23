import re
import json
import unicodedata

def transliterate(text):
    text = unicodedata.normalize('NFKC', text)
    # Mapping for common Arabic characters to Latin
    mapping = {
        'أ': 'a', 'إ': 'a', 'آ': 'a', 'ا': 'a',
        'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
        'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
        'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
        'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
        'ه': 'h', 'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 'h', 'ؤ': 'w', 'ئ': 'y',
        ' ': '_'
    }
    res = "".join(mapping.get(c, '') for c in text.lower())
    res = re.sub(r'_+', '_', res)
    return res.strip('_')

def parse_pdf_text(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by project number
    project_sections = re.split(r'(\d+)\s*:\s*اﻟﻤﺸﺮوع\s*رﻗﻢ', content)
    
    projects_data = []
    
    # project_sections[0] is header
    for i in range(1, len(project_sections), 2):
        project_id = int(project_sections[i])
        section_content = project_sections[i+1]
        
        if project_id == 3:
            continue
            
        # Extract title (it appears as "Title :اﻟﻤﺸﺮوع  ﻋﻨﻮان")
        title_match = re.search(r'(.*?)\s*:\s*اﻟﻤﺸﺮوع\s*ﻋﻨﻮان', section_content)
        title = title_match.group(1).strip() if title_match else f"Project {project_id}"
        
        # Extract Doctor (appears as "Name/Title :اﻟﺮﺋﻴﺴﻲ  اﻟﻤﺸﺮف")
        doc_match = re.search(r'(.*?)(?=/|:)\s*/?\s*.*?\s*:\s*اﻟﺮﺋﻴﺴﻲ\s*اﻟﻤﺸﺮف', section_content)
        doc_raw = doc_match.group(1).strip() if doc_match else "Unknown Doctor"
        
        # Reverse doctor name if it looks like "Surname Name"
        # Example: "اﻟﻔﺘﻮح أﺑﻮ أﺣﻤﺪ" -> "أﺣﻤﺪ أﺑﻮ اﻟﻔﺘﻮح"
        doc_parts = doc_raw.split()
        if len(doc_parts) >= 2:
            # Simple reversal for now, or just take parts
            doc_name = " ".join(reversed(doc_parts))
        else:
            doc_name = doc_raw
            
        # Clean doctor name (remove special characters from PDF extraction)
        doc_name = doc_name.replace('اﻟ', 'ال').replace('أ', 'ا').replace('إ', 'ا') # Simple normalization
        
        # Doctor Email: First and Second name
        doc_parts_clean = doc_name.split()
        if len(doc_parts_clean) >= 2:
            doc_email_prefix = transliterate(doc_parts_clean[0] + " " + doc_parts_clean[1])
        else:
            doc_email_prefix = transliterate(doc_name)
        
        doctor_email = f"{doc_email_prefix}@unitrack.edu"
        
        # Extract Students
        students = []
        # Students start after "#اﻟﻄﺎﻟﺐ ﻛﻮداﻟﻄﺎﻟﺐ اﺳﻢ"
        # Format: Index Code Name
        student_matches = re.findall(r'(\d+)\s+(\d{6,8})\s+(.*?)(?=\n\d+\s+\d{6,8}|\n\d+/\d+|\n|$)', section_content)
        for s_idx, s_code, s_name in student_matches:
            s_name_clean = s_name.strip()
            # Student Email: Code@unitrack.edu
            s_email = f"{s_code}@unitrack.edu"
            
            students.append({
                "code": s_code,
                "name": s_name_clean,
                "email": s_email,
                "password": "password",
                "role": "student"
            })
            
        projects_data.append({
            "project_id": project_id,
            "title": title,
            "doctor": {
                "name": doc_name,
                "email": doctor_email,
                "password": "password",
                "role": "professor"
            },
            "students": students
        })
        
    return projects_data

if __name__ == "__main__":
    data = parse_pdf_text('d:/Unit Tiack AI/extracted_pdf.txt')
    with open('d:/Unit Tiack AI/projects_seeding.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f"Generated seeding data for {len(data)} projects.")
