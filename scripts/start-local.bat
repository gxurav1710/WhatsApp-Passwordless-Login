@echo off
title WhatsApp Auth - Start Local
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\start-local.ps1'"
echo.
pause
