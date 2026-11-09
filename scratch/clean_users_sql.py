import re
import sys
sys.path.insert(0, '.')

with open('usuario_registro/users_rows.sql', 'r', encoding='utf-8') as f:
    content = f.read().strip()

# Let's inspect the INSERT header and tuples
match = re.search(r'INSERT INTO [^\(]+\((.*?)\)\s+VALUES\s+', content, re.IGNORECASE)
header = match.group(0)

from server_py.scripts.auto_seed_students import parse_sql_users
users = parse_sql_users('usuario_registro/users_rows.sql')

print(f"Total parsed users: {len(users)}")
clean_users = []
for u in users:
    uid = u.get('id')
    email = str(u.get('email') or '').lower()
    role = u.get('role')
    # Keep Pierre (admin/teacher) and official students (@liderazgo.ucsm.pe)
    if uid == 1 or email.endswith('@liderazgo.ucsm.pe'):
        clean_users.append(u)
    else:
        print(f"Removing infiltrated user: ID={uid}, username={u.get('username')}, email={email}, role={role}")

print(f"Remaining clean users: {len(clean_users)} (1 teacher + 48 official students = 49 total)")
