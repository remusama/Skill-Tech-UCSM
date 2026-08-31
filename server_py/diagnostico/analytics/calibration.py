def get_domain_calibration(area: str) -> dict:
    """
    Domain Calibration Engine.
    Retorna los rangos duros por dominio para la Fase 2 (hasta tener datos poblacionales).
    """
    area_norm = area.lower()

    # Valores teóricos para Fase 2 (Q1, Q3 en milisegundos)
    calibrations = {
        "matematicas": {
            "expected_time_ms": 60000,
            "q1_time_ms": 30000,
            "q3_time_ms": 120000,
            "iqr_time_ms": 90000,
            "expected_deletions": 5  # Matemáticas puede tener reescritura de fórmulas
        },
        "humanidades": {
            "expected_time_ms": 45000,
            "q1_time_ms": 20000,
            "q3_time_ms": 80000,
            "iqr_time_ms": 60000,
            "expected_deletions": 15  # Mayor reescritura en texto
        },
        "default": {
            "expected_time_ms": 50000,
            "q1_time_ms": 20000,
            "q3_time_ms": 90000,
            "iqr_time_ms": 70000,
            "expected_deletions": 10
        }
    }

    return calibrations.get(area_norm, calibrations["default"])
