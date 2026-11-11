import openpyxl, sqlite3, re, json, csv
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime, date

root=Path(__file__).parent
out=root/'outputs'/'student-comparison-2026-11-11'
out.mkdir(parents=True,exist_ok=True)
source=Path(r'C:\Users\hephz\Downloads\SCHOOL LIST-1.xlsx')
w=openpyxl.load_workbook(source,read_only=True,data_only=True)
def norm(v): return ' '.join(re.findall(r'[A-Z0-9]+',str(v or '').upper()))
def cls(v):
    n=norm(v).replace(' ','').replace('BASIC','PRIMARY')
    return {'PN':'PRENURSERY','DC':'CRECHE'}.get(n,n)
def dob(v):
    if isinstance(v,(date,datetime)): return v.strftime('%Y-%m-%d')
    v=str(v or '').strip()
    for fmt in ('%Y-%m-%d','%d/%m/%Y','%d-%m-%Y','%d-%m %Y'):
        try: return datetime.strptime(v,fmt).strftime('%Y-%m-%d')
        except ValueError: pass
    return v
def phone(v):
    s=re.sub(r'\D','',str(v or ''))
    if s.startswith('234') and len(s)==13: s='0'+s[3:]
    if len(s)==10: s='0'+s
    return s.lstrip('0')
records=[]
for s in w:
    for row,r in enumerate(s.values,1):
        if row<3 or not r[1] or not isinstance(r[0],(int,float)): continue
        records.append(dict(sheet=s.title,row=row,name=str(r[1]).strip(),dob=r[2],gender={'M':'Male','F':'Female'}.get(str(r[3]).strip(),r[3]),class_name=r[4],guardian_name=r[5],guardian_phone=r[6]))
c=sqlite3.connect((root/'server/data/eaglepower.db').as_uri()+'?mode=ro',uri=True)
c.row_factory=sqlite3.Row
db=[dict(r) for r in c.execute('SELECT s.id,s.admission_no,s.last_name,s.first_name,s.dob,s.gender,s.guardian_name,s.guardian_phone,s.is_active,c.name class_name FROM students s LEFT JOIN classes c ON c.id=s.class_id')]
index=defaultdict(list)
for d in db: index[norm(d['last_name']+' '+d['first_name'])].append(d)
matched=set(); missing=[]; issues=[]; counts=Counter(); duplicates=[]
for r in records:
    candidates=index[norm(r['name'])]
    if len(candidates)!=1:
        missing.append(r)
        if candidates: duplicates.append(r)
        continue
    d=candidates[0]; matched.add(d['id']); counts[r['sheet']]+=1
    for field,func in [('class_name',cls),('dob',dob),('gender',norm),('guardian_name',norm),('guardian_phone',phone)]:
        if r[field] is not None and str(r[field]).strip() and func(r[field])!=func(d[field]):
            issues.append({'sheet':r['sheet'],'row':r['row'],'name':r['name'],'admission_no':d['admission_no'],'field':field,'correct_value':str(r[field]),'database_value':str(d[field] or '')})
    if not d['is_active']: issues.append({'sheet':r['sheet'],'row':r['row'],'name':r['name'],'admission_no':d['admission_no'],'field':'is_active','correct_value':'1','database_value':d['is_active']})
extra=[d for d in db if d['id'] not in matched]
def write_csv(name,rows,fields):
    with (out/name).open('w',newline='',encoding='utf-8-sig') as f:
        writer=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');writer.writeheader();writer.writerows(rows)
write_csv('field-differences.csv',issues,['sheet','row','name','admission_no','field','correct_value','database_value'])
write_csv('unmatched-spreadsheet-students.csv',missing,['sheet','row','name','class_name'])
write_csv('unmatched-database-students.csv',extra,['id','admission_no','last_name','first_name','class_name','is_active'])
summary={'spreadsheet_students':len(records),'database_students':len(db),'matched_spreadsheet_rows':sum(counts.values()),'matched_database_students':len(matched),'unmatched_spreadsheet':len(missing),'unmatched_database':len(extra),'field_differences':dict(Counter(i['field'] for i in issues)),'source_duplicate_names':{k:v for k,v in Counter(norm(r['name']) for r in records).items() if v>1},'ambiguous_database_matches':len(duplicates),'by_sheet':dict(Counter(r['sheet'] for r in records))}
(out/'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2));print('UNMATCHED SOURCE',json.dumps(missing,default=str));print('UNMATCHED DB',json.dumps(extra,default=str));print('DIFFERENCES',json.dumps(issues,default=str))
