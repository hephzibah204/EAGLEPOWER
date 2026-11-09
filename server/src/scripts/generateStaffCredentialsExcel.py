import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import os

print("Generating Official Eagle Power Schools Staff Credentials Excel Sheet...")

# Create workbook
wb = openpyxl.Workbook()

# Sheet 1: Staff Credentials
ws1 = wb.active
ws1.title = "Staff Credentials & Logins"
ws1.views.sheetView[0].showGridLines = True

# Colors (Navy & Gold branding)
COLOR_NAVY = "0F172A"       # Slate 900
COLOR_BLUE_HEADER = "1E3A8A"# Blue 900
COLOR_GOLD = "D97706"       # Amber 600
COLOR_LIGHT_BG = "F8FAFC"   # Slate 50
COLOR_ACCENT_BG = "FEF3C7"  # Amber 100
COLOR_GREEN = "059669"      # Emerald 600

font_title = Font(name="Calibri", size=16, bold=True, color="FFFFFF")
font_subtitle = Font(name="Calibri", size=11, italic=True, color="FEF3C7")
font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
font_data = Font(name="Calibri", size=10, color="0F172A")
font_code = Font(name="Consolas", size=10, bold=True, color="1E3A8A")
font_pass = Font(name="Consolas", size=10, bold=True, color="DC2626")
font_url = Font(name="Calibri", size=10, color="2563EB", underline="single")

fill_title = PatternFill(start_color=COLOR_NAVY, end_color=COLOR_NAVY, fill_type="solid")
fill_header = PatternFill(start_color=COLOR_BLUE_HEADER, end_color=COLOR_BLUE_HEADER, fill_type="solid")
fill_zebra = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
fill_active = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")

thin_border_side = Side(border_style="thin", color="CBD5E1")
thin_border = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)

