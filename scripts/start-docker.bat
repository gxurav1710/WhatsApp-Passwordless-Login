@echo off
title WhatsApp Auth - Docker Startup
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\start-docker.ps1'"
echo.
pause
