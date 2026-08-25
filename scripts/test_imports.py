import sys
import os

# Add root to path
root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(root)

try:
    print("Testing imports from server_py.routers.diagnosis...")
    from server_py.routers import diagnosis
    print("✅ Diagnosis router imported successfully")
    
    from server_py.core.settings import OPENAI_API_KEY, GEMINI_API_KEY
    print(f"✅ Settings imported. OpenAI Key present: {bool(OPENAI_API_KEY)}, Gemini Key present: {bool(GEMINI_API_KEY)}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
