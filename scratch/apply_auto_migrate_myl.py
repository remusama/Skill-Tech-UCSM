import os

target = 'server_py/scripts/auto_migrate.py'
with open(target, 'r', encoding='utf-8') as f:
    text = f.read()

old_tail = """    ("mentor_exam_questions", "correct_answer", "VARCHAR", "VARCHAR"),
    ("mentor_exam_questions", "dimension", "VARCHAR", "VARCHAR"),
    ("mentor_exam_assignments", "demographics", "JSONB", "JSON"),
]"""

new_tail = """    ("mentor_exam_questions", "correct_answer", "VARCHAR", "VARCHAR"),
    ("mentor_exam_questions", "dimension", "VARCHAR", "VARCHAR"),
    ("mentor_exam_assignments", "demographics", "JSONB", "JSON"),
    # ── Tokenomía MYL & Solana Token-2022 ─────────────────────────────────
    ("users", "solana_wallet_address", "VARCHAR(64)", "VARCHAR(64)"),
    ("users", "house", "VARCHAR(32)", "VARCHAR(32)"),
    ("users", "myl_balance_cash", "INTEGER DEFAULT 0", "INTEGER DEFAULT 0"),
    ("users", "myl_balance_digital", "INTEGER DEFAULT 0", "INTEGER DEFAULT 0"),
    ("users", "myl_house_points_session", "INTEGER DEFAULT 0", "INTEGER DEFAULT 0"),
]"""

if old_tail in text:
    text = text.replace(old_tail, new_tail)
elif old_tail.replace('\n', '\r\n') in text:
    text = text.replace(old_tail.replace('\n', '\r\n'), new_tail.replace('\n', '\r\n'))
else:
    print("Could not find old_tail in auto_migrate.py")

with open(target, 'w', encoding='utf-8', newline='') as f:
    f.write(text)

print("Updated auto_migrate.py with MYL columns!")

