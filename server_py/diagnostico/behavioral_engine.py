from typing import List, Dict


def extract_features(items: List[any]) -> Dict[str, float]:
    """
    Extrae métricas conductuales (Process Data) de la telemetría enviada por el frontend.
    Esta es la Fase 1 del Behavioral Engine.
    """
    total_time_ms = 0
    total_keystrokes = 0
    total_deletions = 0
    total_focus_lost = 0
    total_length = 0

    valid_text_items = 0

    for item in items:
        # Check if item has telemetry
        t = getattr(item, 'telemetry', None)
        if not t:
            continue

        total_time_ms += t.time_spent_ms
        total_focus_lost += t.focus_lost_count

        # Consideramos métricas de texto solo para open-ended o input-text
        if item.type in ['open-ended', 'input-text']:
            total_keystrokes += t.keystrokes
            total_deletions += t.deletions
            total_length += len(item.answer) if item.answer else 0
            valid_text_items += 1

    # 1. Raw Text Density: (Longitud final / Keystrokes)
    # 1.0 = Escribió perfectamente sin equivocarse.
    # < 0.5 = Borró más de la mitad de lo que escribió (Duda/Reestructuración).
    # Nota: Alta densidad NO implica calidad (puede ser texto basura).
    raw_text_density = 1.0
    if total_keystrokes > 0:
        raw_text_density = total_length / total_keystrokes

    # 2. Average Speed (Caracteres por segundo)
    avg_speed_cps = 0.0
    time_s = total_time_ms / 1000.0
    if time_s > 0 and valid_text_items > 0:
        avg_speed_cps = total_length / time_s

    # 3. Interaction Friction Index: Alta tasa de borrado y foco perdido. (Escala aproximada 0-1)
    # Mide la "fricción" o resistencia en la interacción, no necesariamente una emoción negativa.
    interaction_friction_index = 0.0
    if total_keystrokes > 0:
        deletion_ratio = total_deletions / total_keystrokes
        focus_penalty = min(total_focus_lost * 0.1, 0.5)
        interaction_friction_index = min(deletion_ratio * 2.0 + focus_penalty, 1.0)

    # 4. Outlier Detection: Si el tiempo por pregunta es excesivo (ej: > 10 min por un reactivo)
    # El frontend pausa el timer, pero si llega inflado, lo marcamos.
    is_time_outlier = total_time_ms > (10 * 60 * 1000)

    return {
        "raw_text_density": round(raw_text_density, 3),
        "avg_speed_cps": round(avg_speed_cps, 3),
        "interaction_friction_index": round(interaction_friction_index, 3),
        "total_focus_lost": total_focus_lost,
        "is_time_outlier": is_time_outlier
    }
