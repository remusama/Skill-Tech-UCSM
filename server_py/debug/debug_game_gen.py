import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from server_py.core.gemini_pro_diagnostic.game_generator import GAME_GENERATOR
import json

def test_game_gen():
    profile = {
        "state": {"valence": "neutra", "tension": 0.8, "engagement": 0.4},
        "cognitive": "Usuario con alta capacidad lógica pero poca tolerancia a la frustración."
    }
    
    print("--- Probando Generación de Juego (Pattern Break) ---")
    game = GAME_GENERATOR.generate_game(profile, "Validar resistencia al cambio")
    print(json.dumps(game, indent=2))
    
    print("\n--- Probando Generación de Juego (Swapped Logic) ---")
    game2 = GAME_GENERATOR.generate_game(profile, "Observar impulsividad")
    print(json.dumps(game2, indent=2))

if __name__ == "__main__":
    test_game_gen()
