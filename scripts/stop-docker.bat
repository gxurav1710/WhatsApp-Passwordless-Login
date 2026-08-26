@echo off
title WhatsApp Auth - Stop Services
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\stop-docker.ps1'"
echo.
pause
