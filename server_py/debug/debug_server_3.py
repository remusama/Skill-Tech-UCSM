import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import traceback

# Permitir ejecutar como script desde server_py/ o desde root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

print(">>> Starting Debug Import Sequence")

try:
    print(">>> 1. Importing FastAPI")
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    
    print(">>> 2. Importing Routers...")
    
    print("   > Importing chat")
    from routers import chat
    print("   > Importing stt")
    from routers import stt
    print("   > Importing health")
    from routers import health
    print("   > Importing diagnosis")
    from routers import diagnosis
    print("   > Importing tts")
    from routers import tts
    print("   > Importing eleven_tts")
    from routers import eleven_tts
    print("   > Importing gemini")
    from routers import gemini
    print("   > Importing auth")
    from routers import auth
    print("   > Importing ws_chat")
    from routers import ws_chat

    print(">>> 3. Creating App")
    app = FastAPI()

    print(">>> 4. Configuring Middleware")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    print(">>> 5. Including Routers")
    app.include_router(chat.router)
    app.include_router(stt.router)
    app.include_router(gemini.router)
    app.include_router(health.router)
    app.include_router(diagnosis.router)
    app.include_router(tts.router)
    app.include_router(eleven_tts.router)
    app.include_router(auth.router)
    app.include_router(ws_chat.router)
    
    print(">>> SUCCESS: App created and configured.")

except Exception as e:
    print("!!! ERROR DURING STARTUP !!!")
    print(str(e))
    traceback.print_exc()

print(">>> End of Debug Script")
