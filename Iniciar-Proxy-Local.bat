@echo off
title Proxy Seguro ESP32-CAM - SchoolGain
cd /d "%~dp0"
echo =============================================================
echo 📡 INICIANDO O PROXY SEGURO DA ESP32-CAM (PORTA 9005)
echo =============================================================
echo.
echo Este terminal precisa ficar aberto para manter a transmissao da camera ativa.
echo.

if exist "scripts\camera-secure-proxy.js" (
    node scripts\camera-secure-proxy.js
) else if exist "camera-secure-proxy.js" (
    node camera-secure-proxy.js
) else (
    echo.
    echo [ERRO] Nao foi possivel encontrar o arquivo camera-secure-proxy.js.
    echo Certifique-se de que ele esta na pasta "scripts" ou na mesma pasta que este bat.
    echo.
    pause
    exit /b 1
)

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Nao foi possivel iniciar o proxy. 
    echo Certifique-se de que o Node.js esta instalado e acessivel no sistema (execute 'node -v' no cmd para testar).
    echo.
    pause
)
