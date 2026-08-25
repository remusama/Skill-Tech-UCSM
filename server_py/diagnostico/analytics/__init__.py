from .validation import validate_signals
from .calibration import get_domain_calibration
from .normalization import normalize_metrics
from .baseline import calculate_ewma_baseline
from .clustering import generate_behavioral_cluster

def process_telemetry_pipeline(items: list, area: str, previous_baseline: dict = None) -> dict:
    """
    Orquesta el flujo de la Fase 2: Analytics Pipeline.
    Transforma la telemetría cruda en métricas contextualizadas y evolutivas.
    """
    
    # 1. Domain Calibration
    calibration = get_domain_calibration(area)
    
    # 2. Signal Validation (Filtro de Ruido IQR)
    validated_items = validate_signals(items, calibration)
    
    # 3. Context Normalization (Z-Scores)
    z_scores = normalize_metrics(validated_items, calibration)
    
    if z_scores["valid_samples"] == 0:
        return {
            "status": "error",
            "message": "Sin datos válidos tras el filtro de ruido."
        }
    
    # 4. User Baseline Model (EWMA)
    new_baseline = calculate_ewma_baseline(z_scores, previous_baseline)
    
    # 5. Behavioral Clustering (Estado de la sesión actual)
    clustering = generate_behavioral_cluster(z_scores, previous_baseline)
    
    return {
        "status": "success",
        "z_scores": z_scores,
        "new_baseline": new_baseline,
        "clustering": clustering
    }
