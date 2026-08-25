@echo off
title WhatsApp Auth - Suspend Services
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\pause-docker.ps1'"
echo.
pause
