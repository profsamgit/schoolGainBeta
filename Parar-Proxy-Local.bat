@echo off
title Parar Proxy Seguro ESP32-CAM - SchoolGain
echo =============================================================
echo 📡 PARANDO O PROXY SEGURO DA ESP32-CAM (PORTA 9005)
echo =============================================================
echo.

setlocal enabledelayedexpansion
set "found="

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9005 ^| findstr LISTENING') do (
    echo Finalizando o processo da camera (PID %%a)...
    taskkill /f /pid %%a
    set "found=1"
)

if not defined found (
    echo Nenhum processo ativo foi encontrado rodando na porta 9005.
) else (
    echo.
    echo O proxy foi encerrado com sucesso!
)

echo.
pause
