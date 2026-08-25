@echo off
title WhatsApp Auth - Resume Services
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\resume-docker.ps1'"
echo.
pause
