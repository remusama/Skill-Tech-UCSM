def calculate_ewma_baseline(current_z_scores: dict, previous_baseline: dict = None, alpha: float = 0.3) -> dict:
    """
    User Baseline Model.
    Actualiza el perfil estadístico del usuario usando EWMA (Exponentially Weighted Moving Average).
    alpha = 0.3 significa que la sesión actual pesa el 30%, y todo el pasado pesa el 70%.
    """
    if not previous_baseline:
        # Primer examen del usuario, la línea base es la sesión actual
        return {
            "ewma_z_time": current_z_scores["z_time"],
            "ewma_z_deletions": current_z_scores["z_deletions"],
            "session_count": 1
        }

    # Calcular nuevo EWMA
    new_ewma_z_time = (alpha * current_z_scores["z_time"]) + ((1 - alpha) * previous_baseline.get("ewma_z_time", 0))
    new_ewma_z_deletions = (alpha * current_z_scores["z_deletions"]) + \
        ((1 - alpha) * previous_baseline.get("ewma_z_deletions", 0))

    return {
        "ewma_z_time": round(new_ewma_z_time, 3),
        "ewma_z_deletions": round(new_ewma_z_deletions, 3),
        "session_count": previous_baseline.get("session_count", 1) + 1
    }
