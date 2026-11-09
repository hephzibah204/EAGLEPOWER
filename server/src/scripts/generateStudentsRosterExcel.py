import sqlite3
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import os

print("[INFO] Generating Eagle Power Schools 2026 Official Students Roster Excel Workbook...")

db_path = os.path.join(os.path.dirname(__file__), "../../data/eaglepower.db")
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Query all students with class details
students = cur.execute("""
    SELECT 
        s.id,
        s.admission_no,
        s.last_name,
        s.first_name,
        s.gender,
        s.dob,
        c.name as class_name,
        c.division,
        s.guardian_name,
        s.guardian_phone,
        u.username as student_username
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    LEFT JOIN users u ON u.role = 'student' AND u.reference_id = s.admission_no
    ORDER BY s.id ASC
""").fetchall()

# Query class summaries
class_summaries = cur.execute("""
    SELECT 
        c.id,
        c.name as class_name,
        c.division,
        COUNT(s.id) as student_count,
        COALESCE(st.name, 'Administrative Oversight') as class_teacher
    FROM classes c
    LEFT JOIN students s ON s.class_id = c.id
    LEFT JOIN staff st ON c.class_teacher_id = st.id
    GROUP BY c.id
    ORDER BY c.id ASC
""").fetchall()

wb = openpyxl.Workbook()

# Sheet 1: Master Student Directory
ws1 = wb.active
ws1.title = "Master Students Roster"
ws1.views.sheetView[0].showGridLines = True

# Colors (Navy & Gold branding)
COLOR_NAVY = "0F172A"       # Slate 900
COLOR_BLUE_HEADER = "1E3A8A"# Blue 900
COLOR_GOLD = "D97706"       # Amber 600
COLOR_EMERALD = "059669"    # Emerald 600

font_title = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
font_subtitle = Font(name="Calibri", size=11, italic=True, color="FEF3C7")
font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
font_data = Font(name="Calibri", size=10, color="0F172A")
font_code = Font(name="Consolas", size=10, bold=True, color="1E3A8A")
font_adm = Font(name="Consolas", size=11, bold=True, color="B45309")
font_pass = Font(name="Consolas", size=10, bold=True, color="059669")

fill_title = PatternFill(start_color=COLOR_NAVY, end_color=COLOR_NAVY, fill_type="solid")
fill_header = PatternFill(start_color=COLOR_BLUE_HEADER, end_color=COLOR_BLUE_HEADER, fill_type="solid")
fill_zebra = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")

thin_border_side = Side(border_style="thin", color="CBD5E1")
thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

