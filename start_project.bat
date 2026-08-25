@echo off
REM ##################################################################
REM #  Script para iniciar todo el entorno del proyecto SkillTech AI   #
REM ##################################################################

ECHO Iniciando todos los servicios de Eleonor AI...

REM --- 0. Obtener IP Local automáticamente ---
FOR /F "tokens=*" %%i IN ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match '^(192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|10\.)' } | Select-Object -First 1).IPAddress"') DO SET "LOCAL_IP=%%i"

REM Guarda la ruta del directorio actual
set "project_root=%~dp0"

ECHO.
ECHO ==================================================================
ECHO   Tu IP Local es: %LOCAL_IP%
ECHO   RECUERDA: Crea un archivo .env.local con: 
ECHO   NEXT_PUBLIC_API_URL=http://%LOCAL_IP%:8000
ECHO ==================================================================
ECHO.
ECHO Seleccione el modo de inicio:
ECHO [1] Desarrollo Local (Solo esta PC)
ECHO [2] Multi-dispositivo (Visible en Red para Movil/Tablet)
ECHO.
SET /P mode="Opcion (1-2): "

REM --- 1. Iniciar el servidor de Frontend (Next.js) ---
cd /d "%project_root%"
IF "%mode%"=="2" GOTO MODO_RED

:MODO_LOCAL
ECHO [1/3] Iniciando Next.js en MODO LOCAL...
START "SkillTech Frontend" cmd /k "npm run dev"
GOTO SIGUIENTE_PASO

:MODO_RED
ECHO [1/3] Iniciando Next.js en MODO RED (0.0.0.0)...
ECHO Tu IP para el movil: http://%LOCAL_IP%:3000
START "SkillTech Frontend RED" cmd /k "npx next dev --hostname 0.0.0.0"
GOTO SIGUIENTE_PASO

:SIGUIENTE_PASO
REM Pequeña pausa para que los procesos no se pisen
ping 127.0.0.1 -n 3 > nul

REM --- 2. Iniciar el servidor de Backend (Eleonor AI) ---
ECHO [2/3] Iniciando el Backend de Eleonor AI (Puerto 8000)...
cd /d "%project_root%"
START "Eleonor AI Backend" cmd /k "call iniciar_backend_eleonor.bat"

ping 127.0.0.1 -n 2 > nul

ECHO.
ECHO ==================================================================
ECHO. 
ECHO   Servicios Iniciados:
IF "%mode%"=="2" (
    ECHO   - ACCESO RED: http://%LOCAL_IP%:3000
    ECHO   - BACKEND API: http://%LOCAL_IP%:8000
) ELSE (
    ECHO   - ACCESO LOCAL: http://localhost:3000
)
ECHO.
ECHO ==================================================================

pause
