import sys
import os

# Add root to path
root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(root)

try:
    print("Starting FastAPI app manually...")
    from server_py.main import app
    print("✅ App instance created")
    
    # We won't run uvicorn here to stay synchronous and see the error
    # But just importing 'app' should trigger the router inclusions and their imports
    
except Exception as e:
    print(f"❌ Error during app initialization: {e}")
    import traceback
    traceback.print_exc()
