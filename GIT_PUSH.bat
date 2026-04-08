@echo off
echo UniTrack AI - Automatic Git Upload Script
echo ----------------------------------------
echo [1/3] Staging changes...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo Error during git add. Please check if Git is installed and initialized.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/3] Committing changes...
git commit -m "Finalize UniTrack AI features: Meeting Assistant, Code Mentor, and Dashboard Updates"
if %ERRORLEVEL% NEQ 0 (
    echo No changes to commit or error during commit.
)

echo [3/3] Pushing to remote...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo Error during git push. Please check your credentials and internet connection.
    pause
    exit /b %ERRORLEVEL%
)

echo ----------------------------------------
echo Success! All updates have been uploaded.
echo The platform should now be deploying automatically.
pause