# Title Block
ws1.merge_cells("A1:O1")
ws1["A1"] = "EAGLE POWER SCHOOLS & COLLEGE OF EXCELLENCE, AWKA"
ws1["A1"].font = font_title
ws1["A1"].fill = fill_title
ws1["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws1.row_dimensions[1].height = 36

ws1.merge_cells("A2:O2")
ws1["A2"] = "Official Academic Faculty & Staff Portal Credentials Directory | Session 2026/2027"
ws1["A2"].font = font_subtitle
ws1["A2"].fill = fill_title
ws1["A2"].alignment = Alignment(horizontal="center", vertical="center")
ws1.row_dimensions[2].height = 24

# Metadata block
ws1.merge_cells("A3:O3")
ws1["A3"] = "Portal URL: https://eaglepowerschools.com.ng/portal/login  |  Default Security Password: EagleStaff2025!  |  Supported Logins: Username, Staff ID, Phone, or Email"
ws1["A3"].font = Font(name="Calibri", size=10, bold=True, color="D97706")
ws1["A3"].fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
ws1["A3"].alignment = Alignment(horizontal="center", vertical="center")
ws1.row_dimensions[3].height = 22

# Headers
headers = [
    "S/N",
    "Staff Name",
    "Staff ID",
    "Designation / Position",
    "School Division",
    "Assigned Class(es)",
    "Form Responsibility",
    "Subject(s) Taught",
    "WhatsApp / Phone",
    "Email Address",
    "Portal Login URL",
    "Primary Username",
    "Default Password",
    "Status",
    "Access Role"
]

ws1.row_dimensions[5].height = 28
for col_idx, header in enumerate(headers, 1):
    cell = ws1.cell(row=5, column=col_idx, value=header)
    cell.font = font_header
    cell.fill = fill_header
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    cell.border = thin_border

# 28 Staff Data
staff_data = [
    (1, "Echezona Nzekwe", "EPS/ST/002", "Senior Igbo Language Master & SSS2 Form Master", "Senior College", "SSS1 – SSS3 (SS2 Form Class)", "Form Master, SSS2", "Asụsụ Igbo", "08130439923", "skulboi49@gmail.com", "echezonanzekwe", "teacher"),
    (2, "Olisah Nzemeka C.", "EPS-STF-47", "Senior Physics Master", "Senior College", "SSS1 – SSS3", "None", "Physics", "09038741485", "olisahnzemeka@gmail.com", "olisahnzemekac", "teacher"),
    (3, "Ayatalumo Stella-Maris U.", "EPS-STF-48", "Senior Biology Educator & JSS2 Form Mistress", "Junior & Senior College", "SSS1 – SSS3 (JSS2 Form Class)", "Form Mistress, JSS2", "Biology and Agricultural Science", "09011128556", "uchenna3150@gmail.com", "ayatalumostella", "teacher"),
    (4, "Onwuka Onyekachi Francis", "EPS-STF-49", "Social & PHE Educator / SSS1 Form Master", "Junior & Senior College", "JSS1 – JSS3 (SS1 Form Class)", "Form Master, SSS1", "Social and Citizenship Education; PHE", "08169033221", "aglowonwuka@gmail.com", "onwukaonyekachi", "teacher"),
    (5, "Okeke Dorothy Adaora", "EPS-STF-50", "Senior Geography & Citizenship Educator", "Senior College", "SSS1 – SSS3", "None", "Citizenship Education and Geography", "08168662120", "okekedorothy825@gmail.com", "okekedorothyada", "teacher"),
    (6, "Obiora Jeremiah", "EPS-STF-51", "Digital Technology & CRS Educator", "Junior & Senior College", "JSS1 – JSS3; SSS1 – SSS3", "None", "Digital Technology; CRS", "08066044865", "exalted4real@yahoo.com", "obiorajeremiah", "teacher"),
    (7, "Okeke Chiso Solomon", "EPS-STF-52", "Creative & Visual Arts Master", "Junior & Senior College", "JSS1 – JSS3; SSS1 – SSS3", "None", "Cultural and Creative Arts; Visual Art", "08168514559", "chis4children@gmail.com", "okekechisosolom", "teacher"),
    (8, "Mrs. Abana Wisdom", "EPS-STF-53", "Literature & English Language Educator", "Junior & Senior College", "JSS2 – JSS3; SSS3", "None", "Literature-in-English; English Language", "Contact Office", "w0690602@gmail.com", "mrsabanawisdom", "teacher"),
    (9, "Ineh Ruth", "EPS-STF-54", "Lead Class Teacher, Basic 2", "Primary Division", "Basic 2 (Primary 2)", "Class Teacher, Basic 2", "All Primary Subjects", "09151888827", "chiamakaineh2005@gmail.com", "inehruth", "teacher"),
    (10, "Theodore Okwaranwaneri", "EPS-STF-55", "Senior English Language Master", "Senior College", "SSS1 – SSS3", "None", "English Language", "08035497986", "okwaranwaneri776@gmail.com", "theodoreokwaran", "teacher"),
    (11, "Adiruo Chioma Charity", "EPS-STF-56", "Business Studies & Marketing Mistress", "Junior & Senior College", "JSS1 – JSS3; SSS1 – SSS3", "None", "Business Studies; Marketing", "07060704892", "chiomachari@gmail.com", "adiruochiomacha", "teacher"),
    (12, "Obi Amaka", "EPS-STF-57", "CRS & Pre-Vocational Studies Mistress", "Junior College", "JSS1 – JSS3", "None", "Christian Religious Studies; PVS", "07070150391", "obia256@gmail.com", "obiamaka", "teacher"),
    (13, "Adaeze Uzoefuna", "EPS/ST/001", "Vice Principal (Academics)", "Executive Directorate", "All Divisions (Early Years to SSS3)", "Academic Directorate", "Academic Administration & Curriculum", "08033591058", "adaeze3011@gmail.com", "adaezeuzoefuna", "admin"),
    (14, "Chilokwu Chioma Glory", "EPS-STF-58", "Senior Economics Mistress", "Senior College", "SSS1 – SSS3", "None", "Economics", "08068147094", "chiomaglory91@gmail.com", "chilokwuchioma", "teacher"),
    (15, "Agbago Adaobi Celestina", "EPS-STF-59", "Head Teacher (Basic) & Lead Teacher Basic 1", "Primary Division", "Basic 1 (Primary 1)", "Head Teacher & Class Teacher Basic 1", "All Primary Subjects", "08148415409", "agbagoada977@gmail.com", "agbagoadaobicel", "teacher"),
    (16, "Emmanuel Ebube Peculiar", "EPS-STF-60", "Lead Class Teacher, Nursery 3", "Early Years & Nursery", "Nursery 3", "Class Teacher, Nursery 3", "All Early Years Subjects", "08129761676", "eebube455@gmail.com", "emmanuelebubepe", "teacher"),
    (17, "Etonyeaku Ogechi", "EPS-STF-61", "Lead Class Teacher, Basic 5", "Primary Division", "Basic 5 (Primary 5)", "Class Teacher, Basic 5", "All Primary Subjects", "08032782173", "etonyeakuogechi@gmail.com", "etonyeakuogechi", "teacher"),
    (18, "Mrs. Anagbogu Chioma", "EPS-STF-62", "Lead Class Teacher, Basic 3", "Primary Division", "Basic 3 (Primary 3)", "Class Teacher, Basic 3", "All Primary Subjects", "09066617255", "omalinda2000@gmail.com", "mrsanagboguchio", "teacher"),
    (19, "Nwarisi Nneka", "EPS-STF-63", "Head Teacher (Nursery) & Lead Teacher Nursery 1", "Early Years & Nursery", "Nursery 1", "Head Teacher & Class Teacher Nursery 1", "All Early Years Subjects", "09137743949", "nwarisinneka@gmail.com", "nwarisinneka", "teacher"),
    (20, "Godswill Orji", "EPS-STF-64", "Senior Commerce & Government Master", "Senior College", "SSS1 – SSS3", "None", "Commerce; Government", "08178293281", "stunnerb39@gmail.com", "godswillorji", "teacher"),
    (21, "Okoye Cordelia Chinyere", "EPS-STF-65", "Lead Class Teacher, Nursery 2", "Early Years & Nursery", "Nursery 2", "Class Teacher, Nursery 2", "All Early Years Subjects", "08135882776", "chi4change1@gmail.com", "okoyecordeliach", "teacher"),
    (22, "Nwoye Mary", "EPS-STF-66", "Dean of Studies & Lead Class Teacher, Basic 6", "Primary Division", "Basic 6 (Primary 6)", "Dean of Studies & Class Teacher Basic 6", "All Primary Subjects & Academic Coaching", "08063835339", "ndidia54@gmail.com", "nwoyemary", "teacher"),
    (23, "Okeke Patricia I.", "EPS-STF-67", "Intermediate Science Mistress & JSS3 Form Teacher", "Junior College", "JSS1 – JSS3 (JSS3 Form Class)", "Form Teacher, JSS3", "Intermediate Science", "09130660660", "emmanuelchisom195@gmail.com", "okekepatriciai", "teacher"),
    (24, "Ezeana Elizabeth Ekwutosi", "EPS-STF-68", "Lead Educator, Pre-Nursery / Daycare", "Early Years & Nursery", "Pre-Nursery / Daycare", "Lead Educator, Pre-Nursery", "Early Childhood Sensory & Social Care", "08166878419", "ezeana.elizabeth@eaglepowerschools.com.ng", "ezeanaelizabeth", "teacher"),
    (25, "Deborah David", "EPS-STF-69", "Senior Mathematics Mistress", "Junior & Senior College", "JSS1 – JSS3; SSS3", "None", "Mathematics", "09164397786", "deborahsamuel144@gmail.com", "deborahdavid", "teacher"),
    (26, "Aniekwe Kosisochukwu", "EPS-STF-70", "Early Years Co-Educator & Nursery 3 Assistant", "Early Years & Nursery", "Nursery 3", "Early Years Co-Educator", "All Early Years Subjects", "08165044496", "aniekwe6@gmail.com", "aniekwekosisoch", "teacher"),
    (27, "Moadana Victor", "EPS-STF-71", "Senior Chemistry & Digital Tech Master", "Senior College", "SSS1 – SSS3", "None", "Chemistry and Digital Technology", "08064494719", "viks24ch@yahoo.com", "moadanavictor", "teacher"),
    (28, "Ibebugwu Juliet", "EPS-STF-72", "Lead Class Teacher, Basic 4", "Primary Division", "Basic 4 (Primary 4)", "Class Teacher, Basic 4", "All Primary Subjects", "08109480588", "julietuchechukwu20@gmail.com", "ibebugwujuliet", "teacher"),
]

for row_idx, data in enumerate(staff_data, start=6):
    sn, name, staff_no, desig, div, classes, form_resp, subs, phone, email, username, role = data
    portal_url = "https://eaglepowerschools.com.ng/portal/login"
    default_pass = "EagleStaff2025!"
    status = "Active"

    row_values = [
        sn,
        name,
        staff_no,
        desig,
        div,
        classes,
        form_resp,
        subs,
        phone,
        email,
        portal_url,
        username,
        default_pass,
        status,
        role.upper()
    ]

    is_even = (row_idx % 2 == 0)
    current_fill = fill_zebra if is_even else None

    ws1.row_dimensions[row_idx].height = 22

    for col_idx, val in enumerate(row_values, 1):
        cell = ws1.cell(row=row_idx, column=col_idx, value=val)
        cell.font = font_data
        cell.border = thin_border
        if current_fill:
            cell.fill = current_fill

        # Column-specific formatting
        if col_idx == 1: # S/N
            cell.alignment = Alignment(horizontal="center", vertical="center")
        elif col_idx in [3, 12]: # Staff ID, Username
            cell.font = font_code
            cell.alignment = Alignment(horizontal="center", vertical="center")
        elif col_idx == 11: # Portal URL
            cell.font = font_url
            cell.alignment = Alignment(horizontal="left", vertical="center")
        elif col_idx == 13: # Password
            cell.font = font_pass
            cell.alignment = Alignment(horizontal="center", vertical="center")
        elif col_idx == 14: # Status
            cell.font = Font(name="Calibri", size=10, bold=True, color=COLOR_GREEN)
            cell.fill = fill_active
            cell.alignment = Alignment(horizontal="center", vertical="center")
        elif col_idx == 15: # Role
            cell.font = Font(name="Calibri", size=9, bold=True, color="1E3A8A")
            cell.alignment = Alignment(horizontal="center", vertical="center")
        else:
            cell.alignment = Alignment(horizontal="left", vertical="center")

# Auto-adjust column widths
for col in ws1.columns:
    max_len = 0
    col_letter = get_column_letter(col[0].column)
    for cell in col:
        if cell.row > 4: # Ignore title rows
            val_str = str(cell.value or '')
            if len(val_str) > max_len:
                max_len = len(val_str)
    ws1.column_dimensions[col_letter].width = max(max_len + 3, 12)

ws1.column_dimensions["A"].width = 6   # S/N
ws1.column_dimensions["B"].width = 28  # Staff Name
ws1.column_dimensions["C"].width = 15  # Staff ID
ws1.column_dimensions["D"].width = 38  # Position
ws1.column_dimensions["E"].width = 22  # Division
ws1.column_dimensions["F"].width = 28  # Assigned Classes
ws1.column_dimensions["G"].width = 32  # Form Responsibility
ws1.column_dimensions["H"].width = 38  # Subjects
ws1.column_dimensions["I"].width = 16  # Phone
ws1.column_dimensions["J"].width = 32  # Email
ws1.column_dimensions["K"].width = 42  # Portal URL
ws1.column_dimensions["L"].width = 20  # Username
ws1.column_dimensions["M"].width = 18  # Password
ws1.column_dimensions["N"].width = 12  # Status
ws1.column_dimensions["O"].width = 14  # Role


# ==========================================
# Sheet 2: Teacher Quick Start Guide
# ==========================================
ws2 = wb.create_sheet(title="Teacher Quick Start Guide")
ws2.views.sheetView[0].showGridLines = True

ws2.merge_cells("A1:G1")
ws2["A1"] = "EAGLE POWER SCHOOLS - TEACHER PORTAL ONBOARDING GUIDE"
ws2["A1"].font = font_title
ws2["A1"].fill = fill_title
ws2["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws2.row_dimensions[1].height = 36

guide_sections = [
    ("1. HOW TO LOG IN TO YOUR ACCOUNT", [
        ("Step 1", "Open your web browser and navigate to: https://eaglepowerschools.com.ng/portal/login"),
        ("Step 2", "In the Login ID field, you can enter ANY ONE of the following:\n   - Your Primary Username (e.g. echezonanzekwe)\n   - Your Official Staff ID (e.g. EPS/ST/002 or EPS-STF-47)\n   - Your Registered WhatsApp Phone Number (e.g. 08130439923)\n   - Your Registered Email Address (e.g. skulboi49@gmail.com)"),
        ("Step 3", "In the Password field, enter your default password: EagleStaff2025!"),
        ("Step 4", "Click 'Sign In to Portal'. You will land on your personalized Teacher Cockpit.")
    ]),
    ("2. HOW TO UPLOAD YOUR PHOTO & SIGNATURE FOR YOUR OFFICIAL ID CARD", [
        ("Step 1", "Once logged into your dashboard, click the 'My Staff ID' gold badge button on the top right."),
        ("Step 2", "Click 'Upload Passport Photo' to attach a clear headshot photograph."),
        ("Step 3", "Click 'Signature Pad' to draw your signature directly with your finger or mouse, or upload a scanned signature image."),
        ("Step 4", "Click 'Save & Sync Profile'. Your credentials will instantly bind to the EduCore database."),
        ("Step 5", "Click 'Print ID Badge' to instantly print or save your official front & back CR80 PVC ID Card (with embedded verification QR code and security watermarks).")
    ]),
    ("3. HOW TO ENTER CONTINUOUS ASSESSMENT (CA) & EXAM SCORES", [
        ("Step 1", "In the left navigation menu, click 'Gradebook & Broadsheet'."),
        ("Step 2", "Select your assigned class (e.g., JSS2, SS1, Basic 1) and your subject."),
        ("Step 3", "Enter 1st CA (15 marks), 2nd CA (15 marks), Homework/Project (10 marks), and Final Exam (60 marks)."),
        ("Step 4", "The system automatically computes Total Scores (100%), Letter Grades (A1 to F9), Positions, and Termly Broadsheets."),
        ("Step 5", "Click 'Save Scores & Publish to Broadsheet'.")
    ]),
    ("4. HOW TO TAKE DAILY ATTENDANCE & SUBMIT LESSON NOTES", [
        ("Step 1", "Click 'Daily Attendance' to mark Present, Absent, or Late for your form class pupils."),
        ("Step 2", "Click 'Curriculum & Lesson Notes' to draft and submit weekly lesson plans for Vice Principal / HOD approval.")
    ]),
    ("5. HELP & ADMINISTRATIVE SUPPORT", [
        ("Support Desk", "Eagle Power Schools Administrative Directorate, Amikwo, Awka"),
        ("Academic Head", "Mrs. Adaeze Uzoefuna (Vice Principal Academics) - 08033591058"),
        ("School WhatsApp", "+234 907 558 0671"),
        ("Technical Support", "admin@eaglepowerschools.com.ng")
    ])
]

current_row = 3
for section_title, steps in guide_sections:
    ws2.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=7)
    cell = ws2.cell(row=current_row, column=1, value=section_title)
    cell.font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
    cell.fill = fill_header
    cell.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws2.row_dimensions[current_row].height = 26
    current_row += 1

    for step_num, step_desc in steps:
        ws2.row_dimensions[current_row].height = 28 if "\n" not in step_desc else 55
        c1 = ws2.cell(row=current_row, column=1, value=step_num)
        c1.font = Font(name="Calibri", size=10, bold=True, color="1E3A8A")
        c1.alignment = Alignment(horizontal="center", vertical="top")
        c1.border = thin_border
        c1.fill = fill_zebra

        ws2.merge_cells(start_row=current_row, start_column=2, end_row=current_row, end_column=7)
        c2 = ws2.cell(row=current_row, column=2, value=step_desc)
        c2.font = font_data
        c2.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
        for c in range(2, 8):
            ws2.cell(row=current_row, column=c).border = thin_border
        current_row += 1

    current_row += 1

ws2.column_dimensions["A"].width = 18
ws2.column_dimensions["B"].width = 25
ws2.column_dimensions["C"].width = 25
ws2.column_dimensions["D"].width = 25
ws2.column_dimensions["E"].width = 25
ws2.column_dimensions["F"].width = 25
ws2.column_dimensions["G"].width = 25

# Save files in root, public/downloads, and artifact directory
os.makedirs("public/downloads", exist_ok=True)
dest_path1 = "Eagle_Power_Schools_Staff_Portal_Credentials.xlsx"
dest_path2 = "public/downloads/Eagle_Power_Schools_Staff_Portal_Credentials.xlsx"
artifact_dir = r"C:\Users\hephz\.gemini\antigravity\brain\eb2034b6-3036-4ed7-9bf4-16f194aef41a"
dest_path3 = os.path.join(artifact_dir, "Eagle_Power_Schools_Staff_Portal_Credentials.xlsx")

wb.save(dest_path1)
wb.save(dest_path2)
try:
    wb.save(dest_path3)
except Exception as e:
    pass

print(f"Successfully generated Excel workbook at:")
print(f"   - {os.path.abspath(dest_path1)}")
print(f"   - {os.path.abspath(dest_path2)}")
