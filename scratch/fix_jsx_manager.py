target = 'components/myl/MylManagerConsole.tsx'
with open(target, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('(> ±30%)', '(&gt; ±30%)')

with open(target, 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print("Fixed JSX > token in MylManagerConsole.tsx!")

