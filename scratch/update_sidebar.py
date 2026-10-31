target = 'components/layout/SidebarNavigation.tsx'
with open(target, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Line 26: '  PieChart\n' -> '  PieChart,\n  Coins,\n  Landmark\n'
for idx, l in enumerate(lines[:35]):
    if 'PieChart' in l and 'from "lucide-react"' in lines[idx+1]:
        lines[idx] = '  PieChart,\n  Coins,\n  Landmark\n'
        break

# In navItems, add Tokenomía MYL
for idx, l in enumerate(lines[:50]):
    if 'label: "SkillMap"' in l:
        lines.insert(idx + 1, '  { icon: Coins, label: "Tokenomía MYL", page: "myl-economy" },\n')
        break

# In teacherNavItems, add Banco MYL
for idx, l in enumerate(lines[:65]):
    if 'label: "Dashboard"' in l:
        lines.insert(idx + 1, '  { icon: Landmark, label: "Banco MYL", page: "mentor-myl" },\n')
        break

with open(target, 'w', encoding='utf-8', newline='\n') as f:
    f.writelines(lines)

print("Updated SidebarNavigation.tsx successfully!")

