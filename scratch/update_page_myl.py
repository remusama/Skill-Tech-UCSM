target = 'app/page.tsx'
with open(target, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Dynamic imports
old_dyn = "const PonenciasManagerPanel = dynamic(() => import(\"@/components/mentor/PonenciasManagerPanel\").then(mod => mod.PonenciasManagerPanel), { ssr: false })"
new_dyn = """const PonenciasManagerPanel = dynamic(() => import("@/components/mentor/PonenciasManagerPanel").then(mod => mod.PonenciasManagerPanel), { ssr: false })
const MylStudentPlatform = dynamic(() => import("@/components/myl/MylStudentPlatform").then(mod => mod.MylStudentPlatform), { ssr: false })
const MylManagerConsole = dynamic(() => import("@/components/myl/MylManagerConsole").then(mod => mod.MylManagerConsole), { ssr: false })"""

if old_dyn in text:
    text = text.replace(old_dyn, new_dyn)
elif old_dyn.replace('\n', '\r\n') in text:
    text = text.replace(old_dyn.replace('\n', '\r\n'), new_dyn.replace('\n', '\r\n'))
else:
    print("Could not find old_dyn in app/page.tsx")

# 2. PAGE_TITLE_MAP
old_map = '  "mentor-agents": "Agentes",\n}'
new_map = '  "mentor-agents": "Agentes",\n  "myl-economy": "Tokenomía MYL",\n  "mentor-myl": "Banco Central MYL",\n}'

if old_map in text:
    text = text.replace(old_map, new_map)
elif old_map.replace('\n', '\r\n') in text:
    text = text.replace(old_map.replace('\n', '\r\n'), new_map.replace('\n', '\r\n'))
else:
    print("Could not find old_map in app/page.tsx")

# 3. Teacher view render
old_teach_render = '{currentPage === "mentor-ponencias" && <PonenciasManagerPanel />}'
new_teach_render = '{currentPage === "mentor-ponencias" && <PonenciasManagerPanel />}\n              {currentPage === "mentor-myl" && <MylManagerConsole />}'

if old_teach_render in text:
    text = text.replace(old_teach_render, new_teach_render)
elif old_teach_render.replace('\n', '\r\n') in text:
    text = text.replace(old_teach_render.replace('\n', '\r\n'), new_teach_render.replace('\n', '\r\n'))
else:
    print("Could not find old_teach_render")

# 4. Student view render
old_stud_render = '{currentPage === "ponencias" && <PonenciasPanel />}'
new_stud_render = '{currentPage === "ponencias" && <PonenciasPanel />}\n              {currentPage === "myl-economy" && <MylStudentPlatform />}'

if old_stud_render in text:
    text = text.replace(old_stud_render, new_stud_render)
elif old_stud_render.replace('\n', '\r\n') in text:
    text = text.replace(old_stud_render.replace('\n', '\r\n'), new_stud_render.replace('\n', '\r\n'))
else:
    print("Could not find old_stud_render")

with open(target, 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print("Updated app/page.tsx successfully!")

