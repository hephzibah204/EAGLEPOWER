import re
import json

sql_path = r"C:\Users\hephz\Downloads\eaglepow_schoolportal.sql"
with open(sql_path, "r", encoding="utf-8", errors="ignore") as f:
    sql = f.read()

# 1. Classes
classes_raw = re.findall(r"\((\d+),\s*'([^']+)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)", sql)
# classes table: (`id`, `class`, `is_active`, `created_at`, `updated_at`)
classes_list = []
idx = sql.find("INSERT INTO `classes`")
if idx != -1:
    end = sql.find(";", idx)
    stmt = sql[idx:end]
    items = re.findall(r"\((\d+),\s*'([^']+)'", stmt)
    classes_list = [{"id": int(i[0]), "name": i[1]} for i in items]

# 2. Sections
sections_list = []
idx_s = sql.find("INSERT INTO `sections`")
if idx_s != -1:
    end_s = sql.find(";", idx_s)
    stmt_s = sql[idx_s:end_s]
    items_s = re.findall(r"\((\d+),\s*'([^']+)'", stmt_s)
    sections_list = [{"id": int(i[0]), "name": i[1]} for i in items_s]

# 3. Staff
staff_list = []
idx_st = sql.find("INSERT INTO `staff`")
if idx_st != -1:
    end_st = sql.find(";\n", idx_st)
    if end_st == -1: end_st = sql.find(";\r\n", idx_st)
    stmt_st = sql[idx_st:end_st]
    # parse staff rows
    rows = re.findall(r"\((\d+),\s*'([^']*)',.*?,\s*'([^']*)',\s*'([^']*)',.*?,\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'", stmt_st)
    # let's be more specific with staff fields
    # staff fields: (`id`, `employee_id`, `lang_id`, `currency_id`, `department`, `designation`, `qualification`, `work_exp`, `name`, `surname`, ..., `contact_no`, ..., `email`)
    staff_entries = [
        {"id": 1, "employee_id": "9000", "role": "Super Admin", "name": "Super Admin", "email": "trustjesusmedia@gmail.com", "phone": ""},
        {"id": 2, "employee_id": "EPS10", "role": "Admin", "name": "Adaeze Uzoefuna", "email": "adaeze3011@gmail.com", "phone": "+234 803 359 1058"},
        {"id": 3, "employee_id": "EPS11", "role": "Teacher / Admin", "name": "Echezona Nzekwe", "email": "skulboi49@gmail.com", "phone": ""},
        {"id": 4, "employee_id": "BASIC 1", "role": "Class Teacher (Basic 1)", "name": "Adaobi Peter", "email": "basicone123@gmail.com", "phone": ""}
    ]

# 4. Subjects
subjects_list = []
idx_sub = sql.find("INSERT INTO `subjects`")
if idx_sub != -1:
    end_sub = sql.find(";", idx_sub)
    stmt_sub = sql[idx_sub:end_sub]
    sub_matches = re.findall(r"\(\d+,\s*'([^']+)',\s*'([^']*)',\s*'([^']+)'", stmt_sub)
    for sm in sub_matches:
        subjects_list.append({"name": sm[0], "code": sm[1], "type": sm[2]})

# 5. Students
students_list = []
idx_stud = sql.find("INSERT INTO `students`")
if idx_stud != -1:
    end_stud = sql.find(";\n", idx_stud)
    if end_stud == -1: end_stud = sql.find(";\r\n", idx_stud)
    stmt_stud = sql[idx_stud:end_stud]
    
    # parse student row entries
    # Sample row: (1, 2, 'ESE2009012', '012', '2025-07-17', 'UGOCHI', NULL, 'NATHANIEL', 'No', NULL, '07066397577', 'adaeze3011@gmail.com', ...
    # Let's extract student records using a robust line-by-line / row parser
    rows = stmt_stud.split("),\n")
    for r in rows:
        r = r.strip().lstrip("VALUES").strip().lstrip("(")
        # Extract admission_no, firstname, lastname, phone, parent_name, parent_phone
        adm_m = re.search(r"'(ESE\w+|\d{6,})'", r)
        fn_m = re.search(r"'\d{4}-\d{2}-\d{2}',\s*'([^']+)'", r)
        if adm_m and fn_m:
            adm_no = adm_m.group(1)
            fname = fn_m.group(1)
            # find surname
            tokens = re.findall(r"'([^']*)'", r)
            # tokens usually: [adm_no, roll, date, firstname, lastname, rte, mobileno, email, ...]
            lname = tokens[3] if len(tokens) > 3 and tokens[3] != fname else (tokens[4] if len(tokens) > 4 else "")
            
            # find parent name and phone
            phones = [t for t in tokens if re.match(r"^0[789][01]\d{8}$", t) or re.match(r"^\+234\d{10}$", t)]
            phone = phones[0] if phones else ""
            
            students_list.append({
                "admission_no": adm_no,
                "first_name": fname,
                "last_name": lname,
                "phone": phone
            })

result_summary = {
    "school_name": "Eagle Power Schools",
    "portal_url": "https://portal.eaglepowerschools.com.ng/",
    "server_path": "/home1/eaglepow/portal/",
    "classes": classes_list,
    "sections": sections_list,
    "subjects": subjects_list,
    "staff": staff_entries,
    "total_students_found": len(students_list),
    "sample_students": students_list[:15]
}

print(json.dumps(result_summary, indent=2))

with open("extracted_portal_summary.json", "w", encoding="utf-8") as out:
    json.dump(result_summary, out, indent=2)
