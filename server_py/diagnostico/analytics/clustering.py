def generate_behavioral_cluster(z_scores: dict, baseline: dict = None) -> dict:
    """
    Behavioral Clustering Engine.
    Clasifica el estado ACTUAL de la sesión en base a los Z-Scores y su distancia al baseline.
    No es un perfil psicológico permanente.
    """
    z_time = z_scores.get("z_time", 0)
    z_del = z_scores.get("z_deletions", 0)
    
    # 1. Cluster Absoluto (Comparado con la Población/Dominio Teórico)
    cluster = "baseline_consistent"
    if z_time < -1.0 and z_del > 1.0:
        cluster = "fast_unstable"
    elif z_time > 1.0 and z_del < -0.5:
        cluster = "slow_precise"
    elif z_time < -1.0 and z_del < -0.5:
        cluster = "fast_precise"
    elif z_time > 1.0 and z_del > 1.0:
        cluster = "slow_unstable"
        
    # 2. Análisis Temporal (Comparado consigo mismo si hay baseline)
    evolution_signal = "stable"
    if baseline and baseline.get("session_count", 0) > 1:
        # Distancia al baseline
        ewma_time = baseline["ewma_z_time"]
        diff_time = z_time - ewma_time
        
        if diff_time < -0.5:
            evolution_signal = "improving_speed"
        elif diff_time > 0.5:
            evolution_signal = "slowing_down"
            
    return {
        "session_cluster": cluster,
        "evolution_signal": evolution_signal
    }
