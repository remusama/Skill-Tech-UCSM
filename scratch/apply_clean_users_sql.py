import sys
import re
sys.path.insert(0, '.')

with open('usuario_registro/users_rows.sql', 'r', encoding='utf-8') as f:
    content = f.read().strip()

# Extract the insert header
cols_match = re.search(r'INSERT INTO [^\(]+\((.*?)\)\s+VALUES\s+', content, re.IGNORECASE | re.DOTALL)
header = content[:cols_match.end()]

from server_py.scripts.auto_seed_students import parse_sql_users
users = parse_sql_users('usuario_registro/users_rows.sql')

# Keep only Pierre and the 48 official students
clean_users = [u for u in users if u.get('id') == 1 or str(u.get('email') or '').lower().endswith('@liderazgo.ucsm.pe')]

print(f"Clean users count: {len(clean_users)}")

# Build SQL tuples
def quote_val(val):
    if val is None:
        return 'null'
    if isinstance(val, (int, float)):
        return str(val)
    # String
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"

# Column names from match
cols = [c.strip().strip('"').strip("'") for c in cols_match.group(1).split(",")]

tuples = []
for u in clean_users:
    vals = [quote_val(u.get(c)) for c in cols]
    tuples.append(f"({', '.join(vals)})")

new_sql = header + ',\n'.join(tuples) + ';\n'

with open('usuario_registro/users_rows.sql', 'w', encoding='utf-8') as f:
    f.write(new_sql)

print("usuario_registro/users_rows.sql successfully overwritten with clean 49 users.")

