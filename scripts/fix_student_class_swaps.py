"""Correct class assignments from the authoritative school list, with backup."""
import csv
import re
import sqlite3
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r'C:\Users\hephz\Downloads\SCHOOL LIST-1.xlsx')
OUTPUT = ROOT / 'outputs' / 'student-comparison-2026-11-11'


def name_key(value):
    return ' '.join(re.findall(r'[A-Z0-9]+', str(value or '').upper()))


def class_key(value):
    key = name_key(value).replace(' ', '').replace('BASIC', 'PRIMARY')
    return {'PN': 'PRENURSERY', 'DC': 'CRECHE'}.get(key, key)


def main():
    workbook = openpyxl.load_workbook(SOURCE, read_only=True, data_only=True)
    expected = {}
    for sheet in workbook:
        for number, row in enumerate(sheet.values, 1):
            if number < 3 or not row[1] or not isinstance(row[0], (int, float)):
                continue
            key = name_key(row[1])
            assert key not in expected, f'Duplicate source name: {key}'
            expected[key] = class_key(row[4])
    workbook.close()
    connection = sqlite3.connect(ROOT / 'server/data/eaglepower.db')
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys = ON')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    backup_path = OUTPUT / f'before-class-fix-{datetime.now():%Y%m%d-%H%M%S}.db'
    with sqlite3.connect(backup_path) as backup:
        connection.backup(backup)
    changes = []
    try:
        connection.execute('BEGIN IMMEDIATE')
        before = {r['id']: dict(r) for r in connection.execute('SELECT * FROM students')}
        classes = defaultdict(list)
        for row in connection.execute('SELECT id, name FROM classes'):
            classes[class_key(row['name'])].append(dict(row))
        seen = set()
        for student in before.values():
            key = name_key(student['last_name'] + ' ' + student['first_name'])
            assert key in expected and key not in seen, f'Unmatched or duplicate student: {key}'
            seen.add(key)
            old = connection.execute('SELECT name FROM classes WHERE id = ?', (student['class_id'],)).fetchone()
            if old and class_key(old['name']) == expected[key]:
                continue
            targets = classes[expected[key]]
            assert len(targets) == 1, f'Ambiguous class: {expected[key]}'
            target = targets[0]
            if student['class_id'] == target['id']:
                continue
            assert {class_key(old['name']), class_key(target['name'])} == {'PRIMARY4', 'JSS2'}, 'Unexpected class difference'
            connection.execute('UPDATE students SET class_id = ? WHERE id = ?', (target['id'], student['id']))
            changes.append(dict(admission_no=student['admission_no'], name=key, old_class=old['name'], corrected_class=target['name']))
        assert seen == set(expected), 'Student sets differ'
        after = {r['id']: dict(r) for r in connection.execute('SELECT * FROM students')}
        assert before.keys() == after.keys()
        for sid, row in after.items():
            assert all(row[k] == before[sid][k] for k in row if k != 'class_id'), 'Unrelated student field changed'
            actual = connection.execute('SELECT name FROM classes WHERE id = ?', (row['class_id'],)).fetchone()
            assert class_key(actual['name']) == expected[name_key(row['last_name'] + ' ' + row['first_name'])]
        assert connection.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        connection.commit()
    except BaseException:
        connection.rollback()
        raise
    finally:
        connection.close()
    with (OUTPUT / 'corrected-class-assignments.csv').open('w', newline='', encoding='utf-8-sig') as handle:
        writer = csv.DictWriter(handle, fieldnames=['admission_no', 'name', 'old_class', 'corrected_class'])
        writer.writeheader()
        writer.writerows(changes)
    print(f'Corrected {len(changes)} students. Verified all {len(expected)} class assignments against spreadsheet.')
    print(f'Backup: {backup_path}')


if __name__ == '__main__':
    main()