# Title Block
ws1.merge_cells("A1:K1")
ws1["A1"] = "EAGLE POWER SCHOOLS & COLLEGE OF EXCELLENCE, AWKA"
ws1["A1"].font = font_title
ws1["A1"].fill = fill_title
ws1["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws1.row_dimensions[1].height = 36

ws1.merge_cells("A2:K2")
ws1["A2"] = f"Official Permanent Students Roster & Admission Directory | Session 2026/2027 | Total Scholars: {len(students)}"
ws1["A2"].font = font_subtitle
ws1["A2"].fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
ws1["A2"].alignment = Alignment(horizontal="center", vertical="center")
ws1.row_dimensions[2].height = 24

headers = [
    "S/N",
    "Admission Number",
    "Surname",
    "First & Middle Name",
    "Current Class",
    "Division",
    "Gender",
    "Date of Birth",
    "Parent / Guardian",
    "Parent Telephone",
    "Student Portal Password"
]

ws1.row_dimensions[4].height = 26
for col_num, h in enumerate(headers, 1):
    cell = ws1.cell(row=4, column=col_num)
    cell.value = h
    cell.font = font_header
    cell.fill = fill_header
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    cell.border = thin_border

for idx, s in enumerate(students, 1):
    row_num = idx + 4
    ws1.row_dimensions[row_num].height = 20
    row_fill = fill_zebra if idx % 2 == 0 else PatternFill(fill_type=None)

    row_data = [
        (idx, font_data, Alignment(horizontal="center", vertical="center")),
        (s["admission_no"], font_adm, Alignment(horizontal="center", vertical="center")),
        (s["last_name"], font_data, Alignment(horizontal="left", vertical="center")),
        (s["first_name"], font_data, Alignment(horizontal="left", vertical="center")),
        (s["class_name"] or "N/A", font_code, Alignment(horizontal="center", vertical="center")),
        (s["division"] or "N/A", font_data, Alignment(horizontal="center", vertical="center")),
        (s["gender"] or "N/A", font_data, Alignment(horizontal="center", vertical="center")),
        (s["dob"] or "On File", font_data, Alignment(horizontal="center", vertical="center")),
        (s["guardian_name"] or "Parent/Guardian", font_data, Alignment(horizontal="left", vertical="center")),
        (s["guardian_phone"] or "N/A", font_code, Alignment(horizontal="center", vertical="center")),
        ("Eagle2025!", font_pass, Alignment(horizontal="center", vertical="center"))
    ]

    for col_num, (val, font_style, align) in enumerate(row_data, 1):
        c = ws1.cell(row=row_num, column=col_num)
        c.value = val
        c.font = font_style
        c.alignment = align
        c.border = thin_border
        if row_fill.fill_type:
            c.fill = row_fill

# Auto-adjust column widths
for col in ws1.columns:
    max_len = 0
    col_letter = get_column_letter(col[0].column)
    for cell in col:
        if cell.row > 2 and cell.value:
            max_len = max(max_len, len(str(cell.value)))
    ws1.column_dimensions[col_letter].width = max(max_len + 4, 12)

# Sheet 2: Class Population Summary
ws2 = wb.create_sheet(title="Class Summary")
ws2.views.sheetView[0].showGridLines = True

ws2.merge_cells("A1:E1")
ws2["A1"] = "EAGLE POWER SCHOOLS - ENROLLMENT BY CLASS"
ws2["A1"].font = font_title
ws2["A1"].fill = fill_title
ws2["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws2.row_dimensions[1].height = 34

summary_headers = ["Class ID", "Class Name", "Division", "Enrolled Students", "Class Lead Teacher"]
ws2.row_dimensions[3].height = 24
for col_num, h in enumerate(summary_headers, 1):
    cell = ws2.cell(row=3, column=col_num)
    cell.value = h
    cell.font = font_header
    cell.fill = fill_header
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = thin_border

total_sch = 0
for idx, cs in enumerate(class_summaries, 1):
    row_num = idx + 3
    ws2.row_dimensions[row_num].height = 20
    row_fill = fill_zebra if idx % 2 == 0 else PatternFill(fill_type=None)
    total_sch += cs["student_count"]

    s_data = [
        (cs["id"], font_data, Alignment(horizontal="center", vertical="center")),
        (cs["class_name"], font_code, Alignment(horizontal="left", vertical="center")),
        (cs["division"], font_data, Alignment(horizontal="center", vertical="center")),
        (cs["student_count"], font_adm, Alignment(horizontal="center", vertical="center")),
        (cs["class_teacher"], font_data, Alignment(horizontal="left", vertical="center"))
    ]

    for col_num, (val, font_style, align) in enumerate(s_data, 1):
        c = ws2.cell(row=row_num, column=col_num)
        c.value = val
        c.font = font_style
        c.alignment = align
        c.border = thin_border
        if row_fill.fill_type:
            c.fill = row_fill

# Total row
tot_row = len(class_summaries) + 4
ws2.cell(row=tot_row, column=2).value = "TOTAL ENROLLMENT"
ws2.cell(row=tot_row, column=2).font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
ws2.cell(row=tot_row, column=2).fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")

ws2.cell(row=tot_row, column=4).value = total_sch
ws2.cell(row=tot_row, column=4).font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
ws2.cell(row=tot_row, column=4).alignment = Alignment(horizontal="center", vertical="center")
ws2.cell(row=tot_row, column=4).fill = PatternFill(start_color="059669", end_color="059669", fill_type="solid")

for col in ws2.columns:
    max_len = 0
    col_letter = get_column_letter(col[0].column)
    for cell in col:
        if cell.row > 1 and cell.value:
            max_len = max(max_len, len(str(cell.value)))
    ws2.column_dimensions[col_letter].width = max(max_len + 4, 15)

out_file = os.path.abspath("Eagle_Power_Schools_2026_Official_Students_Roster.xlsx")
wb.save(out_file)
print(f"[SUCCESS] Successfully created workbook: {out_file}")
conn.close()
