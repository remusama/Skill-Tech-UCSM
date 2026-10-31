import re

with open('lib/casasData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Match entries inside ALL_48_STUDENTS
# Format:
# username: "...",
# full_name: "...",
# email: "...",
# classroom: "...",
# house: "...",
pattern = re.compile(
    r'username:\s*"([^"]+)",\s*full_name:\s*"([^"]+)",\s*email:\s*"([^"]+)",\s*classroom:\s*"([^"]+)",\s*house:\s*"([^"]+)"'
)
matches = pattern.findall(text)
print(f"Total official in casasData.ts: {len(matches)}")
by_house = {}
for u, fn, em, cl, h in matches:
    by_house.setdefault(h, []).append({"username": u, "full_name": fn, "email": em, "classroom": cl, "house": h})

for h in ["APEX", "IGNIS", "NEXUS", "VISIO"]:
    lst = by_house.get(h, [])
    print(f"\n=== CASA OFICIAL {h}: {len(lst)} estudiantes ===")
    for s in lst:
        print(f"  {s['full_name']} | {s['email']}")

