def validate_signals(telemetry_items: list, domain_calibration: dict) -> list:
    """
    Filtro de ruido (Signal Validation Layer).
    Descarta outliers masivos basándose en IQR (estimado/hardcodeado en Phase 2).
    """
    valid_items = []
    
    # Rango de tiempo teórico esperado por defecto si no hay en calibración
    # En Fase 3 esto se calculará dinámicamente con IQR poblacional.
    q3_time_ms = domain_calibration.get("q3_time_ms", 90000) # 90s
    iqr_time_ms = domain_calibration.get("iqr_time_ms", 60000) # 60s
    
    # Límite superior: Q3 + 1.5 * IQR
    upper_bound_time = q3_time_ms + (1.5 * iqr_time_ms)
    
    for item in telemetry_items:
        # Check if it has telemetry
        t = getattr(item, 'telemetry', None)
        is_noise = False
        
        if t:
            # 1. Filtro de tiempo excesivo (Outlier bruto)
            if t.time_spent_ms > upper_bound_time:
                is_noise = True
                
            # 2. Filtro de pérdida de foco masiva (ej. se fue de la pestaña más de 5 veces en 1 pregunta corta)
            if t.focus_lost_count > 5:
                is_noise = True
                
        # Anotamos el item
        item_dict = item.dict()
        item_dict["is_noise"] = is_noise
        valid_items.append(item_dict)
        
    return valid_items
