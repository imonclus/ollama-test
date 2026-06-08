@echo off
:: Iniciar_Espacios Creativos Ollama.bat
title Lanzador de Espacios_Creativos_Ollama

echo ===================================================
echo    INICIANDO SERVICIO ESPACIOS CREATIVOS OLLAMA          
echo ===================================================
echo.
echo [1/2] Abriendo el cliente web en tu navegador...
start http://localhost:5000

echo [2/2] Levantando el servidor de Flask en WSL...
echo.
echo * Para apagar el servidor, cierra esta ventana o pulsa Ctrl + C.
echo.

wsl bash -c "cd /home/imonclus/projects/ollama-test && source venv/bin/activate && python3 app.py"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo iniciar el servidor en WSL.
    echo Asegúrate de tener activada tu máquina de WSL y la ruta configurada.
    pause
)
