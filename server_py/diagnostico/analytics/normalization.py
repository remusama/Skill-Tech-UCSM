def normalize_metrics(validated_items: list, domain_calibration: dict) -> dict:
    """
    Context Normalization Engine.
    Convierte métricas absolutas en Z-scores basados en la calibración del dominio.
    (En Fase 2, aproximamos la desviación estándar usando IQR / 1.35)
    """
    
    # 1. Agrupar métricas limpias (excluyendo ruido)
    clean_items = [item for item in validated_items if not item.get("is_noise", False)]
    
    if not clean_items:
        return {
            "z_time": 0.0,
            "z_deletions": 0.0,
            "valid_samples": 0
        }
        
    # Promedios de la sesión actual
    avg_time = sum(i["telemetry"]["time_spent_ms"] for i in clean_items if i.get("telemetry")) / len(clean_items)
    
    # Solo para preguntas abiertas calculamos deletions
    text_items = [i for i in clean_items if i["type"] in ["open-ended", "input-text"]]
    avg_deletions = sum(i["telemetry"]["deletions"] for i in text_items if i.get("telemetry")) / len(text_items) if text_items else 0
    
    # 2. Aproximación de Z-score (Z = (X - Mu) / Sigma)
    # Mu poblacional (teórico Fase 2)
    mu_time = domain_calibration["expected_time_ms"]
    mu_deletions = domain_calibration["expected_deletions"]
    
    # Aproximación Sigma = IQR / 1.35 para distribución normal
    sigma_time = domain_calibration["iqr_time_ms"] / 1.35
    sigma_deletions = max(mu_deletions * 0.5, 2.0) # Heurística temporal
    
    z_time = (avg_time - mu_time) / sigma_time if sigma_time > 0 else 0
    z_deletions = (avg_deletions - mu_deletions) / sigma_deletions if sigma_deletions > 0 else 0
    
    return {
        "z_time": round(z_time, 3),
        "z_deletions": round(z_deletions, 3),
        "valid_samples": len(clean_items)
    }
