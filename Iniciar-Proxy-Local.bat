@echo off
title Proxy Seguro ESP32-CAM - SchoolGain
cd /d "%~dp0"
echo =============================================================
echo 📡 INICIANDO O PROXY SEGURO DA ESP32-CAM (PORTA 9005)
echo =============================================================
echo.
echo Este terminal precisa ficar aberto para manter a transmissao da camera ativa.
echo.

node scripts/camera-secure-proxy.js

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Nao foi possivel iniciar o proxy. 
    echo Certifique-se de que o Node.js esta instalado e acessivel no sistema.
    echo.
    pause
)
