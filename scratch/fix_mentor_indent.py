with open('server_py/routers/mentor.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

replacement = [
    '        else:\n',
    '            synced_snaps = SYNCED_TIMELINE_EVALUATIONS.get(str(s_id)) or SYNCED_TIMELINE_EVALUATIONS.get(s_name)\n',
    '            if not synced_snaps:\n',
    '                baseline_scores = {\n',
    '                    "escucha_activa": round(3.5 + ((s_id * 3) % 15) * 0.1, 1),\n',
    '                    "comunicacion_asertiva": round(3.4 + ((s_id * 5) % 15) * 0.1, 1),\n',
    '                    "trabajo_equipo": round(3.6 + ((s_id * 2) % 14) * 0.1, 1),\n',
    '                    "liderazgo_gestion": round(3.5 + ((s_id * 4) % 15) * 0.1, 1),\n',
    '                    "pensamiento_critico": round(3.7 + ((s_id * 7) % 13) * 0.1, 1),\n',
    '                    "resolucion_problemas": round(3.5 + ((s_id * 6) % 15) * 0.1, 1),\n',
    '                    "adaptabilidad_autogestion": round(3.8 + ((s_id * 1) % 12) * 0.1, 1),\n',
    '                }\n',
    '                baseline_scores = {k: min(5.0, max(1.0, v)) for k, v in baseline_scores.items()}\n',
    '                avg_timeline = round(sum(baseline_scores.values()) / len(baseline_scores), 2)\n',
    '                snapshots = [{\n',
    '                    "id": f"snap-{s_id}-init",\n',
    '                    "date": "01/09/2026 10:00",\n',
    '                    "average": avg_timeline,\n',
    '                    "scores": baseline_scores\n',
    '                }]\n',
    '            else:\n',
    '                snapshots = synced_snaps\n'
]

lines[1021:1043] = replacement

with open('server_py/routers/mentor.py', 'w', encoding='utf-8', newline='\n') as f:
    f.writelines(lines)

print('Updated successfully!')

