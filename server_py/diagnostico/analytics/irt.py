import math

# A database of pre-calibrated items for academic and personal assessments
# Custom calibrations map questionId to custom discrimination (a) and difficulty (b) values.
KNOWN_ITEMS = {
    # Matemáticas Questions
    101: {"a": 1.1, "b": -1.5},
    102: {"a": 1.3, "b": -0.8},
    103: {"a": 1.5, "b": 0.0},
    104: {"a": 1.6, "b": 0.7},
    105: {"a": 1.8, "b": 1.5},

    # Ciencias Questions
    201: {"a": 1.0, "b": -1.2},
    202: {"a": 1.2, "b": -0.5},
    203: {"a": 1.4, "b": 0.2},
    204: {"a": 1.5, "b": 1.0},
    205: {"a": 1.7, "b": 1.8},

    # Razonamiento Questions
    301: {"a": 1.2, "b": -1.0},
    302: {"a": 1.4, "b": -0.2},
    303: {"a": 1.5, "b": 0.5},
    304: {"a": 1.6, "b": 1.2},
}


def get_item_calibration(question_id: int, index: int, total_items: int, question_text: str = "") -> dict:
    """
    Retrieves or dynamically estimates 2PL item parameters:
    - a (discrimination): typical range [0.5, 2.5]
    - b (difficulty): typical range [-3.0, 3.0]

    If question_id is in KNOWN_ITEMS, uses it.
    Else, distributes b dynamically based on the item index within the exam (easier at start, harder at end)
    and adjusts for keywords.
    """
    if question_id in KNOWN_ITEMS:
        return KNOWN_ITEMS[question_id]

    # Heuristics-based dynamic estimation
    # 1. Base difficulty distributed based on sequence order:
    if total_items > 1:
        base_b = -2.0 + 4.0 * (index / (total_items - 1))
    else:
        base_b = 0.0

    # Adjust difficulty for open-ended or longer questions
    b_adj = 0.0
    text_lower = question_text.lower()

    # Keywords indicating higher cognitive levels of Bloom's Taxonomy
    hard_words = ["cree", "diseñe", "evalúe", "justifique", "compare", "analice", "demuestre"]
    easy_words = ["defina", "liste", "cuál", "quién", "dónde", "cómo se llama"]

    if any(w in text_lower for w in hard_words):
        b_adj += 0.6
    elif any(w in text_lower for w in easy_words):
        b_adj -= 0.6

    final_b = max(-3.0, min(3.0, base_b + b_adj))

    # Discrimination (a) defaults to a healthy value, slightly adjusted by text depth
    base_a = 1.2
    if len(question_text) > 100:
        base_a += 0.2  # Deeper text often yields stronger discrimination

    return {"a": base_a, "b": final_b}


def estimate_latent_ability(graded_items: list) -> dict:
    """
    Estimates the latent ability (theta) of a user based on a 2-Parameter Logistic (2PL) model.
    Utilizes a robust Grid Search optimization over theta in [-3, 3] with steps of 0.05.

    graded_items: List of dicts, e.g.:
      [
         {"questionId": 101, "question": "...", "correct": True, "index": 0},
         ...
      ]

    Returns a dict containing:
      - theta: the estimated latent ability in [-3.0, 3.0]
      - score_tri: the scaled latent ability in [0.0, 100.0]
      - item_parameters: a list of calibration parameters utilized for each item
    """
    if not graded_items:
        return {"theta": 0.0, "score_tri": 50.0, "item_parameters": []}

    total_items = len(graded_items)
    calibrated_items = []

    for idx, item in enumerate(graded_items):
        q_id = item.get("questionId", 0)
        q_text = item.get("question", "")
        correct = item.get("correct", False)

        # 1 or 0 binary response
        y = 1 if correct else 0

        # Fetch or estimate parameters
        params = get_item_calibration(q_id, idx, total_items, q_text)

        calibrated_items.append({
            "questionId": q_id,
            "a": params["a"],
            "b": params["b"],
            "y": y
        })

    # Grid Search settings
    theta_min, theta_max = -3.0, 3.0
    step = 0.05
    steps_count = int((theta_max - theta_min) / step) + 1

    best_theta = 0.0
    max_log_likelihood = -float("inf")

    # 2. Iterate through ability grid
    for step_idx in range(steps_count):
        theta = theta_min + step_idx * step
        log_likelihood = 0.0

        for item in calibrated_items:
            a = item["a"]
            b = item["b"]
            y = item["y"]

            # Probability of correct response using 2PL model
            # P_i(theta) = 1 / (1 + exp(-a * (theta - b)))
            try:
                exponent = -a * (theta - b)
                # Clip exponent to avoid overflow/underflow
                exponent = max(-20.0, min(20.0, exponent))
                p = 1.0 / (1.0 + math.exp(exponent))
            except Exception:
                p = 0.5

            # Avoid ln(0) or ln(1)
            p = max(1e-9, min(1.0 - 1e-9, p))

            # Sum log-likelihood
            log_likelihood += y * math.log(p) + (1.0 - y) * math.log(1.0 - p)

        if log_likelihood > max_log_likelihood:
            max_log_likelihood = log_likelihood
            best_theta = theta

    print("\n" + "=" * 50)
    print("🧮 [IRT MATH ENGINE] Grid Search Optimization Log")
    print(f"Total ítems calibrados: {len(calibrated_items)}")
    for ci in calibrated_items:
        print(f"  -> Item {ci['questionId']}: a(discriminación)={ci['a']:.2f}, b(dificultad)={ci['b']:.2f}, Respuesta={'Correcta (1)' if ci['y'] == 1 else 'Incorrecta (0)'}")
    print(f"✅ Max Log-Likelihood: {max_log_likelihood:.4f} optimizado en Theta: {best_theta:.3f}")
    print("=" * 50 + "\n")

    # Scale theta from [-3.0, 3.0] to [0.0, 100.0]
    score_tri = ((best_theta + 3.0) / 6.0) * 100.0
    score_tri = round(max(0.0, min(100.0, score_tri)), 2)

    return {
        "theta": round(best_theta, 3),
        "score_tri": score_tri,
        "item_parameters": calibrated_items
    }
