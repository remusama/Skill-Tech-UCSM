@echo off
echo ======================================
echo   Iniciando Backend de Eleonor AI
echo ======================================
echo.

cd /d "%~dp0"

REM Verificar si estamos en el directorio correcto
if not exist "server_py\main.py" (
    echo ERROR: No se encuentra server_py\main.py
    echo Asegurate de ejecutar este script desde la raiz del proyecto
    pause
    exit /b 1
)

SET PYTHONUNBUFFERED=1
SET PYTHONUTF8=1
SET PYTHONIOENCODING=utf-8

echo [1/2] Verificando dependencias...
python -m pip install -q -r server_py\requirements.txt

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Fallo al instalar dependencias
    pause
    exit /b 1
)

echo [2/2] Iniciando servidor FastAPI...
echo.
echo Servidor corriendo en: http://localhost:8000
echo Documentacion API: http://localhost:8000/docs
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

python -m uvicorn server_py.main:app --reload --host 0.0.0.0 --port 8000

pause
