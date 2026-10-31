with open('server_py/memoria/database.py', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if line.strip() == 'BASE_DIR = os.path.dirname(SERVER_PY_DIR)':
        lines.insert(idx + 1, 'from dotenv import load_dotenv\nload_dotenv(os.path.join(BASE_DIR, ".env"), override=False)\n')
        break

with open('server_py/memoria/database.py', 'w', encoding='utf-8', newline='\n') as f:
    f.writelines(lines)

print("Injected load_dotenv into database.py!")

