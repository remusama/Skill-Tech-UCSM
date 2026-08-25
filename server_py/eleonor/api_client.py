from fastapi import APIRouter, UploadFile, File, HTTPException
from server_py.diagnostico.agents import SYNTHESIZER

router = APIRouter()

@router.post("/api/gemini/listen")
async def gemini_listen(file: UploadFile = File(...)):
    """
    Endpoint formerly used for audio sensors. 
    Feature removed as per user request to delete 'sensors' module implementation.
    """
    # Previously: from server_py.funciones.sensors import listen_to_audio
    # This functionality has been removed.
    print(f"⚠️ [GEMINI-LISTEN] Endpoint called but functionality is removed.")
    raise HTTPException(status_code=501, detail="This endpoint is deprecated and the sensors module has been removed.")
