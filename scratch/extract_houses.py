import re
import json

with open('lib/casasData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(
    r'username:\s*"([^"]+)",\s*full_name:\s*"([^"]+)",\s*email:\s*"([^"]+)",\s*classroom:\s*"([^"]+)",\s*house:\s*"([^"]+)"'
)
matches = pattern.findall(text)

students = []
for u, fn, em, cl, h in matches:
    students.append({
        "username": u,
        "full_name": fn,
        "email": em.lower().strip(),
        "classroom": cl,
        "house": h
    })

print(f"Total extracted: {len(students)}")
from collections import Counter
counts = Counter(s["house"] for s in students)
print("Counts:", counts)

with open('scratch/canonical_48_students.json', 'w', encoding='utf-8') as out:
    json.dump(students, out, indent=2, ensure_ascii=False)
print("Saved to scratch/canonical_48_students.json")

