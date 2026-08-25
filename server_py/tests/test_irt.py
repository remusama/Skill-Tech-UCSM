import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from server_py.diagnostico.analytics.irt import estimate_latent_ability

def run_tests():
    print("Running IRT (TRI) Mathematical Model Tests...")
    
    # Scenario 1: All questions correct (Perfect score)
    perfect_items = [
        {"questionId": 101, "question": "Easy math question", "correct": True},
        {"questionId": 102, "question": "Medium math question", "correct": True},
        {"questionId": 103, "question": "Hard math question", "correct": True},
        {"questionId": 104, "question": "Very hard math question", "correct": True},
    ]
    res_perfect = estimate_latent_ability(perfect_items)
    print(f"\n[Perfect Score] Theta: {res_perfect['theta']} | TRI Score: {res_perfect['score_tri']}")
    assert res_perfect["score_tri"] > 80.0, "Perfect score should yield a very high TRI ability"

    # Scenario 2: All questions incorrect (Zero score)
    zero_items = [
        {"questionId": 101, "question": "Easy math question", "correct": False},
        {"questionId": 102, "question": "Medium math question", "correct": False},
        {"questionId": 103, "question": "Hard math question", "correct": False},
        {"questionId": 104, "question": "Very hard math question", "correct": False},
    ]
    res_zero = estimate_latent_ability(zero_items)
    print(f"[Zero Score] Theta: {res_zero['theta']} | TRI Score: {res_zero['score_tri']}")
    assert res_zero["score_tri"] < 20.0, "Zero score should yield a very low TRI ability"

    # Scenario 3: Mixed responses (Moderate score)
    mixed_items = [
        {"questionId": 101, "question": "Easy math question", "correct": True},   # Correct on easy
        {"questionId": 102, "question": "Medium math question", "correct": True},  # Correct on medium-easy
        {"questionId": 103, "question": "Hard math question", "correct": False},  # Incorrect on medium-hard
        {"questionId": 104, "question": "Very hard math question", "correct": False}, # Incorrect on hard
    ]
    res_mixed = estimate_latent_ability(mixed_items)
    print(f"[Mixed Score 1] Theta: {res_mixed['theta']} | TRI Score: {res_mixed['score_tri']}")
    assert 30.0 <= res_mixed["score_tri"] <= 70.0, "Mixed score should be moderate"

    # Scenario 4: Answering a highly discriminative, difficult item correctly vs. an easy one
    # If the user gets the hard question correct and easy wrong:
    # 105 has high difficulty (1.5) and high discrimination (1.8)
    # 101 has low difficulty (-1.5) and lower discrimination (1.1)
    smart_hard_correct = [
        {"questionId": 101, "question": "Easy math question", "correct": False},
        {"questionId": 105, "question": "Very hard math question", "correct": True},
    ]
    res_smart_hard = estimate_latent_ability(smart_hard_correct)
    
    smart_easy_correct = [
        {"questionId": 101, "question": "Easy math question", "correct": True},
        {"questionId": 105, "question": "Very hard math question", "correct": False},
    ]
    res_smart_easy = estimate_latent_ability(smart_easy_correct)
    
    print(f"[Hard Item Correct] Theta: {res_smart_hard['theta']} | TRI Score: {res_smart_hard['score_tri']}")
    print(f"[Easy Item Correct] Theta: {res_smart_easy['theta']} | TRI Score: {res_smart_easy['score_tri']}")
    
    # Due to higher difficulty and discrimination of 105, getting it correct should yield higher theta than getting only 101 correct
    assert res_smart_hard["score_tri"] > res_smart_easy["score_tri"], "Getting hard discriminative items correct should yield higher latent ability"

    print("\nAll TRI mathematical assertions passed successfully!")

if __name__ == "__main__":
    run_tests()
