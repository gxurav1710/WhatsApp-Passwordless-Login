@echo off
title WhatsApp Auth - Build All
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\build-all.ps1'"
echo.
pause
