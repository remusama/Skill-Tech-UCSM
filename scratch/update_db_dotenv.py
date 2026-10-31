import os

target_file = 'server_py/memoria/database.py'
with open(target_file, 'r', encoding='utf-8') as f:
    text = f.read()

old_block = """# Rutas base.
MEMORIA_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_PY_DIR = os.path.dirname(MEMORIA_DIR)
BASE_DIR = os.path.dirname(SERVER_PY_DIR)

# Configuración de la base de datos."""

new_block = """# Rutas base.
MEMORIA_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_PY_DIR = os.path.dirname(MEMORIA_DIR)
BASE_DIR = os.path.dirname(SERVER_PY_DIR)

from dotenv import load_dotenv
env_path = os.path.join(BASE_DIR, ".env")
if os.path.exists(env_path):
    load_dotenv(env_path, override=False)

# Configuración de la base de datos."""

text = text.replace(old_block.replace('\n', '\r\n'), new_block.replace('\n', '\r\n'))

with open(target_file, 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print("Updated database.py with dotenv loading!")

