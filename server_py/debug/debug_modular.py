from server_py.core.gemini_pro_diagnostic.engineering_agent import EngineeringAgent
import asyncio
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


async def debug_modular():
    log_file = open("debug_log.txt", "w", encoding="utf-8")
    sys.stdout = log_file
    sys.stderr = log_file

    print("DEBUG: Instantiating EngineeringAgent...")
    try:
        agent = EngineeringAgent()

        mock_data = {
            "items": [{"question": "Q1", "answer": "A1"}],
            "totalTime": 60
        }

        print("DEBUG: Calling analyze()...")
        result = agent.analyze(mock_data)

        print(f"RESULT: {result}")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CRITICAL ERROR: {e}")
    finally:
        log_file.close()

if __name__ == "__main__":
    asyncio.run(debug_modular())
