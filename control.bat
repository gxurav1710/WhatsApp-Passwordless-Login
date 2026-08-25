@echo off
title WhatsApp Auth - Central Control Center
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\control.ps1'"
if %errorlevel% neq 0 (
    echo.
    pause
)
