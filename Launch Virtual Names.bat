@echo off
title Virtual Names - Privacy Identity Suite
if exist "%~dp0release\VirtualNames-1.0.0-Portable.exe" (
    start "" "%~dp0release\VirtualNames-1.0.0-Portable.exe"
    exit /b 0
)
if exist "%~dp0release\win-unpacked\Virtual Names.exe" (
    start "" "%~dp0release\win-unpacked\Virtual Names.exe"
    exit /b 0
)
if exist "%~dp0node_modules\electron\dist\electron.exe" (
    start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
    exit /b 0
)
echo Virtual Names executable not found. Please run "npm run dist:win" first.
pause
