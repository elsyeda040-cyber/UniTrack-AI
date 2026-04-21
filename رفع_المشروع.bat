@echo off
title UniTrack AI - Github Uploader
color 0b

echo ===================================================
echo       UniTrack AI - Upload Project to GitHub
echo ===================================================
echo.

echo 1. Updating local Git configuration...
git config user.email "elsyeda040@gmail.com"
git config user.name "elsyeda040-cyber"

echo.
echo 2. Updating GitHub Repository URL...
git remote remove origin 2>nul
git remote add origin https://github.com/elsyeda040-cyber/UniTrack-AI.git

echo.
echo 3. Clearing old Windows Git credentials...
cmdkey /delete:LegacyGeneric:target=git:https://github.com >nul 2>&1

echo.
echo 4. Adding files...
git add .

echo.
echo 5. Committing changes...
git commit -m "System Launch Updates"

echo.
echo 6. Pushing to GitHub (A login popup might appear)...
git push -u origin main

echo.
echo ===================================================
echo               Upload Complete!
echo ===================================================
pause
