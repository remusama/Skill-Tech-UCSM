import os

target = 'server_py/main.py'
with open(target, 'r', encoding='utf-8') as f:
    text = f.read()

old_import = "from server_py.routers import ponencias  # noqa: E402"
new_import = "from server_py.routers import ponencias  # noqa: E402\nfrom server_py.routers import myl_economy  # noqa: E402"

old_include = "app.include_router(ponencias.router)"
new_include = "app.include_router(ponencias.router)\napp.include_router(myl_economy.router)"

if old_import in text:
    text = text.replace(old_import, new_import)
elif old_import.replace('\n', '\r\n') in text:
    text = text.replace(old_import.replace('\n', '\r\n'), new_import.replace('\n', '\r\n'))

if old_include in text:
    text = text.replace(old_include, new_include)
elif old_include.replace('\n', '\r\n') in text:
    text = text.replace(old_include.replace('\n', '\r\n'), new_include.replace('\n', '\r\n'))

with open(target, 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print("Registered myl_economy router in main.py!")

